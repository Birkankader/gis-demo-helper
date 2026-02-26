"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ServiceLayer {
  name: string;
  title: string;
}

export default function WMSWFSOptions() {
  const { t } = useI18n();
  const [serviceUrl, setServiceUrl] = useState("");
  const [serviceType, setServiceType] = useState<"wms" | "wfs">("wms");
  const [layers, setLayers] = useState<ServiceLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCapabilities = async () => {
    if (!serviceUrl) return;
    setIsLoading(true);
    setError("");
    setLayers([]);

    try {
      const separator = serviceUrl.includes("?") ? "&" : "?";
      const capsUrl = `${serviceUrl}${separator}service=${serviceType.toUpperCase()}&request=GetCapabilities`;
      const res = await fetch(`/api/geocode?proxy=${encodeURIComponent(capsUrl)}`);
      const text = await res.text();

      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");
      const layerElements = xml.querySelectorAll("Layer > Name, FeatureType > Name");
      const titleElements = xml.querySelectorAll("Layer > Title, FeatureType > Title");

      const parsed: ServiceLayer[] = [];
      layerElements.forEach((el, i) => {
        parsed.push({
          name: el.textContent || "",
          title: titleElements[i]?.textContent || el.textContent || "",
        });
      });

      setLayers(parsed);
      if (parsed.length === 0) setError("No layers found");
    } catch {
      setError("Failed to fetch capabilities");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
        {(["wms", "wfs"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setServiceType(type)}
            className={cn(
              "flex-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors uppercase",
              serviceType === type
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={serviceUrl}
          onChange={(e) => setServiceUrl(e.target.value)}
          placeholder={`${serviceType.toUpperCase()} URL...`}
          className="h-8 text-xs"
        />
        <Button size="sm" onClick={fetchCapabilities} disabled={isLoading || !serviceUrl} className="h-8 px-3 text-xs shrink-0">
          {isLoading ? (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            t.common.loading.replace("...", "").trim() === "Yükleniyor" ? "Bağlan" : "Connect"
          )}
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {layers.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
          {layers.map((layer) => (
            <button
              key={layer.name}
              onClick={() => setSelectedLayer(selectedLayer === layer.name ? "" : layer.name)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                selectedLayer === layer.name
                  ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 font-medium"
                  : "hover:bg-accent text-foreground"
              )}
            >
              <div className="text-xs font-medium">{layer.title}</div>
              <div className="text-[10px] text-muted-foreground">{layer.name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
