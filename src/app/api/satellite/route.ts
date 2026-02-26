import { NextRequest, NextResponse } from "next/server";
import { robustFetch } from "@/lib/fetch";

// Sentinel-2 STAC via Element84 Earth Search (no auth needed)
const EARTH_SEARCH_API = "https://earth-search.aws.element84.com/v1";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const action = params.get("action") || "search";
  const source = params.get("source") || "sentinel2-cog";

  // Action: proxy - proxy a COG file download
  if (action === "proxy") {
    const fileUrl = params.get("url");
    if (!fileUrl) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // Only allow S3/AWS URLs for safety
    const allowed = [
      "sentinel-cogs.s3",
      "landsatlook.usgs.gov",
      "usgs-landsat",
      "earth-search",
    ];
    if (!allowed.some((domain) => fileUrl.includes(domain))) {
      return NextResponse.json({ error: "URL not allowed. Only satellite data sources permitted." }, { status: 403 });
    }

    try {
      const res = await robustFetch(fileUrl, {
        headers: { "User-Agent": "GIS-Demo-Helper/1.0" },
        timeout: 120_000,
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: `Failed to fetch file (${res.status})` },
          { status: 502 }
        );
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const filename = fileUrl.split("/").pop() || "satellite_data.tif";

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "image/tiff",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": buffer.length.toString(),
        },
      });
    } catch (err: any) {
      return NextResponse.json({ error: `Download failed: ${err.message}` }, { status: 500 });
    }
  }

  // Action: search - search for satellite scenes
  const south = params.get("south");
  const west = params.get("west");
  const north = params.get("north");
  const east = params.get("east");
  const maxCloud = parseInt(params.get("maxCloud") || "20");
  const limit = Math.min(parseInt(params.get("limit") || "10"), 20);
  const dateFrom = params.get("dateFrom");
  const dateTo = params.get("dateTo");

  if (!south || !west || !north || !east) {
    return NextResponse.json(
      { error: "Missing parameters: south, west, north, east" },
      { status: 400 }
    );
  }

  const bbox = [parseFloat(west), parseFloat(south), parseFloat(east), parseFloat(north)];

  // Default date range: last 3 months
  const now = new Date();
  const from = dateFrom || new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split("T")[0];
  const to = dateTo || now.toISOString().split("T")[0];

  if (source === "sentinel2-cog") {
    try {
      const body = {
        collections: ["sentinel-2-l2a"],
        bbox,
        datetime: `${from}T00:00:00Z/${to}T23:59:59Z`,
        limit,
        query: {
          "eo:cloud_cover": { lte: maxCloud },
        },
        sortby: [{ field: "properties.datetime", direction: "desc" }],
      };

      const res = await robustFetch(`${EARTH_SEARCH_API}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return NextResponse.json(
          { error: `STAC search failed: ${res.status} ${text.slice(0, 200)}` },
          { status: 502 }
        );
      }

      const data = await res.json();

      // Simplify the response
      const scenes = (data.features || []).map((item: any) => ({
        id: item.id,
        datetime: item.properties?.datetime,
        cloudCover: item.properties?.["eo:cloud_cover"],
        platform: item.properties?.["platform"],
        thumbnail: item.assets?.thumbnail?.href,
        visual: item.assets?.visual?.href,
        red: item.assets?.red?.href,
        green: item.assets?.green?.href,
        blue: item.assets?.blue?.href,
        nir: item.assets?.nir?.href,
        scl: item.assets?.scl?.href,
        bbox: item.bbox,
      }));

      return NextResponse.json({
        source: "sentinel2-cog",
        sceneCount: scenes.length,
        totalMatched: data.numberMatched || scenes.length,
        scenes,
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: `Sentinel-2 search failed: ${err.message}` },
        { status: 500 }
      );
    }
  }

  if (source === "landsat-cog") {
    try {
      const body = {
        collections: ["landsat-c2l2-sr"],
        bbox,
        datetime: `${from}T00:00:00Z/${to}T23:59:59Z`,
        limit,
        query: {
          "eo:cloud_cover": { lte: maxCloud },
        },
      };

      const res = await robustFetch("https://landsatlook.usgs.gov/stac-server/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return NextResponse.json(
          { error: `Landsat STAC search failed: ${res.status} ${text.slice(0, 200)}` },
          { status: 502 }
        );
      }

      const data = await res.json();

      const scenes = (data.features || []).map((item: any) => ({
        id: item.id,
        datetime: item.properties?.datetime,
        cloudCover: item.properties?.["eo:cloud_cover"],
        platform: item.properties?.["platform"],
        thumbnail: item.assets?.thumbnail?.href || item.assets?.browse?.href,
        red: item.assets?.red?.href,
        green: item.assets?.green?.href,
        blue: item.assets?.blue?.href,
        nir08: item.assets?.nir08?.href,
        bbox: item.bbox,
      }));

      return NextResponse.json({
        source: "landsat-cog",
        sceneCount: scenes.length,
        totalMatched: data.numberMatched || scenes.length,
        scenes,
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: `Landsat search failed: ${err.message}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Invalid source. Use: sentinel2-cog or landsat-cog" }, { status: 400 });
}
