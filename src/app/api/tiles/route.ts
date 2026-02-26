import { NextRequest, NextResponse } from "next/server";
import { tileSources, resolveTileUrl } from "@/lib/tile-sources";
import { bboxToTiles, countTiles, TileCoord } from "@/lib/tile-math";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const action = params.get("action");

  // Action: count - return tile count for planning
  if (action === "count") {
    const south = parseFloat(params.get("south") || "0");
    const west = parseFloat(params.get("west") || "0");
    const north = parseFloat(params.get("north") || "0");
    const east = parseFloat(params.get("east") || "0");
    const zoomMin = parseInt(params.get("zoomMin") || "10");
    const zoomMax = parseInt(params.get("zoomMax") || "14");

    const count = countTiles({ south, west, north, east }, zoomMin, zoomMax);
    return NextResponse.json({ count, estimatedSizeMB: Math.round((count * 15) / 1024) });
  }

  // Action: download - stream tiles as a downloadable archive
  if (action === "download") {
    const sourceId = params.get("source") || "osm-standard";
    const south = parseFloat(params.get("south") || "0");
    const west = parseFloat(params.get("west") || "0");
    const north = parseFloat(params.get("north") || "0");
    const east = parseFloat(params.get("east") || "0");
    const zoomMin = parseInt(params.get("zoomMin") || "10");
    const zoomMax = parseInt(params.get("zoomMax") || "14");

    const source = tileSources.find((s) => s.id === sourceId);
    if (!source) {
      return NextResponse.json({ error: `Unknown tile source: ${sourceId}` }, { status: 400 });
    }

    const tiles = bboxToTiles({ south, west, north, east }, zoomMin, zoomMax);

    // Limit to prevent abuse
    if (tiles.length > 5000) {
      return NextResponse.json(
        { error: "Too many tiles requested. Please select a smaller area or fewer zoom levels. Max 5000 tiles per request." },
        { status: 400 }
      );
    }

    if (tiles.length === 0) {
      return NextResponse.json({ error: "No tiles in selected area" }, { status: 400 });
    }

    // Download tiles and return as JSON with base64 data
    // (for browser-side ZIP creation)
    const results: { path: string; data: string; error?: string }[] = [];
    const CONCURRENT = 3;
    const DELAY_MS = 100;

    for (let i = 0; i < tiles.length; i += CONCURRENT) {
      const batch = tiles.slice(i, i + CONCURRENT);
      const promises = batch.map(async (tile) => {
        const url = resolveTileUrl(source, tile.z, tile.x, tile.y);
        try {
          const res = await fetch(url, {
            headers: { "User-Agent": "GIS-Demo-Helper/1.0" },
          });
          if (!res.ok) {
            return { path: `${tile.z}/${tile.x}/${tile.y}.png`, data: "", error: `HTTP ${res.status}` };
          }
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          return { path: `${tile.z}/${tile.x}/${tile.y}.png`, data: base64 };
        } catch (err: any) {
          return { path: `${tile.z}/${tile.x}/${tile.y}.png`, data: "", error: err.message };
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);

      // Rate limiting delay between batches
      if (i + CONCURRENT < tiles.length) {
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }

    const successful = results.filter((r) => r.data);
    return NextResponse.json({
      source: source.id,
      sourceName: source.nameEn,
      tileCount: tiles.length,
      successCount: successful.length,
      tiles: results,
    });
  }

  // Action: single tile proxy (for basemap switching)
  if (action === "proxy") {
    const sourceId = params.get("source") || "osm-standard";
    const z = parseInt(params.get("z") || "0");
    const x = parseInt(params.get("x") || "0");
    const y = parseInt(params.get("y") || "0");

    const source = tileSources.find((s) => s.id === sourceId);
    if (!source) {
      return NextResponse.json({ error: "Unknown source" }, { status: 400 });
    }

    const url = resolveTileUrl(source, z, x, y);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "GIS-Demo-Helper/1.0" },
      });
      if (!res.ok) {
        return new NextResponse(null, { status: res.status });
      }
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": res.headers.get("Content-Type") || "image/png",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      return new NextResponse(null, { status: 502 });
    }
  }

  return NextResponse.json({ error: "Missing action parameter. Use: count, download, or proxy" }, { status: 400 });
}
