import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function bboxToString(bbox: { south: number; west: number; north: number; east: number }): string {
  return `${bbox.south.toFixed(4)}, ${bbox.west.toFixed(4)}, ${bbox.north.toFixed(4)}, ${bbox.east.toFixed(4)}`;
}

export function bboxArea(bbox: { south: number; west: number; north: number; east: number }): number {
  const latDiff = bbox.north - bbox.south;
  const lngDiff = bbox.east - bbox.west;
  return Math.abs(latDiff * lngDiff) * 111 * 111;
}
