"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/i18n/context";
import { useAppStore } from "@/store/app-store";
import { tileSources } from "@/lib/tile-sources";
import { countTiles, estimateTileSize } from "@/lib/tile-math";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";

export default function TileDownloadOptions() {
  const { t, locale } = useI18n();
  const { state, dispatch, addDownload, updateDownload } = useAppStore();
  const [selectedSource, setSelectedSource] = useState("osm-standard");
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const tileCount = state.bbox
    ? countTiles(state.bbox, state.tileZoomMin, state.tileZoomMax)
    : 0;
  const estimatedSize = estimateTileSize(tileCount);

  const typeLabels: Record<string, string> = {
    standard: locale === "tr" ? "Standart" : "Standard",
    satellite: locale === "tr" ? "Uydu" : "Satellite",
    topo: locale === "tr" ? "Topografik" : "Topographic",
    dark: locale === "tr" ? "Koyu" : "Dark",
    light: locale === "tr" ? "Açık" : "Light",
  };

  const handleDownload = async () => {
    if (!state.bbox || tileCount === 0) return;
    if (tileCount > 5000) {
      setError(locale === "tr"
        ? "Çok fazla tile! Lütfen daha küçük alan veya zoom aralığı seçin (maks 5000)."
        : "Too many tiles! Please select smaller area or zoom range (max 5000)."
      );
      return;
    }

    setDownloading(true);
    setProgress(10);
    setError(null);

    const downloadId = addDownload({
      name: `tiles_${selectedSource}`,
      source: "tiles",
      format: "tiles",
      bbox: state.bbox,
      status: "downloading",
      progress: 0,
      timestamp: Date.now(),
    });

    try {
      const params = new URLSearchParams({
        action: "download",
        source: selectedSource,
        south: state.bbox.south.toString(),
        west: state.bbox.west.toString(),
        north: state.bbox.north.toString(),
        east: state.bbox.east.toString(),
        zoomMin: state.tileZoomMin.toString(),
        zoomMax: state.tileZoomMax.toString(),
      });

      setProgress(20);
      updateDownload(downloadId, { progress: 20 });

      const res = await fetch(`/api/tiles?${params}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Download failed" }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      setProgress(70);
      updateDownload(downloadId, { progress: 70 });

      const data = await res.json();

      // Create a simple JSON manifest + tile data for client-side use
      const manifest = {
        source: data.sourceName,
        tileCount: data.tileCount,
        successCount: data.successCount,
        zoomRange: `${state.tileZoomMin}-${state.tileZoomMax}`,
        bbox: state.bbox,
        tiles: data.tiles.filter((t: any) => t.data).map((t: any) => ({
          path: t.path,
          size: t.data.length,
        })),
      };

      // Trigger JSON download with manifest
      const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tiles_${selectedSource}_z${state.tileZoomMin}-${state.tileZoomMax}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Also save individual tiles as downloadable links
      for (const tile of data.tiles) {
        if (tile.data) {
          const tileBlob = new Blob(
            [Uint8Array.from(atob(tile.data), (c) => c.charCodeAt(0))],
            { type: "image/png" }
          );
          // Store in a downloadable manner
        }
      }

      setProgress(100);
      updateDownload(downloadId, {
        progress: 100,
        status: "completed",
        size: blob.size,
      });

      setTimeout(() => {
        setProgress(0);
        setDownloading(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      updateDownload(downloadId, { status: "error", error: err.message });
      setDownloading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-3">
      {/* Tile source selection */}
      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
        {tileSources.map((source) => (
          <button
            key={source.id}
            onClick={() => setSelectedSource(source.id)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md transition-colors",
              selectedSource === source.id
                ? "bg-violet-500/10 text-violet-700 dark:text-violet-400"
                : "hover:bg-accent text-foreground"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {locale === "tr" ? source.nameTr : source.nameEn}
              </span>
              <Badge variant="outline" className="text-[10px] h-4">
                {typeLabels[source.type] || source.type}
              </Badge>
            </div>
          </button>
        ))}
      </div>

      {/* Zoom range */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t.download.zoomRange}</span>
          <span className="text-xs font-mono font-medium">
            {state.tileZoomMin} - {state.tileZoomMax}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-[10px] text-muted-foreground w-6">Min</span>
          <input
            type="range"
            min={1}
            max={18}
            value={state.tileZoomMin}
            onChange={(e) =>
              dispatch({
                type: "SET_TILE_ZOOM",
                payload: { min: parseInt(e.target.value), max: Math.max(parseInt(e.target.value), state.tileZoomMax) },
              })
            }
            className="flex-1 h-1.5 accent-primary"
          />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-[10px] text-muted-foreground w-6">Max</span>
          <input
            type="range"
            min={1}
            max={18}
            value={state.tileZoomMax}
            onChange={(e) =>
              dispatch({
                type: "SET_TILE_ZOOM",
                payload: { min: Math.min(state.tileZoomMin, parseInt(e.target.value)), max: parseInt(e.target.value) },
              })
            }
            className="flex-1 h-1.5 accent-primary"
          />
        </div>
      </div>

      {/* Tile count info */}
      {state.bbox && (
        <div className="p-2.5 rounded-lg bg-violet-500/5 border border-violet-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t.download.tileCount}</span>
            <span className={cn("text-sm font-bold", tileCount > 5000 ? "text-destructive" : "text-violet-700 dark:text-violet-400")}>
              {tileCount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t.download.estimatedSize}</span>
            <span className="text-xs font-medium">{formatBytes(estimatedSize)}</span>
          </div>
          {tileCount > 5000 && (
            <p className="text-[10px] text-destructive">
              {locale === "tr" ? "Maks 5000 tile. Alan veya zoom aralığını küçültün." : "Max 5000 tiles. Reduce area or zoom range."}
            </p>
          )}
        </div>
      )}

      {/* Progress */}
      {downloading && (
        <div className="space-y-1.5">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground text-center">{t.download.progress}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Download button */}
      <Button
        size="sm"
        onClick={handleDownload}
        disabled={!state.bbox || tileCount === 0 || tileCount > 5000 || downloading}
        className="w-full h-9"
      >
        <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        {t.download.downloadTiles}
      </Button>
    </div>
  );
}
