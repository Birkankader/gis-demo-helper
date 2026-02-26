"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { BoundingBox } from "@/types/geo";

const DynamicMapComponent = dynamic(() => import("./DynamicMap"), {
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted/50">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        <span className="text-sm">Loading map...</span>
      </div>
    </div>
  ),
  ssr: false,
});

interface MapWrapperProps {
  bbox: BoundingBox | null;
  previewData: GeoJSON.FeatureCollection | null;
  previewWms: { url: string; layers: string } | null;
  onBboxChange: (bbox: BoundingBox | null) => void;
}

export default function MapWrapper({ bbox, previewData, previewWms, onBboxChange }: MapWrapperProps) {
  const MapComponent = useMemo(() => DynamicMapComponent, []);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border">
      <MapComponent
        bbox={bbox}
        previewData={previewData}
        previewWms={previewWms}
        onBboxChange={onBboxChange}
      />
    </div>
  );
}
