"use client";

import { useI18n } from "@/i18n/context";
import { useAppStore } from "@/store/app-store";
import { DataSourceId } from "@/types/data-source";
import { cn } from "@/lib/utils";
import OSMOptions from "./OSMOptions";
import NaturalEarthOptions from "./NaturalEarthOptions";
import ElevationOptions from "./ElevationOptions";
import WMSWFSOptions from "./WMSWFSOptions";

const sources: { id: DataSourceId; icon: string }[] = [
  { id: "osm", icon: "M" },
  { id: "natural-earth", icon: "N" },
  { id: "elevation", icon: "E" },
  { id: "wms-wfs", icon: "W" },
];

export default function DataSourcePanel() {
  const { t } = useI18n();
  const { state, setSource } = useAppStore();

  const sourceNames: Record<DataSourceId, { name: string; desc: string }> = {
    osm: { name: t.sources.osm.name, desc: t.sources.osm.description },
    "natural-earth": { name: t.sources.naturalEarth.name, desc: t.sources.naturalEarth.description },
    elevation: { name: t.sources.elevation.name, desc: t.sources.elevation.description },
    "wms-wfs": { name: t.sources.wmsWfs.name, desc: t.sources.wmsWfs.description },
  };

  const iconColors: Record<DataSourceId, string> = {
    osm: "bg-emerald-500",
    "natural-earth": "bg-blue-500",
    elevation: "bg-amber-500",
    "wms-wfs": "bg-purple-500",
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {sources.map((s) => (
          <button
            key={s.id}
            onClick={() => setSource(s.id)}
            className={cn(
              "flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all text-sm",
              state.activeSource === s.id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-transparent hover:bg-accent"
            )}
          >
            <div className={cn("w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0", iconColors[s.id])}>
              {s.icon}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-xs truncate">{sourceNames[s.id].name}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="border-t pt-3">
        <p className="text-xs text-muted-foreground mb-2">
          {sourceNames[state.activeSource].desc}
        </p>

        {state.activeSource === "osm" && <OSMOptions />}
        {state.activeSource === "natural-earth" && <NaturalEarthOptions />}
        {state.activeSource === "elevation" && <ElevationOptions />}
        {state.activeSource === "wms-wfs" && <WMSWFSOptions />}
      </div>
    </div>
  );
}
