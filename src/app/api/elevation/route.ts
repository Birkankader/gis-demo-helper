import { NextRequest, NextResponse } from "next/server";
import { demTypes } from "@/lib/data-sources/opentopography";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const demtype = params.get("demtype");
  const south = params.get("south");
  const west = params.get("west");
  const north = params.get("north");
  const east = params.get("east");

  if (!demtype || !south || !west || !north || !east) {
    return NextResponse.json(
      { error: "Missing parameters: demtype, south, west, north, east" },
      { status: 400 }
    );
  }

  const validDem = demTypes.find((d) => d.id === demtype);
  if (!validDem) {
    return NextResponse.json({ error: `Invalid DEM type: ${demtype}` }, { status: 400 });
  }

  const apiKey = process.env.OPENTOPOGRAPHY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenTopography API key not configured. Set OPENTOPOGRAPHY_API_KEY in .env.local" },
      { status: 500 }
    );
  }

  // Check area size (OpenTopography has limits)
  const latDiff = Math.abs(parseFloat(north) - parseFloat(south));
  const lngDiff = Math.abs(parseFloat(east) - parseFloat(west));
  if (latDiff * lngDiff > 4) {
    return NextResponse.json(
      { error: "Selected area is too large for elevation data. Please select a smaller area (< ~2° x 2°)." },
      { status: 400 }
    );
  }

  const url = new URL("https://portal.opentopography.org/API/globaldem");
  url.searchParams.set("demtype", demtype);
  url.searchParams.set("south", south);
  url.searchParams.set("north", north);
  url.searchParams.set("west", west);
  url.searchParams.set("east", east);
  url.searchParams.set("outputFormat", "GTiff");
  url.searchParams.set("API_Key", apiKey);

  try {
    const res = await fetch(url.toString());

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `OpenTopography error (${res.status}): ${text.substring(0, 200)}` },
        { status: 502 }
      );
    }

    const blob = await res.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/tiff",
        "Content-Disposition": `attachment; filename="${demtype}_${south}_${west}_${north}_${east}.tif"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: `Failed to fetch elevation data: ${err.message}` }, { status: 500 });
  }
}
