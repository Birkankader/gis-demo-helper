"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/context";
import { useAppStore } from "@/store/app-store";
import { tileSources, resolveTileUrl } from "@/lib/tile-sources";
import { countTiles, estimateTileSize, bboxToTiles, bboxToTileRange, tileBounds } from "@/lib/tile-math";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";

export default function TileDownloadOptions() {
  const { t, locale } = useI18n();
  const { state, dispatch, addDownload, updateDownload, setPreview } = useAppStore();
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

  const handlePreview = () => {
    if (!state.bbox) return;
    // Show tile grid at min zoom level for coverage overview
    const range = bboxToTileRange(state.bbox, state.tileZoomMin);
    const features: GeoJSON.Feature[] = [];
    for (let x = range.xMin; x <= range.xMax; x++) {
      for (let y = range.yMin; y <= range.yMax; y++) {
        const bounds = tileBounds({ z: state.tileZoomMin, x, y });
        features.push({
          type: "Feature",
          properties: {
            name: `z${state.tileZoomMin}/${x}/${y}`,
            type: `Tile`,
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [bounds.west, bounds.south],
              [bounds.east, bounds.south],
              [bounds.east, bounds.north],
              [bounds.west, bounds.north],
              [bounds.west, bounds.south],
            ]],
          },
        });
        if (features.length >= 500) break;
      }
      if (features.length >= 500) break;
    }
    setPreview({ type: "FeatureCollection", features });
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
    setProgress(0);
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
      const source = tileSources.find((s) => s.id === selectedSource);
      if (!source) throw new Error("Unknown tile source");

      const tiles = bboxToTiles(state.bbox, state.tileZoomMin, state.tileZoomMax);
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      let completed = 0;
      let failed = 0;

      // Download tiles in batches of 4 through the proxy
      const BATCH_SIZE = 4;
      for (let i = 0; i < tiles.length; i += BATCH_SIZE) {
        const batch = tiles.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (tile) => {
          const path = `${tile.z}/${tile.x}/${tile.y}.png`;
          try {
            // Use proxy endpoint to avoid CORS
            const proxyUrl = `/api/tiles?action=proxy&source=${selectedSource}&z=${tile.z}&x=${tile.x}&y=${tile.y}`;
            const res = await fetch(proxyUrl);
            if (!res.ok) {
              failed++;
              return;
            }
            const blob = await res.blob();
            zip.file(path, blob);
            completed++;
          } catch {
            failed++;
          }
        }));

        const pct = Math.round(((i + batch.length) / tiles.length) * 90);
        setProgress(pct);
        updateDownload(downloadId, { progress: pct });
      }

      if (completed === 0) {
        throw new Error(
          locale === "tr"
            ? "Hiçbir tile indirilemedi. Sunucu bağlantısını kontrol edin."
            : "No tiles could be downloaded. Check server connectivity."
        );
      }

      setProgress(95);
      updateDownload(downloadId, { progress: 95 });

      // Generate ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tiles_${selectedSource}_z${state.tileZoomMin}-${state.tileZoomMax}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setProgress(100);
      updateDownload(downloadId, {
        progress: 100,
        status: "completed",
        size: zipBlob.size,
      });

      if (failed > 0) {
        setError(
          locale === "tr"
            ? `${completed} tile indirildi, ${failed} başarısız.`
            : `${completed} tiles downloaded, ${failed} failed.`
        );
      }

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

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreview}
          disabled={!state.bbox || tileCount === 0}
          className="flex-1 h-9"
        >
          <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {t.download.previewGrid}
        </Button>
        <Button
          size="sm"
          onClick={handleDownload}
          disabled={!state.bbox || tileCount === 0 || tileCount > 5000 || downloading}
          className="flex-1 h-9"
        >
          <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          {t.download.downloadTiles}
        </Button>
      </div>
    </div>
  );
}
