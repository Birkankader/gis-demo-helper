import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  // Proxy mode for WMS/WFS capabilities
  const proxyUrl = params.get("proxy");
  if (proxyUrl) {
    try {
      const res = await fetch(proxyUrl);
      const text = await res.text();
      return new NextResponse(text, {
        headers: { "Content-Type": res.headers.get("Content-Type") || "text/xml" },
      });
    } catch (err: any) {
      return NextResponse.json({ error: `Proxy fetch failed: ${err.message}` }, { status: 502 });
    }
  }

  // Geocoding mode
  const q = params.get("q");
  if (!q) {
    return NextResponse.json({ error: "Missing parameter: q" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`,
      {
        headers: {
          "User-Agent": "GIS-Demo-Helper/1.0",
          Accept: "application/json",
        },
      }
    );

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: `Geocoding failed: ${err.message}` }, { status: 500 });
  }
}
