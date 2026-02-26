export interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface MapPosition {
  lat: number;
  lng: number;
  zoom: number;
}

export type GeoJSONFeatureCollection = GeoJSON.FeatureCollection;
