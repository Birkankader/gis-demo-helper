"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/context";
import { useAppStore } from "@/store/app-store";
import { satelliteSources } from "@/lib/data-sources/satellite";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Scene {
  id: string;
  datetime: string;
  cloudCover?: number;
  platform?: string;
  thumbnail?: string;
  visual?: string;
  red?: string;
  green?: string;
  blue?: string;
  nir?: string;
  nir08?: string;
  scl?: string;
  bbox?: number[];
}

export default function SatelliteOptions() {
  const { locale } = useI18n();
  const { state, addDownload, updateDownload } = useAppStore();
  const [selectedSource, setSelectedSource] = useState("sentinel2-cog");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [searching, setSearching] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [maxCloud, setMaxCloud] = useState(20);

  const handleSearch = async () => {
    if (!state.bbox) return;
    setSearching(true);
    setError(null);
    setScenes([]);

    try {
      const params = new URLSearchParams({
        action: "search",
        source: selectedSource,
        south: state.bbox.south.toString(),
        west: state.bbox.west.toString(),
        north: state.bbox.north.toString(),
        east: state.bbox.east.toString(),
        maxCloud: maxCloud.toString(),
        limit: "10",
      });

      const res = await fetch(`/api/satellite?${params}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Search failed" }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setScenes(data.scenes || []);

      if ((data.scenes || []).length === 0) {
        setError(
          locale === "tr"
            ? "Bu alan ve filtrelere uygun uydu görüntüsü bulunamadı."
            : "No satellite scenes found for this area and filters."
        );
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleDownloadBand = async (scene: Scene, bandName: string, bandUrl: string) => {
    if (!bandUrl) return;
    setDownloading(`${scene.id}-${bandName}`);

    const downloadId = addDownload({
      name: `${selectedSource === "sentinel2-cog" ? "S2" : "LS"}_${scene.id}_${bandName}`,
      source: "satellite",
      format: "geotiff",
      bbox: state.bbox!,
      status: "downloading",
      progress: 0,
      timestamp: Date.now(),
    });

    try {
      const params = new URLSearchParams({
        action: "proxy",
        url: bandUrl,
      });

      const res = await fetch(`/api/satellite?${params}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Download failed" }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${scene.id}_${bandName}.tif`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      updateDownload(downloadId, { progress: 100, status: "completed", size: blob.size });
    } catch (err: any) {
      setError(err.message);
      updateDownload(downloadId, { status: "error", error: err.message });
    } finally {
      setDownloading(null);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
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
            {locale === "tr" ? "API key gerekmez - STAC API" : "No API key - STAC API"}
          </span>
        </div>
      </div>

      {/* Source selection */}
      <div className="space-y-1.5">
        {satelliteSources.filter((s) => s.type === "scenes").map((src) => (
          <button
            key={src.id}
            onClick={() => { setSelectedSource(src.id); setScenes([]); setError(null); }}
            className={cn(
              "w-full text-left px-3 py-2.5 sm:py-2 rounded-md transition-colors",
              selectedSource === src.id
                ? "bg-sky-500/10 text-sky-700 dark:text-sky-400 ring-1 ring-sky-500/30"
                : "hover:bg-accent active:bg-accent"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">
                {locale === "tr" ? src.nameTr : src.nameEn}
              </span>
              <Badge variant="outline" className="text-[9px] h-4 shrink-0">GeoTIFF</Badge>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {locale === "tr" ? src.descriptionTr : src.descriptionEn}
            </div>
            <Badge variant="secondary" className="text-[9px] h-4 mt-1">{src.resolution}</Badge>
          </button>
        ))}
      </div>

      {/* ESRI tiles note */}
      <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
        <p className="text-[10px] text-blue-700 dark:text-blue-400">
          <span className="font-medium">
            {locale === "tr" ? "İpucu:" : "Tip:"}
          </span>{" "}
          {locale === "tr"
            ? "Yüksek çözünürlüklü uydu tile'ları için 'Tile İndir' sekmesinden ESRI Uydu seçin."
            : "For high-res satellite tiles, use 'Tile Download' tab with ESRI Satellite."}
        </p>
      </div>

      {/* Cloud cover filter */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {locale === "tr" ? "Maks Bulut:" : "Max Cloud:"}
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={maxCloud}
          onChange={(e) => setMaxCloud(parseInt(e.target.value))}
          className="flex-1 h-1.5 accent-primary"
        />
        <span className="text-xs font-mono w-8 text-right">{maxCloud}%</span>
      </div>

      {/* Search button */}
      {state.bbox ? (
        <Button
          size="sm"
          variant="outline"
          onClick={handleSearch}
          disabled={searching}
          className="w-full h-9"
        >
          {searching ? (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
          ) : (
            <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          )}
          {locale === "tr" ? "Uydu Görüntüsü Ara" : "Search Satellite Scenes"}
        </Button>
      ) : (
        <div className="p-3 rounded-lg border border-dashed text-center">
          <p className="text-xs text-muted-foreground">
            {locale === "tr" ? "Haritada bir alan seçin" : "Select an area on the map"}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Scene results */}
      {scenes.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">
            {scenes.length} {locale === "tr" ? "sonuç" : "results"}
          </span>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {scenes.map((scene) => {
              const bands = [];
              if (scene.visual) bands.push({ name: "visual", label: "TCI (RGB)", url: scene.visual });
              if (scene.red) bands.push({ name: "red", label: "Red (B04)", url: scene.red });
              if (scene.green) bands.push({ name: "green", label: "Green (B03)", url: scene.green });
              if (scene.blue) bands.push({ name: "blue", label: "Blue (B02)", url: scene.blue });
              if (scene.nir) bands.push({ name: "nir", label: "NIR (B08)", url: scene.nir });
              if (scene.nir08) bands.push({ name: "nir08", label: "NIR (B05)", url: scene.nir08 });
              if (scene.scl) bands.push({ name: "scl", label: "SCL", url: scene.scl });

              return (
                <div key={scene.id} className="p-2.5 rounded-lg border space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{scene.id}</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-[9px] h-4">
                          {formatDate(scene.datetime)}
                        </Badge>
                        {scene.cloudCover !== undefined && (
                          <Badge
                            variant={scene.cloudCover <= 10 ? "success" : "outline"}
                            className="text-[9px] h-4"
                          >
                            {locale === "tr" ? "Bulut" : "Cloud"}: {scene.cloudCover.toFixed(0)}%
                          </Badge>
                        )}
                        {scene.platform && (
                          <Badge variant="outline" className="text-[9px] h-4">{scene.platform}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Band download buttons */}
                  <div className="flex flex-wrap gap-1">
                    {bands.map((band) => (
                      <button
                        key={band.name}
                        onClick={() => handleDownloadBand(scene, band.name, band.url)}
                        disabled={downloading === `${scene.id}-${band.name}`}
                        className={cn(
                          "text-[10px] px-2 py-1 rounded border transition-colors min-h-[28px]",
                          downloading === `${scene.id}-${band.name}`
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-accent active:bg-accent text-foreground"
                        )}
                      >
                        {downloading === `${scene.id}-${band.name}` ? (
                          <div className="h-2.5 w-2.5 animate-spin rounded-full border border-current border-t-transparent inline-block mr-1" />
                        ) : (
                          <svg className="w-2.5 h-2.5 inline mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                          </svg>
                        )}
                        {band.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
