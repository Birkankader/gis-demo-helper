"use client";

import { useI18n } from "@/i18n/context";
import { useAppStore } from "@/store/app-store";
import { osmCategories, osmPresets } from "@/lib/data-sources/overpass";
import { cn } from "@/lib/utils";

export default function OSMOptions() {
  const { locale } = useI18n();
  const { state, setCategory, setPreset } = useAppStore();

  const filteredPresets = state.activeCategory
    ? osmPresets.filter((p) => p.category === state.activeCategory)
    : osmPresets;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {osmCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(state.activeCategory === cat.id ? "" : cat.id)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
              state.activeCategory === cat.id
                ? "bg-emerald-500 text-white"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {locale === "tr" ? cat.nameTr : cat.nameEn}
          </button>
        ))}
      </div>

      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
        {filteredPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => setPreset(state.activePreset === preset.id ? "" : preset.id)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
              state.activePreset === preset.id
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium"
                : "hover:bg-accent text-foreground"
            )}
          >
            {locale === "tr" ? preset.nameTr : preset.nameEn}
          </button>
        ))}
      </div>
    </div>
  );
}
