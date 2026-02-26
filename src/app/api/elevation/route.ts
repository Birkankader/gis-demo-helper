import { NextRequest, NextResponse } from "next/server";
import { getSRTMTilesForBbox } from "@/lib/data-sources/srtm";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const south = params.get("south");
  const west = params.get("west");
  const north = params.get("north");
  const east = params.get("east");
  const action = params.get("action") || "download";

  if (!south || !west || !north || !east) {
    return NextResponse.json(
      { error: "Missing parameters: south, west, north, east" },
      { status: 400 }
    );
  }

  const bbox = {
    south: parseFloat(south),
    west: parseFloat(west),
    north: parseFloat(north),
    east: parseFloat(east),
  };

  // Check area size
  const latDiff = Math.abs(bbox.north - bbox.south);
  const lngDiff = Math.abs(bbox.east - bbox.west);
  if (latDiff * lngDiff > 25) {
    return NextResponse.json(
      { error: "Selected area is too large. Please select a smaller area (< ~5° x 5°)." },
      { status: 400 }
    );
  }

  const tiles = getSRTMTilesForBbox(bbox);

  // Action: list - just return the tile list (for preview/info)
  if (action === "list") {
    return NextResponse.json({
      tileCount: tiles.length,
      tiles: tiles.map((t) => ({
        filename: t.filename,
        url: t.url,
        lat: t.lat,
        lng: t.lng,
      })),
    });
  }

  // Action: download - download a single SRTM tile
  if (action === "download") {
    const tileFilename = params.get("tile");

    if (tileFilename) {
      // Download specific tile
      const tile = tiles.find((t) => t.filename === tileFilename);
      if (!tile) {
        return NextResponse.json({ error: `Tile not found: ${tileFilename}` }, { status: 404 });
      }

      try {
        const res = await fetch(tile.url, {
          headers: { "User-Agent": "GIS-Demo-Helper/1.0" },
        });

        if (!res.ok) {
          return NextResponse.json(
            { error: `Failed to fetch SRTM tile ${tile.filename} (${res.status}). This tile may not exist for ocean areas.` },
            { status: 502 }
          );
        }

        const buffer = Buffer.from(await res.arrayBuffer());
        const contentType = tile.url.endsWith(".gz")
          ? "application/gzip"
          : "application/octet-stream";

        return new NextResponse(buffer, {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${tile.filename}.hgt.gz"`,
            "Content-Length": buffer.length.toString(),
          },
        });
      } catch (err: any) {
        return NextResponse.json(
          { error: `Failed to download SRTM tile: ${err.message}` },
          { status: 500 }
        );
      }
    }

    // Download all tiles for bbox (one by one, return info)
    const results: { filename: string; url: string; size?: number; error?: string }[] = [];

    for (const tile of tiles) {
      try {
        const res = await fetch(tile.url, {
          method: "HEAD",
          headers: { "User-Agent": "GIS-Demo-Helper/1.0" },
        });

        if (res.ok) {
          const size = parseInt(res.headers.get("content-length") || "0");
          results.push({ filename: tile.filename, url: tile.url, size });
        } else {
          results.push({ filename: tile.filename, url: tile.url, error: `HTTP ${res.status}` });
        }
      } catch (err: any) {
        results.push({ filename: tile.filename, url: tile.url, error: err.message });
      }
    }

    return NextResponse.json({
      tileCount: tiles.length,
      availableCount: results.filter((r) => !r.error).length,
      tiles: results,
    });
  }

  return NextResponse.json({ error: "Invalid action. Use: list or download" }, { status: 400 });
}
