import { BoundingBox } from "@/types/geo";

export interface SatelliteSource {
  id: string;
  nameEn: string;
  nameTr: string;
  resolution: string;
  descriptionEn: string;
  descriptionTr: string;
  type: "tiles" | "scenes";
  format: string;
}

export interface SatelliteResult {
  id: string;
  title: string;
  date: string;
  cloudCover?: number;
  thumbnailUrl?: string;
  downloadUrl: string;
  format: string;
  source: string;
}

export const satelliteSources: SatelliteSource[] = [
  {
    id: "esri-imagery-tiles",
    nameEn: "ESRI World Imagery (Tiles)",
    nameTr: "ESRI Dünya Uydu Görüntüleri (Tile)",
    resolution: "~0.3–1m (varies)",
    descriptionEn: "High-res satellite imagery tiles from ESRI. Download as PNG/JPG tiles.",
    descriptionTr: "ESRI'den yüksek çözünürlüklü uydu görüntüsü tile'ları. PNG/JPG olarak indir.",
    type: "tiles",
    format: "png",
  },
  {
    id: "sentinel2-cog",
    nameEn: "Sentinel-2 L2A (GeoTIFF)",
    nameTr: "Sentinel-2 L2A (GeoTIFF)",
    resolution: "10m (RGB), 20m (NIR)",
    descriptionEn: "Free Copernicus Sentinel-2 scenes via Element84 Earth Search. Cloud-optimized GeoTIFF.",
    descriptionTr: "Element84 Earth Search üzerinden ücretsiz Copernicus Sentinel-2. Cloud-optimized GeoTIFF.",
    type: "scenes",
    format: "tif",
  },
  {
    id: "landsat-cog",
    nameEn: "Landsat 8/9 (GeoTIFF)",
    nameTr: "Landsat 8/9 (GeoTIFF)",
    resolution: "30m (multispectral), 15m (pan)",
    descriptionEn: "USGS Landsat Collection 2 Level 2 via USGS. Cloud-optimized GeoTIFF.",
    descriptionTr: "USGS üzerinden Landsat Collection 2 Level 2. Cloud-optimized GeoTIFF.",
    type: "scenes",
    format: "tif",
  },
];

// ── Sentinel-2 via Element84 Earth Search STAC ─────────────────────────────
// STAC API: https://earth-search.aws.element84.com/v1
// Collection: sentinel-2-l2a
// COG files on S3 are publicly accessible without auth

const EARTH_SEARCH_API = "https://earth-search.aws.element84.com/v1";

export interface STACItem {
  id: string;
  properties: {
    datetime: string;
    "eo:cloud_cover"?: number;
    [key: string]: any;
  };
  assets: Record<string, {
    href: string;
    type?: string;
    title?: string;
    [key: string]: any;
  }>;
  bbox?: number[];
}

export interface STACSearchResult {
  type: string;
  features: STACItem[];
  numberMatched?: number;
  numberReturned?: number;
}

export async function searchSentinel2(
  bbox: BoundingBox,
  options?: { maxCloudCover?: number; limit?: number; dateFrom?: string; dateTo?: string }
): Promise<STACSearchResult> {
  const maxCloud = options?.maxCloudCover ?? 20;
  const limit = options?.limit ?? 10;
  const now = new Date();
  const dateFrom = options?.dateFrom ?? new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split("T")[0];
  const dateTo = options?.dateTo ?? now.toISOString().split("T")[0];

  const body = {
    collections: ["sentinel-2-l2a"],
    bbox: [bbox.west, bbox.south, bbox.east, bbox.north],
    datetime: `${dateFrom}T00:00:00Z/${dateTo}T23:59:59Z`,
    limit,
    query: {
      "eo:cloud_cover": { lte: maxCloud },
    },
    sortby: [{ field: "properties.datetime", direction: "desc" }],
  };

  const res = await fetch(`${EARTH_SEARCH_API}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`STAC search failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/** Get Sentinel-2 TCI (True Color Image) download URL from a STAC item */
export function getSentinel2TciUrl(item: STACItem): string | null {
  // TCI = True Color Image (RGB composite, visual)
  const tci = item.assets?.visual || item.assets?.["visual"] || item.assets?.["tci"];
  return tci?.href || null;
}

/** Get all useful band URLs from a Sentinel-2 STAC item */
export function getSentinel2Bands(item: STACItem): { band: string; url: string; title: string }[] {
  const bands: { band: string; url: string; title: string }[] = [];
  const interestingBands = ["visual", "red", "green", "blue", "nir", "scl", "thumbnail"];

  for (const [key, asset] of Object.entries(item.assets || {})) {
    if (interestingBands.includes(key) && asset.href) {
      bands.push({
        band: key,
        url: asset.href,
        title: asset.title || key,
      });
    }
  }

  return bands;
}

// ── Landsat via USGS STAC ──────────────────────────────────────────────────
// Landsat COGs are hosted on S3: s3://usgs-landsat/
// STAC: https://landsatlook.usgs.gov/stac-server

const LANDSAT_STAC_API = "https://landsatlook.usgs.gov/stac-server";

export async function searchLandsat(
  bbox: BoundingBox,
  options?: { maxCloudCover?: number; limit?: number; dateFrom?: string; dateTo?: string }
): Promise<STACSearchResult> {
  const maxCloud = options?.maxCloudCover ?? 20;
  const limit = options?.limit ?? 10;
  const now = new Date();
  const dateFrom = options?.dateFrom ?? new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split("T")[0];
  const dateTo = options?.dateTo ?? now.toISOString().split("T")[0];

  const body = {
    collections: ["landsat-c2l2-sr"],
    bbox: [bbox.west, bbox.south, bbox.east, bbox.north],
    datetime: `${dateFrom}T00:00:00Z/${dateTo}T23:59:59Z`,
    limit,
    query: {
      "eo:cloud_cover": { lte: maxCloud },
    },
  };

  const res = await fetch(`${LANDSAT_STAC_API}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Landsat STAC search failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/** Get Landsat browse/thumbnail URL */
export function getLandsatBrowseUrl(item: STACItem): string | null {
  const browse = item.assets?.browse || item.assets?.thumbnail;
  return browse?.href || null;
}
