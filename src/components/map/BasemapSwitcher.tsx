"use client";

import { useI18n } from "@/i18n/context";
import { useAppStore } from "@/store/app-store";
import { tileSources } from "@/lib/tile-sources";
import { cn } from "@/lib/utils";

export default function BasemapSwitcher() {
  const { locale, t } = useI18n();
  const { state, dispatch } = useAppStore();

  const typeIcons: Record<string, string> = {
    standard: "M",
    satellite: "S",
    topo: "T",
    dark: "D",
    light: "L",
  };

  const typeColors: Record<string, string> = {
    standard: "bg-blue-500",
    satellite: "bg-emerald-600",
    topo: "bg-amber-500",
    dark: "bg-gray-700",
    light: "bg-gray-300 text-gray-800",
  };

  return (
    <div className="absolute bottom-4 right-4 z-[1000]">
      <div className="bg-card/95 backdrop-blur border rounded-lg shadow-lg p-1.5 flex gap-1">
        {tileSources.slice(0, 5).map((source) => (
          <button
            key={source.id}
            onClick={() => {
              dispatch({ type: "SET_BASEMAP", payload: source.id });
              if (typeof window !== "undefined" && (window as any).__gisMapSetBasemap) {
                (window as any).__gisMapSetBasemap(source.id);
              }
            }}
            title={locale === "tr" ? source.nameTr : source.nameEn}
            className={cn(
              "w-10 h-10 sm:w-8 sm:h-8 rounded-md flex items-center justify-center text-xs sm:text-[10px] font-bold transition-all",
              state.basemap === source.id
                ? cn(typeColors[source.type], "text-white ring-2 ring-primary ring-offset-1")
                : "bg-muted text-muted-foreground hover:bg-accent active:bg-accent"
            )}
          >
            {typeIcons[source.type] || "?"}
          </button>
        ))}
      </div>
    </div>
  );
}
