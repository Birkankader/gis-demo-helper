"use client";

import { useCallback } from "react";
import Header from "@/components/layout/Header";
import MapWrapper from "@/components/map/MapContainer";
import LocationSearch from "@/components/search/LocationSearch";
import DataSourcePanel from "@/components/data-sources/DataSourcePanel";
import DownloadPanel from "@/components/download/DownloadPanel";
import DownloadHistory from "@/components/download/DownloadHistory";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";
import { useI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { t } = useI18n();
  const { state, setBbox, dispatch } = useAppStore();

  const handleLocationSelect = useCallback(
    (result: { lat: number; lng: number; bbox?: { south: number; west: number; north: number; east: number }; name: string }) => {
      if (result.bbox) {
        setBbox(result.bbox);
      }
      // Fly to location
      if (typeof window !== "undefined" && (window as any).__gisMapFlyTo) {
        (window as any).__gisMapFlyTo(result.lat, result.lng, 13);
      }
    },
    [setBbox]
  );

  const handleDrawBbox = useCallback(() => {
    if (typeof window !== "undefined" && (window as any).__gisMapStartDraw) {
      (window as any).__gisMapStartDraw();
    }
  }, []);

  const handleClearBbox = useCallback(() => {
    setBbox(null);
  }, [setBbox]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            "w-80 border-r bg-background flex flex-col overflow-hidden transition-all duration-200",
            "max-lg:absolute max-lg:inset-y-14 max-lg:left-0 max-lg:z-40 max-lg:shadow-xl",
            !state.sidebarOpen && "max-lg:-translate-x-full"
          )}
        >
          {/* Search */}
          <div className="p-3 border-b">
            <LocationSearch onSelect={handleLocationSelect} />
          </div>

          {/* Map controls */}
          <div className="px-3 py-2 border-b flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDrawBbox}
              className="flex-1 h-8 text-xs"
            >
              <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2" />
              </svg>
              {t.map.drawBbox}
            </Button>
            {state.bbox && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearBbox}
                className="h-8 text-xs px-2 text-destructive hover:text-destructive"
              >
                <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
                {t.map.clearBbox}
              </Button>
            )}
          </div>

          {/* Data sources */}
          <div className="flex-1 overflow-y-auto p-3">
            <DataSourcePanel />
          </div>

          {/* Download panel */}
          <div className="border-t p-3">
            <DownloadPanel />
          </div>

          {/* Download history */}
          {state.downloads.length > 0 && (
            <div className="border-t p-3">
              <DownloadHistory />
            </div>
          )}
        </aside>

        {/* Map area */}
        <main className="flex-1 relative">
          <MapWrapper
            bbox={state.bbox}
            previewData={state.previewData}
            onBboxChange={setBbox}
          />

          {/* Loading overlay */}
          {state.isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="bg-card border rounded-lg shadow-lg p-4 flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm font-medium">{t.common.loading}</span>
              </div>
            </div>
          )}

          {/* Mobile sidebar toggle overlay */}
          {state.sidebarOpen && (
            <div
              className="lg:hidden absolute inset-0 bg-black/20 z-30"
              onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
            />
          )}
        </main>
      </div>
    </div>
  );
}
