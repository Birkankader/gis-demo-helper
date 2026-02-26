"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/context";
import { useAppStore } from "@/store/app-store";
import {
  terrainSources,
  getTerrainTilesForBbox,
  getTerrainFileExt,
  estimateTerrainTileSize,
} from "@/lib/data-sources/terrain";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";

export default function ElevationOptions() {
  const { t, locale } = useI18n();
  const { state, addDownload, updateDownload } = useAppStore();
  const [selectedSource, setSelectedSource] = useState("srtm-hgt");
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const source = terrainSources.find((s) => s.id === selectedSource) || terrainSources[0];
  const tiles = state.bbox ? getTerrainTilesForBbox(state.bbox, selectedSource) : [];
  const estPerTile = estimateTerrainTileSize(selectedSource);
  const estTotal = tiles.length * estPerTile;

  const handleDownloadTile = async (tileFilename: string) => {
    if (!state.bbox) return;

    const downloadId = addDownload({
      name: `${selectedSource}_${tileFilename}`,
      source: "elevation",
      format: "geotiff",
      bbox: state.bbox,
      status: "downloading",
      progress: 0,
      timestamp: Date.now(),
    });

    try {
      const params = new URLSearchParams({
        action: "download",
        source: selectedSource,
        tile: tileFilename,
        south: state.bbox.south.toString(),
        west: state.bbox.west.toString(),
        north: state.bbox.north.toString(),
        east: state.bbox.east.toString(),
      });

      const res = await fetch(`/api/elevation?${params}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Download failed" }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const ext = getTerrainFileExt(selectedSource);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tileFilename}${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      updateDownload(downloadId, { progress: 100, status: "completed", size: blob.size });
    } catch (err: any) {
      updateDownload(downloadId, { status: "error", error: err.message });
      throw err;
    }
  };

  const handleDownloadAll = async () => {
    if (!state.bbox || tiles.length === 0) return;
    setDownloading(true);
    setProgress(0);
    setError(null);

    for (let i = 0; i < tiles.length; i++) {
      try {
        setProgress(Math.round(((i + 1) / tiles.length) * 100));
        await handleDownloadTile(tiles[i].filename);
        if (i < tiles.length - 1) {
          await new Promise((r) => setTimeout(r, 500));
        }
      } catch (err: any) {
        setError(err.message);
      }
    }

    setDownloading(false);
    setProgress(0);
  };

  return (
    <div className="space-y-3">
      {/* No API key badge */}
      <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m22 2-7 20-4-9-9-4 20-7z" />
          </svg>
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {t.common.noApiKey}
          </span>
        </div>
      </div>

      {/* Terrain source selection */}
      <div className="space-y-1.5">
        {terrainSources.filter((s) => s.id !== "aws-terrain-tif").map((src) => (
          <button
            key={src.id}
            onClick={() => setSelectedSource(src.id)}
            className={cn(
              "w-full text-left px-3 py-2.5 sm:py-2 rounded-md transition-colors",
              selectedSource === src.id
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/30"
                : "hover:bg-accent active:bg-accent"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">
                {locale === "tr" ? src.nameTr : src.nameEn}
              </span>
              <Badge variant="outline" className="text-[9px] h-4 shrink-0">
                {src.formats[0].label}
              </Badge>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {locale === "tr" ? src.descriptionTr : src.descriptionEn}
            </div>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary" className="text-[9px] h-4">{src.resolution}</Badge>
              <Badge variant="secondary" className="text-[9px] h-4">{src.coverage}</Badge>
            </div>
          </button>
        ))}
      </div>

      {/* GDAL convert tip */}
      <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
        <p className="text-[10px] text-blue-700 dark:text-blue-400">
          <span className="font-medium">DTED2:</span>{" "}
          {locale === "tr"
            ? "HGT/GeoTIFF dosyalarını GDAL ile DTED'e dönüştürün:"
            : "Convert HGT/GeoTIFF files to DTED with GDAL:"}
        </p>
        <code className="text-[9px] text-muted-foreground block mt-1 font-mono">
          gdal_translate -of DTED input.hgt output.dt2
        </code>
      </div>

      {/* Tile list */}
      {state.bbox ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {locale === "tr" ? "Tile Sayısı" : "Tile Count"}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">{tiles.length}</Badge>
              <span className="text-[10px] text-muted-foreground">~{formatBytes(estTotal)}</span>
            </div>
          </div>

          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {tiles.map((tile) => (
              <div key={tile.filename} className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-accent active:bg-accent">
                <div>
                  <span className="text-xs font-mono">{tile.filename}</span>
                  <span className="text-[9px] text-muted-foreground ml-1.5">
                    {source.formats[0].ext}
                  </span>
                </div>
                <button
                  onClick={() => handleDownloadTile(tile.filename).catch((e) => setError(e.message))}
                  className="p-1.5 hover:bg-primary/10 active:bg-primary/20 rounded min-w-[28px] min-h-[28px] flex items-center justify-center"
                >
                  <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {downloading && (
            <div className="space-y-1">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground text-center">{t.download.progress}</p>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button
            size="sm"
            onClick={handleDownloadAll}
            disabled={tiles.length === 0 || downloading}
            className="w-full h-9"
          >
            <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            {locale === "tr" ? "Tümünü İndir" : "Download All"} ({tiles.length})
          </Button>
        </div>
      ) : (
        <div className="p-3 rounded-lg border border-dashed text-center">
          <p className="text-xs text-muted-foreground">{t.map.noAreaSelected}</p>
        </div>
      )}
    </div>
  );
}
