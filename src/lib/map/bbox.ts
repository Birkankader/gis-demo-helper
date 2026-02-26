import { BoundingBox } from "@/types/geo";

export function isValidBbox(bbox: BoundingBox): boolean {
  return (
    bbox.south < bbox.north &&
    bbox.west < bbox.east &&
    bbox.south >= -90 &&
    bbox.north <= 90 &&
    bbox.west >= -180 &&
    bbox.east <= 180
  );
}

export function bboxAreaKm2(bbox: BoundingBox): number {
  const R = 6371;
  const latRad1 = (bbox.south * Math.PI) / 180;
  const latRad2 = (bbox.north * Math.PI) / 180;
  const dLat = latRad2 - latRad1;
  const dLng = ((bbox.east - bbox.west) * Math.PI) / 180;
  const avgLat = (latRad1 + latRad2) / 2;
  const width = R * dLng * Math.cos(avgLat);
  const height = R * dLat;
  return Math.abs(width * height);
}

export function bboxTooLarge(bbox: BoundingBox, maxKm2: number = 10000): boolean {
  return bboxAreaKm2(bbox) > maxKm2;
}

export function bboxCenter(bbox: BoundingBox): { lat: number; lng: number } {
  return {
    lat: (bbox.south + bbox.north) / 2,
    lng: (bbox.west + bbox.east) / 2,
  };
}
