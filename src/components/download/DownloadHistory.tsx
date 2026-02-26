"use client";

import { useI18n } from "@/i18n/context";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/lib/utils";

export default function DownloadHistory() {
  const { t } = useI18n();
  const { state, dispatch } = useAppStore();

  if (state.downloads.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-muted-foreground">{t.download.noData}</p>
      </div>
    );
  }

  const statusColors = {
    pending: "outline",
    downloading: "default",
    converting: "secondary",
    completed: "success",
    error: "destructive",
  } as const;

  const statusLabels = {
    pending: "...",
    downloading: t.download.progress,
    converting: "Converting...",
    completed: t.download.completed,
    error: t.download.error,
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {t.download.history} ({state.downloads.length})
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => dispatch({ type: "CLEAR_DOWNLOADS" })}
          className="h-6 px-2 text-[10px]"
        >
          {t.download.clearHistory}
        </Button>
      </div>

      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
        {state.downloads.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 p-2 rounded-md border bg-card text-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium truncate">{item.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant={statusColors[item.status]} className="text-[10px] h-4">
                  {statusLabels[item.status]}
                </Badge>
                {item.size && (
                  <span className="text-[10px] text-muted-foreground">
                    {formatBytes(item.size)}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => dispatch({ type: "REMOVE_DOWNLOAD", payload: item.id })}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
