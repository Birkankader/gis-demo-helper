import { DataSourceId, ExportFormat } from "./data-source";
import { BoundingBox } from "./geo";

export type DownloadStatus = "pending" | "downloading" | "converting" | "completed" | "error";

export interface DownloadItem {
  id: string;
  name: string;
  source: DataSourceId;
  format: ExportFormat;
  bbox: BoundingBox;
  status: DownloadStatus;
  progress: number;
  size?: number;
  error?: string;
  timestamp: number;
  filePath?: string;
}

export interface DownloadHistory {
  items: DownloadItem[];
}
