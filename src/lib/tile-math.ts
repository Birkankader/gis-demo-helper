import { BoundingBox } from "@/types/geo";

export interface TileCoord {
  z: number;
  x: number;
  y: number;
}

export interface TileRange {
  zoom: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  count: number;
}

/** Convert longitude to tile X coordinate */
export function lng2tileX(lng: number, zoom: number): number {
  return Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
}

/** Convert latitude to tile Y coordinate */
export function lat2tileY(lat: number, zoom: number): number {
  const latRad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
}

/** Convert tile X to longitude */
export function tileX2lng(x: number, zoom: number): number {
  return (x / Math.pow(2, zoom)) * 360 - 180;
}

/** Convert tile Y to latitude */
export function tileY2lat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, zoom);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

/** Get tile range for a bounding box at a given zoom level */
export function bboxToTileRange(bbox: BoundingBox, zoom: number): TileRange {
  const xMin = lng2tileX(bbox.west, zoom);
  const xMax = lng2tileX(bbox.east, zoom);
  const yMin = lat2tileY(bbox.north, zoom); // north has smaller Y
  const yMax = lat2tileY(bbox.south, zoom);
  const count = (xMax - xMin + 1) * (yMax - yMin + 1);

  return { zoom, xMin, xMax, yMin, yMax, count };
}

/** Get all tile coordinates for a bbox across multiple zoom levels */
export function bboxToTiles(bbox: BoundingBox, zoomMin: number, zoomMax: number): TileCoord[] {
  const tiles: TileCoord[] = [];
  for (let z = zoomMin; z <= zoomMax; z++) {
    const range = bboxToTileRange(bbox, z);
    for (let x = range.xMin; x <= range.xMax; x++) {
      for (let y = range.yMin; y <= range.yMax; y++) {
        tiles.push({ z, x, y });
      }
    }
  }
  return tiles;
}

/** Calculate total tile count for a bbox across multiple zoom levels */
export function countTiles(bbox: BoundingBox, zoomMin: number, zoomMax: number): number {
  let total = 0;
  for (let z = zoomMin; z <= zoomMax; z++) {
    total += bboxToTileRange(bbox, z).count;
  }
  return total;
}

/** Estimate download size in bytes (rough average: ~15KB per tile) */
export function estimateTileSize(tileCount: number, avgTileKB: number = 15): number {
  return tileCount * avgTileKB * 1024;
}

/** Get tile bounds (for display purposes) */
export function tileBounds(tile: TileCoord): BoundingBox {
  return {
    west: tileX2lng(tile.x, tile.z),
    north: tileY2lat(tile.y, tile.z),
    east: tileX2lng(tile.x + 1, tile.z),
    south: tileY2lat(tile.y + 1, tile.z),
  };
}
