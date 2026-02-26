export interface TileSource {
  id: string;
  nameEn: string;
  nameTr: string;
  url: string;
  subdomains?: string[];
  attribution: string;
  maxZoom: number;
  type: "standard" | "satellite" | "topo" | "dark" | "light";
  tileSize?: number;
  ext?: string;
}

export const tileSources: TileSource[] = [
  {
    id: "osm-standard",
    nameEn: "OpenStreetMap",
    nameTr: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    subdomains: ["a", "b", "c"],
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
    type: "standard",
  },
  {
    id: "esri-imagery",
    nameEn: "ESRI Satellite",
    nameTr: "ESRI Uydu",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri, Maxar, Earthstar Geographics",
    maxZoom: 18,
    type: "satellite",
  },
  {
    id: "esri-topo",
    nameEn: "ESRI Topographic",
    nameTr: "ESRI Topografik",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri, HERE, Garmin, USGS",
    maxZoom: 18,
    type: "topo",
  },
  {
    id: "esri-street",
    nameEn: "ESRI Street Map",
    nameTr: "ESRI Sokak Haritası",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri, HERE, Garmin, USGS",
    maxZoom: 18,
    type: "standard",
  },
  {
    id: "opentopomap",
    nameEn: "OpenTopoMap",
    nameTr: "OpenTopoMap",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    subdomains: ["a", "b", "c"],
    attribution: "&copy; OpenTopoMap (CC-BY-SA)",
    maxZoom: 17,
    type: "topo",
  },
  {
    id: "carto-light",
    nameEn: "CartoDB Light",
    nameTr: "CartoDB Açık",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    subdomains: ["a", "b", "c", "d"],
    attribution: "&copy; CARTO &copy; OSM contributors",
    maxZoom: 20,
    type: "light",
  },
  {
    id: "carto-dark",
    nameEn: "CartoDB Dark Matter",
    nameTr: "CartoDB Koyu",
    url: "https://{s}.basemaps.cartocdn.com/dark_matter_all/{z}/{x}/{y}{r}.png",
    subdomains: ["a", "b", "c", "d"],
    attribution: "&copy; CARTO &copy; OSM contributors",
    maxZoom: 20,
    type: "dark",
  },
  {
    id: "carto-voyager",
    nameEn: "CartoDB Voyager",
    nameTr: "CartoDB Voyager",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    subdomains: ["a", "b", "c", "d"],
    attribution: "&copy; CARTO &copy; OSM contributors",
    maxZoom: 20,
    type: "standard",
  },
];

/** Resolve a tile URL with actual z/x/y values */
export function resolveTileUrl(source: TileSource, z: number, x: number, y: number): string {
  let url = source.url
    .replace("{z}", z.toString())
    .replace("{x}", x.toString())
    .replace("{y}", y.toString())
    .replace("{r}", "");

  if (source.subdomains && source.subdomains.length > 0) {
    const idx = (x + y) % source.subdomains.length;
    url = url.replace("{s}", source.subdomains[idx]);
  }

  return url;
}
