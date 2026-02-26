import { BoundingBox } from "@/types/geo";

export interface TerrainSource {
  id: string;
  nameEn: string;
  nameTr: string;
  resolution: string;
  descriptionEn: string;
  descriptionTr: string;
  formats: TerrainFormat[];
  coverage: string;
}

export interface TerrainFormat {
  id: string;
  label: string;
  ext: string;
  mime: string;
}

export interface TerrainTile {
  lat: number;
  lng: number;
  filename: string;
  url: string;
  format: string;
  source: string;
}

/** Pad number to 2 digits */
function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Pad number to 3 digits */
function pad3(n: number): string {
  return n.toString().padStart(3, "0");
}

// ── Available terrain data sources ──────────────────────────────────────────

export const terrainSources: TerrainSource[] = [
  {
    id: "srtm-hgt",
    nameEn: "SRTM 30m (HGT)",
    nameTr: "SRTM 30m (HGT)",
    resolution: "~30m (1 arc-second)",
    descriptionEn: "NASA SRTM via AWS. Raw HGT format, 1°×1° tiles.",
    descriptionTr: "AWS üzerinden NASA SRTM. Ham HGT formatı, 1°×1° tile'lar.",
    formats: [{ id: "hgt", label: "HGT (.hgt.gz)", ext: ".hgt.gz", mime: "application/gzip" }],
    coverage: "60°N – 56°S",
  },
  {
    id: "copernicus-30m",
    nameEn: "Copernicus DEM 30m (GeoTIFF)",
    nameTr: "Copernicus DEM 30m (GeoTIFF)",
    resolution: "~30m (1 arc-second)",
    descriptionEn: "Copernicus GLO-30 DEM from AWS Open Data. Cloud-optimized GeoTIFF.",
    descriptionTr: "AWS Open Data'dan Copernicus GLO-30 DEM. Cloud-optimized GeoTIFF.",
    formats: [{ id: "tif", label: "GeoTIFF (.tif)", ext: ".tif", mime: "image/tiff" }],
    coverage: "Global (90°N – 90°S)",
  },
  {
    id: "copernicus-90m",
    nameEn: "Copernicus DEM 90m (GeoTIFF)",
    nameTr: "Copernicus DEM 90m (GeoTIFF)",
    resolution: "~90m (3 arc-second)",
    descriptionEn: "Copernicus GLO-90 DEM. Smaller files, global coverage.",
    descriptionTr: "Copernicus GLO-90 DEM. Daha küçük dosyalar, küresel kapsam.",
    formats: [{ id: "tif", label: "GeoTIFF (.tif)", ext: ".tif", mime: "image/tiff" }],
    coverage: "Global (90°N – 90°S)",
  },
  {
    id: "viewfinder-90m",
    nameEn: "ViewFinder Panoramas 90m (HGT)",
    nameTr: "ViewFinder Panoramas 90m (HGT)",
    resolution: "~90m (3 arc-second)",
    descriptionEn: "Void-filled SRTM3 from ViewFinderPanoramas. HGT in ZIP.",
    descriptionTr: "ViewFinderPanoramas'dan boşluksuz SRTM3. ZIP içinde HGT.",
    formats: [{ id: "hgt-zip", label: "HGT (.hgt.zip)", ext: ".hgt.zip", mime: "application/zip" }],
    coverage: "Global",
  },
];

// ── SRTM HGT tiles (AWS) ──────────────────────────────────────────────────

export function getSRTMHGTUrl(lat: number, lng: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  const absLat = pad2(Math.abs(lat));
  const absLng = pad3(Math.abs(lng));
  return `https://elevation-tiles-prod.s3.amazonaws.com/skadi/${ns}${absLat}/${ns}${absLat}${ew}${absLng}.hgt.gz`;
}

