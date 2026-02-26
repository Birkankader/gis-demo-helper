"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/context";

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: [string, string, string, string];
}

interface LocationSearchProps {
  onSelect: (result: { lat: number; lng: number; bbox?: { south: number; west: number; north: number; east: number }; name: string }) => void;
}

export default function LocationSearch({ onSelect }: LocationSearchProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(
    async (q: string) => {
      if (q.length < 3) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`,
          { headers: { "Accept-Language": "en" } }
        );
        const data: SearchResult[] = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      search(query);
    }
  };

  const handleSelect = (result: SearchResult) => {
    const [south, north, west, east] = result.boundingbox.map(Number);
    onSelect({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      bbox: { south, west, north, east },
      name: result.display_name,
    });
    setQuery(result.display_name.split(",")[0]);
    setResults([]);
  };

  return (
    <div className="relative">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.map.searchPlaceholder}
          className="pl-9 h-9 text-sm"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-lg max-h-60 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors border-b last:border-0"
              onClick={() => handleSelect(r)}
            >
              <span className="line-clamp-1">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
