"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/context";
import { geofabrikRegions, getGeofabrikShapefileUrl, getGeofabrikPbfUrl } from "@/lib/data-sources/geofabrik";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function GeofabrikOptions() {
  const { locale } = useI18n();
  const [search, setSearch] = useState("");
  const [format, setFormat] = useState<"shp" | "pbf">("shp");

  const filtered = geofabrikRegions.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.nameEn.toLowerCase().includes(q) ||
      r.nameTr.toLowerCase().includes(q) ||
      r.id.includes(q)
    );
  });

  const handleDownload = (regionId: string) => {
    const region = geofabrikRegions.find((r) => r.id === regionId);
    if (!region) return;

    const url = format === "pbf" ? getGeofabrikPbfUrl(region) : getGeofabrikShapefileUrl(region);
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-3">
      {/* Format toggle */}
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
        {(["shp", "pbf"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={cn(
              "flex-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors uppercase",
              format === f
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f === "shp" ? "Shapefile" : "PBF"}
          </button>
        ))}
      </div>

      {/* Search */}
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={locale === "tr" ? "Ülke ara..." : "Search country..."}
        className="h-8 text-xs"
      />

      {/* Region list */}
      <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
        {filtered.map((region) => (
          <button
            key={region.id}
            onClick={() => handleDownload(region.id)}
            className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {locale === "tr" ? region.nameTr : region.nameEn}
              </span>
              <div className="flex items-center gap-1">
                {format === "shp" && !region.hasShapefile && (
                  <Badge variant="outline" className="text-[9px] h-3.5 text-muted-foreground">
                    PBF only
                  </Badge>
                )}
                <svg
                  className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            {locale === "tr" ? "Sonuç bulunamadı" : "No results found"}
          </p>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground">
        {locale === "tr"
          ? "Geofabrik'ten doğrudan indirilir. Büyük dosyalar olabilir."
          : "Downloaded directly from Geofabrik. Files can be large."}
      </p>
    </div>
  );
}
