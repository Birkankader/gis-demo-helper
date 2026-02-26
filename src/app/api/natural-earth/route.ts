import { NextRequest, NextResponse } from "next/server";
import { naturalEarthDatasets, getNaturalEarthUrl } from "@/lib/data-sources/natural-earth";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const datasetId = params.get("dataset");
  const scale = params.get("scale") || "110m";
  const format = params.get("format") || "geojson";

  if (!datasetId) {
    return NextResponse.json({ error: "Missing parameter: dataset" }, { status: 400 });
  }

  const dataset = naturalEarthDatasets.find((d) => d.id === datasetId);
  if (!dataset) {
    return NextResponse.json({ error: `Unknown dataset: ${datasetId}` }, { status: 400 });
  }

  const effectiveScale = dataset.scales.includes(scale) ? scale : dataset.scales[dataset.scales.length - 1];
  const url = getNaturalEarthUrl(dataset, effectiveScale);

  try {
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch Natural Earth data (${res.status})` },
        { status: 502 }
      );
    }

    const geojson = await res.json();

    if (format === "geojson") {
      return NextResponse.json(geojson);
    }

    if (format === "kml") {
      const kml = geojsonToKML(geojson);
      return new NextResponse(kml, {
        headers: {
          "Content-Type": "application/vnd.google-earth.kml+xml",
          "Content-Disposition": `attachment; filename="ne_${effectiveScale}_${dataset.filename}.kml"`,
        },
      });
    }

    return NextResponse.json(geojson);
  } catch (err: any) {
    return NextResponse.json({ error: `Failed to fetch data: ${err.message}` }, { status: 500 });
  }
}

function geojsonToKML(geojson: any): string {
  let placemarks = "";

  for (const feature of geojson.features || []) {
    const name = feature.properties?.NAME || feature.properties?.name || "";
    const geom = feature.geometry;
    let kmlGeom = "";

    if (geom.type === "Point") {
      kmlGeom = `<Point><coordinates>${geom.coordinates[0]},${geom.coordinates[1]}</coordinates></Point>`;
    } else if (geom.type === "LineString" || geom.type === "MultiLineString") {
      const lines = geom.type === "LineString" ? [geom.coordinates] : geom.coordinates;
      kmlGeom = lines.map((line: number[][]) => {
        const coords = line.map((c: number[]) => `${c[0]},${c[1]}`).join(" ");
        return `<LineString><coordinates>${coords}</coordinates></LineString>`;
      }).join("");
      if (lines.length > 1) kmlGeom = `<MultiGeometry>${kmlGeom}</MultiGeometry>`;
    } else if (geom.type === "Polygon" || geom.type === "MultiPolygon") {
      const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
      kmlGeom = polys.map((poly: number[][][]) => {
        const outer = poly[0].map((c: number[]) => `${c[0]},${c[1]}`).join(" ");
        return `<Polygon><outerBoundaryIs><LinearRing><coordinates>${outer}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
      }).join("");
      if (polys.length > 1) kmlGeom = `<MultiGeometry>${kmlGeom}</MultiGeometry>`;
    }

    if (kmlGeom) {
      placemarks += `<Placemark><name>${escapeXml(String(name))}</name>${kmlGeom}</Placemark>\n`;
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
<name>Natural Earth Data</name>
${placemarks}
</Document>
</kml>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