// ── Copernicus DEM tiles (AWS Open Data) ───────────────────────────────────
// Copernicus DEM 30m: s3://copernicus-dem-30m/
// URL pattern: Copernicus_DSM_COG_10_{N|S}{lat}_00_{E|W}{lng}_00_DEM/
//   └─ Copernicus_DSM_COG_10_{N|S}{lat}_00_{E|W}{lng}_00_DEM.tif
//
// Copernicus DEM 90m: s3://copernicus-dem-90m/
// URL pattern: Copernicus_DSM_COG_30_{N|S}{lat}_00_{E|W}{lng}_00_DEM/
//   └─ Copernicus_DSM_COG_30_{N|S}{lat}_00_{E|W}{lng}_00_DEM.tif

export function getCopernicusDEMUrl(lat: number, lng: number, resolution: "30m" | "90m"): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  const absLat = pad2(Math.abs(lat));
  const absLng = pad3(Math.abs(lng));
  const res = resolution === "30m" ? "10" : "30";
  const tileId = `Copernicus_DSM_COG_${res}_${ns}${absLat}_00_${ew}${absLng}_00_DEM`;
  // 30m bucket: no region needed; 90m bucket: eu-central-1
  const baseUrl = resolution === "30m"
    ? `https://copernicus-dem-30m.s3.amazonaws.com`
    : `https://copernicus-dem-90m.s3.eu-central-1.amazonaws.com`;
  return `${baseUrl}/${tileId}/${tileId}.tif`;
}

// ── AWS Terrain Tiles GeoTIFF (zoom/x/y) ──────────────────────────────────
// URL: https://elevation-tiles-prod.s3.amazonaws.com/geotiff/{z}/{x}/{y}.tif

export function getAWSTerrainTileUrl(z: number, x: number, y: number): string {
  return `https://elevation-tiles-prod.s3.amazonaws.com/geotiff/${z}/${x}/${y}.tif`;
}

// ── Get all terrain tiles for a bbox ───────────────────────────────────────

export function getTerrainTilesForBbox(
  bbox: BoundingBox,
  sourceId: string
): TerrainTile[] {
  const tiles: TerrainTile[] = [];
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

      let url: string;
      let format: string;

      switch (sourceId) {
        case "srtm-hgt":
          url = getSRTMHGTUrl(lat, lng);
          format = "hgt";
          break;
        case "copernicus-30m":
          url = getCopernicusDEMUrl(lat, lng, "30m");
          format = "tif";
          break;
        case "copernicus-90m":
          url = getCopernicusDEMUrl(lat, lng, "90m");
          format = "tif";
          break;
        case "viewfinder-90m":
          url = `https://bailu.ch/dem3/${ns}${absLat}/${ns}${absLat}${ew}${absLng}.hgt.zip`;
          format = "hgt-zip";
          break;
        default:
          url = getSRTMHGTUrl(lat, lng);
          format = "hgt";
      }

      tiles.push({
        lat,
        lng,
        filename,
        url,
        format,
        source: sourceId,
      });
    }
  }

  return tiles;
}

/** Estimated file size per tile */
export function estimateTerrainTileSize(sourceId: string): number {
  switch (sourceId) {
    case "srtm-hgt": return 2.8 * 1024 * 1024; // ~2.8 MB compressed HGT
    case "copernicus-30m": return 5.5 * 1024 * 1024; // ~5.5 MB COG
    case "copernicus-90m": return 0.8 * 1024 * 1024; // ~0.8 MB COG
    case "viewfinder-90m": return 2.5 * 1024 * 1024; // ~2.5 MB zipped HGT
    default: return 2.8 * 1024 * 1024;
  }
}

/** Get filename extension for source */
export function getTerrainFileExt(sourceId: string): string {
  switch (sourceId) {
    case "srtm-hgt": return ".hgt.gz";
    case "copernicus-30m":
    case "copernicus-90m": return ".tif";
    case "viewfinder-90m": return ".hgt.zip";
    default: return ".hgt.gz";
  }
}
