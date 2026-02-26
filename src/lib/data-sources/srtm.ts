import { BoundingBox } from "@/types/geo";

export interface SRTMTile {
  lat: number;
  lng: number;
  filename: string;
  url: string;
}

export interface SRTMSource {
  id: string;
  nameEn: string;
  nameTr: string;
  resolution: string;
  description: string;
  urlTemplate: string;
  fileExt: string;
}

export const srtmSources: SRTMSource[] = [
  {
    id: "aws-srtm",
    nameEn: "SRTM 30m (AWS Terrain Tiles)",
    nameTr: "SRTM 30m (AWS Terrain Tiles)",
    resolution: "30m (~1 arc-second)",
    description: "NASA SRTM via AWS Open Data, free, no API key",
    urlTemplate: "https://elevation-tiles-prod.s3.amazonaws.com/skadi/{ns}{lat}/{ns}{lat}{ew}{lng}.hgt.gz",
    fileExt: ".hgt.gz",
  },
  {
    id: "viewfinder-srtm3",
    nameEn: "SRTM 90m (Viewfinder Panoramas)",
    nameTr: "SRTM 90m (Viewfinder Panoramas)",
    resolution: "90m (~3 arc-second)",
    description: "Void-filled SRTM3 from viewfinderpanoramas.org",
    urlTemplate: "http://viewfinderpanoramas.org/dem3/{tile}.zip",
    fileExt: ".zip",
  },
];

/** Pad number to 2 digits */
function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Pad number to 3 digits */
function pad3(n: number): string {
  return n.toString().padStart(3, "0");
}

/** Get SRTM tile filename for a lat/lng (AWS format: N39E032.hgt.gz) */
export function getSRTMFilename(lat: number, lng: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  const absLat = pad2(Math.abs(Math.floor(lat)));
  const absLng = pad3(Math.abs(Math.floor(lng)));
  return `${ns}${absLat}${ew}${absLng}`;
}

/** Get all SRTM tiles needed for a bounding box */
export function getSRTMTilesForBbox(bbox: BoundingBox): SRTMTile[] {
  const tiles: SRTMTile[] = [];
  const latMin = Math.floor(bbox.south);
  const latMax = Math.floor(bbox.north);
  const lngMin = Math.floor(bbox.west);
  const lngMax = Math.floor(bbox.east);

  for (let lat = latMin; lat <= latMax; lat++) {
    for (let lng = lngMin; lng <= lngMax; lng++) {
      const ns = lat >= 0 ? "N" : "S";
      const ew = lng >= 0 ? "E" : "W";
      const absLat = pad2(Math.abs(lat));
      const absLng = pad3(Math.abs(lng));
      const filename = `${ns}${absLat}${ew}${absLng}`;

      tiles.push({
        lat,
        lng,
        filename,
        url: `https://elevation-tiles-prod.s3.amazonaws.com/skadi/${ns}${absLat}/${filename}.hgt.gz`,
      });
    }
  }

  return tiles;
}

/** Get Viewfinder Panoramas letter code for latitude band */
function getViewfinderCode(lat: number, lng: number): string {
  // Viewfinder uses letter codes based on lat/lng grid
  // This is simplified - actual mapping is more complex
  const ns = lat >= 0 ? "N" : "S";
  const absLat = pad2(Math.abs(Math.floor(lat)));
  const ew = lng >= 0 ? "E" : "W";
  const absLng = pad3(Math.abs(Math.floor(lng)));
  return `${ns}${absLat}${ew}${absLng}`;
}
