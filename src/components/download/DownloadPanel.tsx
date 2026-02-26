"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/context";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { ExportFormat } from "@/types/data-source";
import { bboxAreaKm2 } from "@/lib/map/bbox";
import { formatBytes } from "@/lib/utils";

export default function DownloadPanel() {
  const { t, locale } = useI18n();
  const { state, setFormat, setPreview, setLoading, addDownload, updateDownload } = useAppStore();
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sources with their own download UI built in
  const selfDownloadSources = ["tiles", "elevation", "satellite", "geofabrik"];
  const isSelfDownload = selfDownloadSources.includes(state.activeSource);

  const canPreview = !!state.bbox && !!state.activePreset && !isSelfDownload;
  const canDownload = !!state.bbox && !!state.activePreset && !isSelfDownload;

  const formatOptions = state.activeSource === "elevation"
    ? [{ value: "geotiff", label: t.formats.geotiff }]
    : [
        { value: "geojson", label: t.formats.geojson },
        { value: "shapefile", label: t.formats.shapefile },
        { value: "kml", label: t.formats.kml },
      ];

  const handlePreview = async () => {
    if (!state.bbox || !state.activePreset) return;
    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      let url = "";
      const params = new URLSearchParams();

      if (state.activeSource === "osm") {
        url = "/api/osm";
        params.set("preset", state.activePreset);
        params.set("south", state.bbox.south.toString());
        params.set("west", state.bbox.west.toString());
        params.set("north", state.bbox.north.toString());
        params.set("east", state.bbox.east.toString());
      } else if (state.activeSource === "natural-earth") {
        url = "/api/natural-earth";
        params.set("dataset", state.activePreset);
      }

      const res = await fetch(`${url}?${params}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const geojson = await res.json();
      setPreview(geojson);
    } catch (err: any) {
      setError(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!state.bbox || !state.activePreset) return;
    setError(null);
    setDownloadProgress(0);

    const downloadId = addDownload({
      name: `${state.activeSource}_${state.activePreset}`,
      source: state.activeSource,
      format: state.exportFormat,
      bbox: state.bbox,
      status: "downloading",
      progress: 0,
      timestamp: Date.now(),
    });

    try {
      let url = "";
      const params = new URLSearchParams();

      if (state.activeSource === "osm") {
        url = "/api/osm";
        params.set("preset", state.activePreset);
        params.set("south", state.bbox.south.toString());
        params.set("west", state.bbox.west.toString());
        params.set("north", state.bbox.north.toString());
        params.set("east", state.bbox.east.toString());
        params.set("format", state.exportFormat);
      } else if (state.activeSource === "natural-earth") {
        url = "/api/natural-earth";
        params.set("dataset", state.activePreset);
        params.set("format", state.exportFormat);
      } else if (state.activeSource === "elevation") {
        url = "/api/elevation";
        params.set("demtype", state.activePreset);
        params.set("south", state.bbox.south.toString());
        params.set("west", state.bbox.west.toString());
        params.set("north", state.bbox.north.toString());
        params.set("east", state.bbox.east.toString());
      }

      setDownloadProgress(30);
      updateDownload(downloadId, { progress: 30 });

      const res = await fetch(`${url}?${params}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Download failed" }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      setDownloadProgress(70);
      updateDownload(downloadId, { progress: 70 });

      const contentType = res.headers.get("content-type") || "";
      const blob = await res.blob();

      setDownloadProgress(90);
      updateDownload(downloadId, { progress: 90 });

      // Determine filename
      let ext = state.exportFormat === "geojson" ? ".geojson" :
                state.exportFormat === "shapefile" ? ".zip" :
                state.exportFormat === "geotiff" ? ".tif" :
                state.exportFormat === "kml" ? ".kml" : ".geojson";

      const filename = `${state.activeSource}_${state.activePreset}_${Date.now()}${ext}`;

      // Trigger download
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      setDownloadProgress(100);
      updateDownload(downloadId, {
        progress: 100,
        status: "completed",
        size: blob.size,
      });

      setTimeout(() => setDownloadProgress(null), 2000);
    } catch (err: any) {
      setError(err.message || t.download.error);
      updateDownload(downloadId, { status: "error", error: err.message });
      setDownloadProgress(null);
    }
  };

  // For sources with built-in download UI, show only bbox info
  if (isSelfDownload) {
    return (
      <div className="space-y-3">
        {state.bbox ? (
          <div className="p-2.5 rounded-lg bg-muted/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t.map.selectedArea}</span>
              <Badge variant="outline" className="text-[10px]">
                {bboxAreaKm2(state.bbox).toFixed(0)} km²
              </Badge>
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              {state.bbox.south.toFixed(4)}, {state.bbox.west.toFixed(4)} →{" "}
              {state.bbox.north.toFixed(4)}, {state.bbox.east.toFixed(4)}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg border border-dashed text-center">
            <p className="text-xs text-muted-foreground">{t.map.noAreaSelected}</p>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground text-center">
          {locale === "tr"
            ? "İndirme seçenekleri yukarıdaki panelde"
            : "Download options are in the panel above"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Area info */}
      {state.bbox ? (
        <div className="p-2.5 rounded-lg bg-muted/50 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t.map.selectedArea}</span>
            <Badge variant="outline" className="text-[10px]">
              {bboxAreaKm2(state.bbox).toFixed(0)} km²
            </Badge>
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">
            {state.bbox.south.toFixed(4)}, {state.bbox.west.toFixed(4)} →{" "}
            {state.bbox.north.toFixed(4)}, {state.bbox.east.toFixed(4)}
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-lg border border-dashed text-center">
          <p className="text-xs text-muted-foreground">{t.map.noAreaSelected}</p>
        </div>
      )}

      {/* Format selector */}
      <Select
        value={state.exportFormat}
        onChange={(e) => setFormat(e.target.value as ExportFormat)}
        options={formatOptions}
        className="h-9 text-sm"
      />

      {/* Preview data info */}
      {state.previewData && (
        <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              {t.download.featureCount}: {state.previewData.features.length}
            </span>
            <Badge variant="success" className="text-[10px]">
              {formatBytes(JSON.stringify(state.previewData).length)}
            </Badge>
          </div>
        </div>
      )}

      {/* Progress */}
      {downloadProgress !== null && (
        <div className="space-y-1.5">
          <Progress value={downloadProgress} />
          <p className="text-xs text-muted-foreground text-center">
            {downloadProgress < 100 ? t.download.progress : t.download.completed}
          </p>
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
        {canPreview && (
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={state.isLoading}
            className="flex-1 h-9"
          >
            {state.isLoading ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
            ) : (
              <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
            {t.download.preview}
          </Button>
        )}
        <Button
          size="sm"
          onClick={handleDownload}
          disabled={!canDownload || downloadProgress !== null}
          className="flex-1 h-9"
        >
          <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          {t.download.download}
        </Button>
      </div>
    </div>
  );
}
