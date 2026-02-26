"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/context";
import { useAppStore } from "@/store/app-store";
import { naturalEarthDatasets, naturalEarthCategories } from "@/lib/data-sources/natural-earth";
import { cn } from "@/lib/utils";

export default function NaturalEarthOptions() {
  const { locale } = useI18n();
  const { state, setCategory, setPreset } = useAppStore();
  const [scale, setScale] = useState("110m");

  const filteredDatasets = naturalEarthDatasets.filter((d) => {
    const catMatch = !state.activeCategory || d.category === state.activeCategory;
    const scaleMatch = d.scales.includes(scale);
    return catMatch && scaleMatch;
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
          {["110m", "50m", "10m"].map((s) => (
            <button
              key={s}
              onClick={() => setScale(s)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                scale === s
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              1:{s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5">
        {naturalEarthCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(state.activeCategory === cat.id ? "" : cat.id)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
              state.activeCategory === cat.id
                ? "bg-blue-500 text-white"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {locale === "tr" ? cat.nameTr : cat.nameEn}
          </button>
        ))}
      </div>

      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
        {filteredDatasets.map((dataset) => (
          <button
            key={dataset.id}
            onClick={() => setPreset(state.activePreset === dataset.id ? "" : dataset.id)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
              state.activePreset === dataset.id
                ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium"
                : "hover:bg-accent text-foreground"
            )}
          >
            {locale === "tr" ? dataset.nameTr : dataset.nameEn}
          </button>
        ))}
      </div>
    </div>
  );
}
