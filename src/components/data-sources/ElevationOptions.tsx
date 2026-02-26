"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/context";
import { useAppStore } from "@/store/app-store";
import { srtmSources, getSRTMTilesForBbox } from "@/lib/data-sources/srtm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function ElevationOptions() {
  const { t, locale } = useI18n();
  const { state, addDownload, updateDownload } = useAppStore();
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const srtmTiles = state.bbox ? getSRTMTilesForBbox(state.bbox) : [];

  const handleDownload = async (tileFilename: string) => {
    if (!state.bbox) return;

    const downloadId = addDownload({
      name: `SRTM_${tileFilename}`,
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tileFilename}.hgt.gz`;
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
    if (!state.bbox || srtmTiles.length === 0) return;
    setDownloading(true);
    setProgress(0);
    setError(null);

    for (let i = 0; i < srtmTiles.length; i++) {
      try {
        setProgress(Math.round(((i + 1) / srtmTiles.length) * 100));
        await handleDownload(srtmTiles[i].filename);
        if (i < srtmTiles.length - 1) {
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
      <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m22 2-7 20-4-9-9-4 20-7z" />
          </svg>
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {t.common.noApiKey}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {locale === "tr"
            ? "AWS S3'den ücretsiz NASA SRTM yükseklik verisi"
            : "Free NASA SRTM elevation data from AWS S3"}
        </p>
      </div>

      {srtmSources.map((src) => (
        <div key={src.id} className="p-2 rounded-md border">
          <div className="text-xs font-medium">{src.nameEn}</div>
          <div className="text-[10px] text-muted-foreground">{src.description}</div>
          <Badge variant="outline" className="text-[9px] mt-1">{src.resolution}</Badge>
        </div>
      ))}

      {state.bbox ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t.download.srtmTiles}</span>
            <Badge variant="outline" className="text-[10px]">{srtmTiles.length}</Badge>
          </div>

          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {srtmTiles.map((tile) => (
              <div key={tile.filename} className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-accent">
                <span className="text-xs font-mono">{tile.filename}</span>
                <button
                  onClick={() => handleDownload(tile.filename).catch((e) => setError(e.message))}
                  className="p-1 hover:bg-primary/10 rounded"
                >
                  <svg className="w-3 h-3 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            disabled={srtmTiles.length === 0 || downloading}
            className="w-full h-9"
          >
            <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            {t.download.downloadSrtm} ({srtmTiles.length})
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
