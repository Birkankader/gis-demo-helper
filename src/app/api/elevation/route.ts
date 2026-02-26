import { NextRequest, NextResponse } from "next/server";
import {
  getTerrainTilesForBbox,
  getTerrainFileExt,
} from "@/lib/data-sources/terrain";
import { robustFetch } from "@/lib/fetch";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const south = params.get("south");
  const west = params.get("west");
  const north = params.get("north");
  const east = params.get("east");
  const action = params.get("action") || "download";
  const source = params.get("source") || "srtm-hgt";

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

  const tiles = getTerrainTilesForBbox(bbox, source);

  // Action: list - return the tile list with metadata
  if (action === "list") {
    return NextResponse.json({
      source,
      tileCount: tiles.length,
      fileExt: getTerrainFileExt(source),
      tiles: tiles.map((t) => ({
        filename: t.filename,
        url: t.url,
        lat: t.lat,
        lng: t.lng,
        format: t.format,
      })),
    });
  }

  // Action: download - download a single terrain tile (proxy)
  if (action === "download") {
    const tileFilename = params.get("tile");

    if (tileFilename) {
      const tile = tiles.find((t) => t.filename === tileFilename);
      if (!tile) {
        return NextResponse.json({ error: `Tile not found: ${tileFilename}` }, { status: 404 });
      }

      try {
        const res = await robustFetch(tile.url, {
          headers: { "User-Agent": "GIS-Demo-Helper/1.0" },
          timeout: 120_000,
        });

        if (!res.ok) {
          return NextResponse.json(
            { error: `Failed to fetch terrain tile ${tile.filename} (${res.status}). This tile may not exist for ocean/polar areas.` },
            { status: 502 }
          );
        }

        const buffer = Buffer.from(await res.arrayBuffer());
        const ext = getTerrainFileExt(source);
        const mime = tile.format === "tif" ? "image/tiff" :
                     tile.url.endsWith(".gz") ? "application/gzip" : "application/octet-stream";

        return new NextResponse(buffer, {
          headers: {
            "Content-Type": mime,
            "Content-Disposition": `attachment; filename="${tile.filename}${ext}"`,
            "Content-Length": buffer.length.toString(),
          },
        });
      } catch (err: any) {
        return NextResponse.json(
          { error: `Failed to download terrain tile: ${err.message}` },
          { status: 500 }
        );
      }
    }

    // No specific tile: check availability of all tiles via HEAD
    const results: { filename: string; url: string; format: string; size?: number; error?: string }[] = [];

    for (const tile of tiles) {
      try {
        const res = await robustFetch(tile.url, {
          method: "HEAD",
          headers: { "User-Agent": "GIS-Demo-Helper/1.0" },
          timeout: 10_000,
          retries: 1,
        });

        if (res.ok) {
          const size = parseInt(res.headers.get("content-length") || "0");
          results.push({ filename: tile.filename, url: tile.url, format: tile.format, size });
        } else {
          results.push({ filename: tile.filename, url: tile.url, format: tile.format, error: `HTTP ${res.status}` });
        }
      } catch (err: any) {
        results.push({ filename: tile.filename, url: tile.url, format: tile.format, error: err.message });
      }
    }

    return NextResponse.json({
      source,
      tileCount: tiles.length,
      availableCount: results.filter((r) => !r.error).length,
      tiles: results,
    });
  }

  return NextResponse.json({ error: "Invalid action. Use: list or download" }, { status: 400 });
}
