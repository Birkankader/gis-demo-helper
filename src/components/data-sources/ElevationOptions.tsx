"use client";

import { useAppStore } from "@/store/app-store";
import { demTypes } from "@/lib/data-sources/opentopography";
import { cn } from "@/lib/utils";

export default function ElevationOptions() {
  const { state, setPreset } = useAppStore();

  return (
    <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
      {demTypes.map((dem) => (
        <button
          key={dem.id}
          onClick={() => setPreset(state.activePreset === dem.id ? "" : dem.id)}
          className={cn(
            "w-full text-left px-3 py-2.5 rounded-md transition-colors",
            state.activePreset === dem.id
              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
              : "hover:bg-accent text-foreground"
          )}
        >
          <div className="text-sm font-medium">{dem.nameEn}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{dem.description}</div>
        </button>
      ))}
    </div>
  );
}
