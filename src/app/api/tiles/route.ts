import { NextRequest, NextResponse } from "next/server";
import { tileSources, resolveTileUrl } from "@/lib/tile-sources";
import { bboxToTiles, countTiles } from "@/lib/tile-math";
import { robustFetch } from "@/lib/fetch";

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

  // Action: single tile proxy (used by tile download and basemap switching)
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
      const res = await robustFetch(url, {
        headers: { "User-Agent": "GIS-Demo-Helper/1.0" },
        timeout: 15_000,
        retries: 1,
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

  return NextResponse.json({ error: "Missing action parameter. Use: count or proxy" }, { status: 400 });
}
