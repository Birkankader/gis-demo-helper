export interface GeofabrikRegion {
  id: string;
  nameEn: string;
  nameTr: string;
  path: string;
  parent?: string;
  hasShapefile: boolean;
  hasPbf: boolean;
}

export const geofabrikRegions: GeofabrikRegion[] = [
  // Europe
  { id: "turkey", nameEn: "Turkey", nameTr: "Türkiye", path: "europe/turkey", hasShapefile: true, hasPbf: true },
  { id: "germany", nameEn: "Germany", nameTr: "Almanya", path: "europe/germany", hasShapefile: true, hasPbf: true },
  { id: "france", nameEn: "France", nameTr: "Fransa", path: "europe/france", hasShapefile: true, hasPbf: true },
  { id: "italy", nameEn: "Italy", nameTr: "İtalya", path: "europe/italy", hasShapefile: true, hasPbf: true },
  { id: "spain", nameEn: "Spain", nameTr: "İspanya", path: "europe/spain", hasShapefile: true, hasPbf: true },
  { id: "united-kingdom", nameEn: "United Kingdom", nameTr: "İngiltere", path: "europe/great-britain", hasShapefile: true, hasPbf: true },
  { id: "netherlands", nameEn: "Netherlands", nameTr: "Hollanda", path: "europe/netherlands", hasShapefile: true, hasPbf: true },
  { id: "switzerland", nameEn: "Switzerland", nameTr: "İsviçre", path: "europe/switzerland", hasShapefile: true, hasPbf: true },
  { id: "austria", nameEn: "Austria", nameTr: "Avusturya", path: "europe/austria", hasShapefile: true, hasPbf: true },
  { id: "greece", nameEn: "Greece", nameTr: "Yunanistan", path: "europe/greece", hasShapefile: true, hasPbf: true },
  { id: "bulgaria", nameEn: "Bulgaria", nameTr: "Bulgaristan", path: "europe/bulgaria", hasShapefile: true, hasPbf: true },
  { id: "romania", nameEn: "Romania", nameTr: "Romanya", path: "europe/romania", hasShapefile: true, hasPbf: true },
  { id: "poland", nameEn: "Poland", nameTr: "Polonya", path: "europe/poland", hasShapefile: true, hasPbf: true },
  { id: "czech-republic", nameEn: "Czech Republic", nameTr: "Çekya", path: "europe/czech-republic", hasShapefile: true, hasPbf: true },
  { id: "sweden", nameEn: "Sweden", nameTr: "İsveç", path: "europe/sweden", hasShapefile: true, hasPbf: true },
  { id: "norway", nameEn: "Norway", nameTr: "Norveç", path: "europe/norway", hasShapefile: true, hasPbf: true },
  { id: "russia", nameEn: "Russia", nameTr: "Rusya", path: "russia", hasShapefile: true, hasPbf: true },
  // Asia
  { id: "japan", nameEn: "Japan", nameTr: "Japonya", path: "asia/japan", hasShapefile: true, hasPbf: true },
  { id: "china", nameEn: "China", nameTr: "Çin", path: "asia/china", hasShapefile: true, hasPbf: true },
  { id: "india", nameEn: "India", nameTr: "Hindistan", path: "asia/india", hasShapefile: true, hasPbf: true },
  { id: "iran", nameEn: "Iran", nameTr: "İran", path: "asia/iran", hasShapefile: true, hasPbf: true },
  { id: "iraq", nameEn: "Iraq", nameTr: "Irak", path: "asia/iraq", hasShapefile: true, hasPbf: true },
  { id: "georgia", nameEn: "Georgia", nameTr: "Gürcistan", path: "europe/georgia", hasShapefile: true, hasPbf: true },
  { id: "azerbaijan", nameEn: "Azerbaijan", nameTr: "Azerbaycan", path: "asia/azerbaijan", hasShapefile: true, hasPbf: true },
  // Americas
  { id: "us-northeast", nameEn: "US Northeast", nameTr: "ABD Kuzeydoğu", path: "north-america/us/northeast", hasShapefile: true, hasPbf: true },
  { id: "us-west", nameEn: "US West", nameTr: "ABD Batı", path: "north-america/us/west", hasShapefile: true, hasPbf: true },
  { id: "brazil", nameEn: "Brazil", nameTr: "Brezilya", path: "south-america/brazil", hasShapefile: true, hasPbf: true },
  // Africa & Oceania
  { id: "egypt", nameEn: "Egypt", nameTr: "Mısır", path: "africa/egypt", hasShapefile: true, hasPbf: true },
  { id: "australia", nameEn: "Australia", nameTr: "Avustralya", path: "australia-oceania/australia", hasShapefile: true, hasPbf: true },
  // Continents
  { id: "europe", nameEn: "Europe (Full)", nameTr: "Avrupa (Tam)", path: "europe", hasShapefile: false, hasPbf: true },
  { id: "asia", nameEn: "Asia (Full)", nameTr: "Asya (Tam)", path: "asia", hasShapefile: false, hasPbf: true },
  { id: "africa", nameEn: "Africa (Full)", nameTr: "Afrika (Tam)", path: "africa", hasShapefile: false, hasPbf: true },
];

const GEOFABRIK_BASE = "https://download.geofabrik.de";

export function getGeofabrikShapefileUrl(region: GeofabrikRegion): string {
  return `${GEOFABRIK_BASE}/${region.path}-latest-free.shp.zip`;
}

export function getGeofabrikPbfUrl(region: GeofabrikRegion): string {
  return `${GEOFABRIK_BASE}/${region.path}-latest.osm.pbf`;
}

export type GeofabrikFormat = "shp" | "pbf";
