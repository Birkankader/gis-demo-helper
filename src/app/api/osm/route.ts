import { NextRequest, NextResponse } from "next/server";
import { osmPresets } from "@/lib/data-sources/overpass";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const presetId = params.get("preset");
  const south = params.get("south");
  const west = params.get("west");
  const north = params.get("north");
  const east = params.get("east");
  const format = params.get("format") || "geojson";

  if (!presetId || !south || !west || !north || !east) {
    return NextResponse.json({ error: "Missing parameters: preset, south, west, north, east" }, { status: 400 });
  }

  const preset = osmPresets.find((p) => p.id === presetId);
  if (!preset) {
    return NextResponse.json({ error: `Unknown preset: ${presetId}` }, { status: 400 });
  }

  const bbox = {
    south: parseFloat(south),
    west: parseFloat(west),
    north: parseFloat(north),
    east: parseFloat(east),
  };

  // Check bbox size to prevent oversized queries
  const area = Math.abs((bbox.north - bbox.south) * (bbox.east - bbox.west));
  if (area > 1) {
    return NextResponse.json(
      { error: "Selected area is too large for OSM queries. Please select a smaller area (< ~100km²)." },
      { status: 400 }
    );
  }

  const overpassQuery = preset.query(bbox);
  const overpassUrl = process.env.OVERPASS_API_URL || "https://overpass-api.de/api/interpreter";

  try {
    const res = await fetch(overpassUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Overpass API error (${res.status}): ${text.substring(0, 200)}` },
        { status: 502 }
      );
    }

    const osmData = await res.json();

    // Convert OSM JSON to GeoJSON
    const geojson = osmToGeoJSON(osmData);

    if (format === "geojson") {
      return NextResponse.json(geojson);
    }

    if (format === "kml") {
      const kml = geojsonToKML(geojson);
      return new NextResponse(kml, {
        headers: {
          "Content-Type": "application/vnd.google-earth.kml+xml",
          "Content-Disposition": `attachment; filename="osm_${presetId}.kml"`,
        },
      });
    }

    // Default: return GeoJSON
    return NextResponse.json(geojson);
  } catch (err: any) {
    return NextResponse.json({ error: `Failed to fetch data: ${err.message}` }, { status: 500 });
  }
}

// Simple OSM JSON to GeoJSON converter
function osmToGeoJSON(osmData: any): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  if (!osmData.elements) {
    return { type: "FeatureCollection", features: [] };
  }

  // Index nodes for way resolution
  const nodeIndex = new Map<number, [number, number]>();
  for (const el of osmData.elements) {
    if (el.type === "node" && el.lat !== undefined && el.lon !== undefined) {
      nodeIndex.set(el.id, [el.lon, el.lat]);
    }
  }

  for (const el of osmData.elements) {
    if (el.type === "node" && el.lat !== undefined) {
      features.push({
        type: "Feature",
        properties: { id: el.id, ...el.tags },
        geometry: { type: "Point", coordinates: [el.lon, el.lat] },
      });
    } else if (el.type === "way") {
      let coordinates: [number, number][] = [];

      if (el.geometry) {
        // out geom format
        coordinates = el.geometry.map((g: any) => [g.lon, g.lat]);
      } else if (el.nodes) {
        // resolve from node index
        coordinates = el.nodes
          .map((nid: number) => nodeIndex.get(nid))
          .filter(Boolean) as [number, number][];
      }

      if (coordinates.length < 2) continue;

      const isClosed =
        coordinates.length >= 4 &&
        coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
        coordinates[0][1] === coordinates[coordinates.length - 1][1];

      features.push({
        type: "Feature",
        properties: { id: el.id, ...el.tags },
        geometry: isClosed
          ? { type: "Polygon", coordinates: [coordinates] }
          : { type: "LineString", coordinates },
      });
    }
  }

  return { type: "FeatureCollection", features };
}

// Simple GeoJSON to KML converter
function geojsonToKML(geojson: GeoJSON.FeatureCollection): string {
  let placemarks = "";

  for (const feature of geojson.features) {
    const name = feature.properties?.name || feature.properties?.id || "";
    const geom = feature.geometry;
    let kmlGeom = "";

    if (geom.type === "Point") {
      kmlGeom = `<Point><coordinates>${geom.coordinates[0]},${geom.coordinates[1]}</coordinates></Point>`;
    } else if (geom.type === "LineString") {
      const coords = geom.coordinates.map((c: number[]) => `${c[0]},${c[1]}`).join(" ");
      kmlGeom = `<LineString><coordinates>${coords}</coordinates></LineString>`;
    } else if (geom.type === "Polygon") {
      const coords = geom.coordinates[0].map((c: number[]) => `${c[0]},${c[1]}`).join(" ");
      kmlGeom = `<Polygon><outerBoundaryIs><LinearRing><coordinates>${coords}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
    }

    if (kmlGeom) {
      placemarks += `<Placemark><name>${escapeXml(String(name))}</name>${kmlGeom}</Placemark>\n`;
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
<name>GIS Data Export</name>
${placemarks}
</Document>
</kml>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
