"use client";

import React, { createContext, useContext, useReducer, useCallback } from "react";
import { BoundingBox } from "@/types/geo";
import { DataSourceId, ExportFormat } from "@/types/data-source";
import { DownloadItem } from "@/types/download";
import { generateId } from "@/lib/utils";

interface AppState {
  bbox: BoundingBox | null;
  activeSource: DataSourceId;
  activeCategory: string;
  activePreset: string;
  exportFormat: ExportFormat;
  previewData: GeoJSON.FeatureCollection | null;
  isLoading: boolean;
  downloads: DownloadItem[];
  sidebarOpen: boolean;
  theme: "light" | "dark" | "system";
  basemap: string;
  tileZoomMin: number;
  tileZoomMax: number;
}

type AppAction =
  | { type: "SET_BBOX"; payload: BoundingBox | null }
  | { type: "SET_SOURCE"; payload: DataSourceId }
  | { type: "SET_CATEGORY"; payload: string }
  | { type: "SET_PRESET"; payload: string }
  | { type: "SET_FORMAT"; payload: ExportFormat }
  | { type: "SET_PREVIEW"; payload: GeoJSON.FeatureCollection | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "ADD_DOWNLOAD"; payload: DownloadItem }
  | { type: "UPDATE_DOWNLOAD"; payload: { id: string; updates: Partial<DownloadItem> } }
  | { type: "REMOVE_DOWNLOAD"; payload: string }
  | { type: "CLEAR_DOWNLOADS" }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_THEME"; payload: "light" | "dark" | "system" }
  | { type: "SET_BASEMAP"; payload: string }
  | { type: "SET_TILE_ZOOM"; payload: { min: number; max: number } };

const initialState: AppState = {
  bbox: null,
  activeSource: "osm",
  activeCategory: "",
  activePreset: "",
  exportFormat: "geojson",
  previewData: null,
  isLoading: false,
  downloads: [],
  sidebarOpen: true,
  theme: "system",
  basemap: "osm-standard",
  tileZoomMin: 10,
  tileZoomMax: 14,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_BBOX":
      return { ...state, bbox: action.payload, previewData: null };
    case "SET_SOURCE":
      return { ...state, activeSource: action.payload, activeCategory: "", activePreset: "", previewData: null };
    case "SET_CATEGORY":
      return { ...state, activeCategory: action.payload, activePreset: "", previewData: null };
    case "SET_PRESET":
      return { ...state, activePreset: action.payload, previewData: null };
    case "SET_FORMAT":
      return { ...state, exportFormat: action.payload };
    case "SET_PREVIEW":
      return { ...state, previewData: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "ADD_DOWNLOAD":
      return { ...state, downloads: [action.payload, ...state.downloads] };
    case "UPDATE_DOWNLOAD":
      return {
        ...state,
        downloads: state.downloads.map((d) =>
          d.id === action.payload.id ? { ...d, ...action.payload.updates } : d
        ),
      };
    case "REMOVE_DOWNLOAD":
      return { ...state, downloads: state.downloads.filter((d) => d.id !== action.payload) };
    case "CLEAR_DOWNLOADS":
      return { ...state, downloads: [] };
    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case "SET_THEME":
      return { ...state, theme: action.payload };
    case "SET_BASEMAP":
      return { ...state, basemap: action.payload };
    case "SET_TILE_ZOOM":
      return { ...state, tileZoomMin: action.payload.min, tileZoomMax: action.payload.max };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setBbox: (bbox: BoundingBox | null) => void;
  setSource: (source: DataSourceId) => void;
  setCategory: (category: string) => void;
  setPreset: (preset: string) => void;
  setFormat: (format: ExportFormat) => void;
  setPreview: (data: GeoJSON.FeatureCollection | null) => void;
  setLoading: (loading: boolean) => void;
  addDownload: (item: Omit<DownloadItem, "id">) => string;
  updateDownload: (id: string, updates: Partial<DownloadItem>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setBbox = useCallback((bbox: BoundingBox | null) => dispatch({ type: "SET_BBOX", payload: bbox }), []);
  const setSource = useCallback((source: DataSourceId) => dispatch({ type: "SET_SOURCE", payload: source }), []);
  const setCategory = useCallback((category: string) => dispatch({ type: "SET_CATEGORY", payload: category }), []);
  const setPreset = useCallback((preset: string) => dispatch({ type: "SET_PRESET", payload: preset }), []);
  const setFormat = useCallback((format: ExportFormat) => dispatch({ type: "SET_FORMAT", payload: format }), []);
  const setPreview = useCallback((data: GeoJSON.FeatureCollection | null) => dispatch({ type: "SET_PREVIEW", payload: data }), []);
  const setLoading = useCallback((loading: boolean) => dispatch({ type: "SET_LOADING", payload: loading }), []);

  const addDownload = useCallback((item: Omit<DownloadItem, "id">) => {
    const id = generateId();
    dispatch({ type: "ADD_DOWNLOAD", payload: { ...item, id } });
    return id;
  }, []);

  const updateDownload = useCallback((id: string, updates: Partial<DownloadItem>) => {
    dispatch({ type: "UPDATE_DOWNLOAD", payload: { id, updates } });
  }, []);

  return (
    <AppContext.Provider
      value={{ state, dispatch, setBbox, setSource, setCategory, setPreset, setFormat, setPreview, setLoading, addDownload, updateDownload }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
}
