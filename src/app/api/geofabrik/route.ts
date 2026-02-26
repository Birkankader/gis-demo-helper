import { NextRequest, NextResponse } from "next/server";
import { geofabrikRegions, getGeofabrikShapefileUrl, getGeofabrikPbfUrl } from "@/lib/data-sources/geofabrik";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const regionId = params.get("region");
  const format = params.get("format") || "shp";

  if (!regionId) {
    // Return available regions
    return NextResponse.json({
      regions: geofabrikRegions.map((r) => ({
        id: r.id,
        nameEn: r.nameEn,
        nameTr: r.nameTr,
        hasShapefile: r.hasShapefile,
        hasPbf: r.hasPbf,
      })),
    });
  }

  const region = geofabrikRegions.find((r) => r.id === regionId);
  if (!region) {
    return NextResponse.json({ error: `Unknown region: ${regionId}` }, { status: 400 });
  }

  let downloadUrl: string;

  if (format === "pbf") {
    downloadUrl = getGeofabrikPbfUrl(region);
  } else {
    if (!region.hasShapefile) {
      return NextResponse.json(
        { error: `Shapefile not available for ${region.nameEn}. Try PBF format.` },
        { status: 400 }
      );
    }
    downloadUrl = getGeofabrikShapefileUrl(region);
  }

  // Redirect to Geofabrik download URL
  return NextResponse.redirect(downloadUrl, 302);
}
