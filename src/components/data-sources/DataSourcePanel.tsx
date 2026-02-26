"use client";

import { useI18n } from "@/i18n/context";
import { useAppStore } from "@/store/app-store";
import { DataSourceId } from "@/types/data-source";
import { cn } from "@/lib/utils";
import OSMOptions from "./OSMOptions";
import NaturalEarthOptions from "./NaturalEarthOptions";
import TileDownloadOptions from "./TileDownloadOptions";
import ElevationOptions from "./ElevationOptions";
import GeofabrikOptions from "./GeofabrikOptions";
import WMSWFSOptions from "./WMSWFSOptions";

const sources: { id: DataSourceId; icon: string }[] = [
  { id: "osm", icon: "M" },
  { id: "tiles", icon: "T" },
  { id: "natural-earth", icon: "N" },
  { id: "elevation", icon: "E" },
  { id: "geofabrik", icon: "G" },
  { id: "wms-wfs", icon: "W" },
];

export default function DataSourcePanel() {
  const { t } = useI18n();
  const { state, setSource } = useAppStore();

  const sourceNames: Record<DataSourceId, { name: string; desc: string }> = {
    osm: { name: t.sources.osm.name, desc: t.sources.osm.description },
    tiles: { name: t.sources.tiles.name, desc: t.sources.tiles.description },
    "natural-earth": { name: t.sources.naturalEarth.name, desc: t.sources.naturalEarth.description },
    elevation: { name: t.sources.elevation.name, desc: t.sources.elevation.description },
    geofabrik: { name: t.sources.geofabrik.name, desc: t.sources.geofabrik.description },
    "wms-wfs": { name: t.sources.wmsWfs.name, desc: t.sources.wmsWfs.description },
  };

  const iconColors: Record<DataSourceId, string> = {
    osm: "bg-emerald-500",
    tiles: "bg-violet-500",
    "natural-earth": "bg-blue-500",
    elevation: "bg-amber-500",
    geofabrik: "bg-orange-500",
    "wms-wfs": "bg-purple-500",
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1.5">
        {sources.map((s) => (
          <button
            key={s.id}
            onClick={() => setSource(s.id)}
            className={cn(
              "flex flex-col items-center gap-1 p-2.5 sm:p-2 rounded-lg border text-center transition-all min-h-[60px]",
              state.activeSource === s.id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-transparent hover:bg-accent active:bg-accent"
            )}
          >
            <div className={cn("w-8 h-8 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-white text-xs font-bold", iconColors[s.id])}>
              {s.icon}
            </div>
            <span className="text-[11px] sm:text-[10px] font-medium leading-tight truncate w-full">{sourceNames[s.id].name}</span>
          </button>
        ))}
      </div>

      <div className="border-t pt-3">
        <p className="text-xs text-muted-foreground mb-2">
          {sourceNames[state.activeSource].desc}
        </p>

        {state.activeSource === "osm" && <OSMOptions />}
        {state.activeSource === "tiles" && <TileDownloadOptions />}
        {state.activeSource === "natural-earth" && <NaturalEarthOptions />}
        {state.activeSource === "elevation" && <ElevationOptions />}
        {state.activeSource === "geofabrik" && <GeofabrikOptions />}
        {state.activeSource === "wms-wfs" && <WMSWFSOptions />}
      </div>
    </div>
  );
}
