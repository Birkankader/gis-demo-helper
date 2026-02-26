import { BoundingBox } from "./geo";

export type DataSourceId = "osm" | "natural-earth" | "tiles" | "elevation" | "geofabrik" | "wms-wfs";

export interface DataSource {
  id: DataSourceId;
  name: string;
  description: string;
  icon: string;
  categories: DataCategory[];
}

export interface DataCategory {
  id: string;
  name: string;
  description: string;
  tags?: Record<string, string>;
  presets?: DataPreset[];
}

export interface DataPreset {
  id: string;
  name: string;
  description: string;
  overpassQuery?: string;
  naturalEarthDataset?: string;
  scale?: string;
  demType?: string;
  wmsUrl?: string;
  wfsUrl?: string;
  layer?: string;
}

export interface DataRequest {
  source: DataSourceId;
  bbox: BoundingBox;
  category: string;
  preset?: string;
  format: ExportFormat;
  options?: Record<string, string>;
}

export type ExportFormat = "geojson" | "shapefile" | "geopackage" | "geotiff" | "kml" | "tiles" | "pbf";

export interface DataResult {
  id: string;
  source: DataSourceId;
  name: string;
  format: ExportFormat;
  size: number;
  featureCount?: number;
  bbox: BoundingBox;
  timestamp: number;
  previewData?: GeoJSON.FeatureCollection;
  downloadUrl?: string;
}
