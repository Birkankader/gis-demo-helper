"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BoundingBox } from "@/types/geo";
import { tileSources, resolveTileUrl } from "@/lib/tile-sources";

interface DynamicMapProps {
  center?: [number, number];
  zoom?: number;
  bbox: BoundingBox | null;
  previewData: GeoJSON.FeatureCollection | null;
  previewWms: { url: string; layers: string } | null;
  onBboxChange: (bbox: BoundingBox | null) => void;
  onMapReady?: (map: L.Map) => void;
}

export default function DynamicMap({
  center = [39.92, 32.85],
  zoom = 6,
  bbox,
  previewData,
  previewWms,
  onBboxChange,
  onMapReady,
}: DynamicMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const bboxRectRef = useRef<L.Rectangle | null>(null);
  const previewLayerRef = useRef<L.GeoJSON | null>(null);
  const wmsLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const drawStartRef = useRef<L.LatLng | null>(null);
  const drawRectRef = useRef<L.Rectangle | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: false,
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    const defaultSource = tileSources[0];
    tileLayerRef.current = L.tileLayer(defaultSource.url, {
      attribution: defaultSource.attribution,
      maxZoom: defaultSource.maxZoom,
      subdomains: defaultSource.subdomains || "abc",
    }).addTo(map);

    mapRef.current = map;
    onMapReady?.(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Convert a DOM touch/mouse point to map latlng
  const pointToLatLng = useCallback((clientX: number, clientY: number): L.LatLng | null => {
    const map = mapRef.current;
    if (!map) return null;
    const rect = map.getContainer().getBoundingClientRect();
    const point = L.point(clientX - rect.left, clientY - rect.top);
    return map.containerPointToLatLng(point);
  }, []);

  // Shared drawing logic
  const finishDraw = useCallback((endLatLng: L.LatLng) => {
    const map = mapRef.current;
    if (!map || !drawStartRef.current) return;

    const bounds = L.latLngBounds(drawStartRef.current, endLatLng);
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    // Only register if the area is meaningful (not just a tap)
    const sizeDeg = Math.abs(ne.lat - sw.lat) + Math.abs(ne.lng - sw.lng);
    if (sizeDeg > 0.001) {
      onBboxChange({
        south: sw.lat,
        west: sw.lng,
        north: ne.lat,
        east: ne.lng,
      });
    }

    // Cleanup drawing rect
    if (drawRectRef.current) {
      drawRectRef.current.remove();
      drawRectRef.current = null;
    }
    drawStartRef.current = null;

    // Re-enable map interactions
    map.dragging.enable();
    if ((map as any).touchZoom) (map as any).touchZoom.enable();
    if ((map as any).bounceAtZoomLimits) (map as any).bounceAtZoomLimits = true;
    map.getContainer().classList.remove("drawing-mode");
    setIsDrawing(false);
  }, [onBboxChange]);

  const updateDrawRect = useCallback((currentLatLng: L.LatLng) => {
    const map = mapRef.current;
    if (!map || !drawStartRef.current) return;

    const bounds = L.latLngBounds(drawStartRef.current, currentLatLng);
    if (drawRectRef.current) {
      drawRectRef.current.setBounds(bounds);
    } else {
      drawRectRef.current = L.rectangle(bounds, {
        color: "#3b82f6",
        weight: 2,
        fillOpacity: 0.1,
        dashArray: "5,5",
      }).addTo(map);
    }
  }, []);

  // Bbox drawing handlers (mouse + touch)
  const startDraw = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    setIsDrawing(true);
    map.dragging.disable();
    if ((map as any).touchZoom) (map as any).touchZoom.disable();
    map.getContainer().classList.add("drawing-mode");

    const container = map.getContainer();

    // --- Mouse events (desktop) ---
    const onMouseDown = (e: L.LeafletMouseEvent) => {
      drawStartRef.current = e.latlng;
    };
    const onMouseMove = (e: L.LeafletMouseEvent) => {
      if (!drawStartRef.current) return;
      updateDrawRect(e.latlng);
    };
    const onMouseUp = (e: L.LeafletMouseEvent) => {
      if (!drawStartRef.current) return;
      cleanup();
      finishDraw(e.latlng);
    };

    // --- Touch events (mobile) ---
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      const touch = e.touches[0];
      const latlng = pointToLatLng(touch.clientX, touch.clientY);
      if (latlng) drawStartRef.current = latlng;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!drawStartRef.current || e.touches.length !== 1) return;
      e.preventDefault();
      const touch = e.touches[0];
      const latlng = pointToLatLng(touch.clientX, touch.clientY);
      if (latlng) updateDrawRect(latlng);
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!drawStartRef.current) return;
      e.preventDefault();
      const touch = e.changedTouches[0];
      const latlng = pointToLatLng(touch.clientX, touch.clientY);
      if (latlng) {
        cleanup();
        finishDraw(latlng);
      }
    };

    const cleanup = () => {
      map.off("mousedown", onMouseDown);
      map.off("mousemove", onMouseMove);
      map.off("mouseup", onMouseUp);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
    };

    // Bind mouse events via Leaflet
    map.on("mousedown", onMouseDown);
    map.on("mousemove", onMouseMove);
    map.on("mouseup", onMouseUp);

    // Bind touch events via DOM (Leaflet doesn't expose these directly)
    container.addEventListener("touchstart", onTouchStart, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd, { passive: false });
  }, [onBboxChange, pointToLatLng, updateDrawRect, finishDraw]);

  // Update bbox rectangle on map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (bboxRectRef.current) {
      bboxRectRef.current.remove();
      bboxRectRef.current = null;
    }

    if (bbox) {
      const bounds = L.latLngBounds(
        [bbox.south, bbox.west],
        [bbox.north, bbox.east]
      );
      bboxRectRef.current = L.rectangle(bounds, {
        color: "#3b82f6",
        weight: 2,
        fillOpacity: 0.08,
        fillColor: "#3b82f6",
      }).addTo(map);
    }
  }, [bbox]);

  // Update preview layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (previewLayerRef.current) {
      previewLayerRef.current.remove();
      previewLayerRef.current = null;
    }

    if (previewData && previewData.features.length > 0) {
      previewLayerRef.current = L.geoJSON(previewData, {
        style: {
          color: "#ef4444",
          weight: 2,
          fillOpacity: 0.15,
          fillColor: "#ef4444",
        },
        pointToLayer: (_feature, latlng) => {
          return L.circleMarker(latlng, {
            radius: 5,
            fillColor: "#ef4444",
            color: "#dc2626",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7,
          });
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const props = feature.properties;
            const name = props.name || props.Name || props.NAME || "";
            const type = props.type || props.highway || props.building || props.amenity || "";
            if (name || type) {
              layer.bindPopup(`<b>${name}</b>${type ? `<br/><small>${type}</small>` : ""}`);
            }
          }
        },
      }).addTo(map);
    }
  }, [previewData]);

  // Update WMS preview layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (wmsLayerRef.current) {
      wmsLayerRef.current.remove();
      wmsLayerRef.current = null;
    }

    if (previewWms) {
      wmsLayerRef.current = L.tileLayer.wms(previewWms.url, {
        layers: previewWms.layers,
        format: "image/png",
        transparent: true,
        opacity: 0.7,
      }).addTo(map);
    }
  }, [previewWms]);

  // Fly to location
  const flyTo = useCallback((lat: number, lng: number, zoom?: number) => {
    mapRef.current?.flyTo([lat, lng], zoom ?? 13, { duration: 1.5 });
  }, []);

  // Change basemap
  const setBasemap = useCallback((sourceId: string) => {
    const map = mapRef.current;
    if (!map) return;

    const source = tileSources.find((s) => s.id === sourceId);
    if (!source) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    tileLayerRef.current = L.tileLayer(source.url, {
      attribution: source.attribution,
      maxZoom: source.maxZoom,
      subdomains: source.subdomains || "abc",
    }).addTo(map);

    // Move tile layer to bottom
    tileLayerRef.current.bringToBack();
  }, []);

  // Expose functions via ref
  useEffect(() => {
    (window as any).__gisMapFlyTo = flyTo;
    (window as any).__gisMapStartDraw = startDraw;
    (window as any).__gisMapSetBasemap = setBasemap;
    return () => {
      delete (window as any).__gisMapFlyTo;
      delete (window as any).__gisMapStartDraw;
      delete (window as any).__gisMapSetBasemap;
    };
  }, [flyTo, startDraw, setBasemap]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {isDrawing && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium shadow-lg animate-pulse">
          <span className="hidden sm:inline">Click and drag to select area</span>
          <span className="sm:hidden">Parmağınızla sürükleyerek alan seçin</span>
        </div>
      )}
    </div>
  );
}
