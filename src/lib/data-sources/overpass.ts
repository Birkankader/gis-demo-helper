import { BoundingBox } from "@/types/geo";

export interface OverpassPreset {
  id: string;
  nameEn: string;
  nameTr: string;
  category: string;
  query: (bbox: BoundingBox) => string;
}

const bb = (bbox: BoundingBox) => `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;

export const osmCategories = [
  { id: "roads", nameEn: "Roads & Highways", nameTr: "Yollar" },
  { id: "buildings", nameEn: "Buildings", nameTr: "Binalar" },
  { id: "pois", nameEn: "Points of Interest", nameTr: "İlgi Noktaları" },
  { id: "boundaries", nameEn: "Administrative Boundaries", nameTr: "İdari Sınırlar" },
  { id: "water", nameEn: "Water Bodies", nameTr: "Su Kaynakları" },
  { id: "landuse", nameEn: "Land Use", nameTr: "Arazi Kullanımı" },
  { id: "transport", nameEn: "Public Transport", nameTr: "Toplu Taşıma" },
  { id: "nature", nameEn: "Natural Features", nameTr: "Doğal Özellikler" },
];

export const osmPresets: OverpassPreset[] = [
  {
    id: "all-roads",
    nameEn: "All Roads",
    nameTr: "Tüm Yollar",
    category: "roads",
    query: (bbox) => `[out:json][timeout:30];(way["highway"](${bb(bbox)}););out geom;`,
  },
  {
    id: "major-roads",
    nameEn: "Major Roads (Motorway, Trunk, Primary)",
    nameTr: "Ana Yollar (Otoyol, Anayol, Birincil)",
    category: "roads",
    query: (bbox) => `[out:json][timeout:30];(way["highway"~"motorway|trunk|primary"](${bb(bbox)}););out geom;`,
  },
  {
    id: "secondary-roads",
    nameEn: "Secondary & Tertiary Roads",
    nameTr: "İkincil ve Üçüncül Yollar",
    category: "roads",
    query: (bbox) => `[out:json][timeout:30];(way["highway"~"secondary|tertiary"](${bb(bbox)}););out geom;`,
  },
  {
    id: "all-buildings",
    nameEn: "All Buildings",
    nameTr: "Tüm Binalar",
    category: "buildings",
    query: (bbox) => `[out:json][timeout:30];(way["building"](${bb(bbox)});relation["building"](${bb(bbox)}););out geom;`,
  },
  {
    id: "residential-buildings",
    nameEn: "Residential Buildings",
    nameTr: "Konut Binaları",
    category: "buildings",
    query: (bbox) => `[out:json][timeout:30];(way["building"="residential"](${bb(bbox)});way["building"="apartments"](${bb(bbox)}););out geom;`,
  },
  {
    id: "restaurants",
    nameEn: "Restaurants & Cafes",
    nameTr: "Restoranlar ve Kafeler",
    category: "pois",
    query: (bbox) => `[out:json][timeout:30];(node["amenity"~"restaurant|cafe"](${bb(bbox)}););out geom;`,
  },
  {
    id: "hospitals",
    nameEn: "Hospitals & Clinics",
    nameTr: "Hastaneler ve Klinikler",
    category: "pois",
    query: (bbox) => `[out:json][timeout:30];(node["amenity"~"hospital|clinic"](${bb(bbox)});way["amenity"~"hospital|clinic"](${bb(bbox)}););out geom;`,
  },
  {
    id: "schools",
    nameEn: "Schools & Universities",
    nameTr: "Okullar ve Üniversiteler",
    category: "pois",
    query: (bbox) => `[out:json][timeout:30];(node["amenity"~"school|university|college"](${bb(bbox)});way["amenity"~"school|university|college"](${bb(bbox)}););out geom;`,
  },
  {
    id: "shops",
    nameEn: "Shops & Markets",
    nameTr: "Dükkanlar ve Marketler",
    category: "pois",
    query: (bbox) => `[out:json][timeout:30];(node["shop"](${bb(bbox)}););out geom;`,
  },
  {
    id: "admin-boundaries",
    nameEn: "Administrative Boundaries",
    nameTr: "İdari Sınırlar",
    category: "boundaries",
    query: (bbox) => `[out:json][timeout:30];(relation["boundary"="administrative"](${bb(bbox)}););out geom;`,
  },
  {
    id: "rivers",
    nameEn: "Rivers & Streams",
    nameTr: "Nehirler ve Dereler",
    category: "water",
    query: (bbox) => `[out:json][timeout:30];(way["waterway"~"river|stream"](${bb(bbox)}););out geom;`,
  },
  {
    id: "lakes",
    nameEn: "Lakes & Reservoirs",
    nameTr: "Göller ve Barajlar",
    category: "water",
    query: (bbox) => `[out:json][timeout:30];(way["natural"="water"](${bb(bbox)});relation["natural"="water"](${bb(bbox)}););out geom;`,
  },
  {
    id: "forests",
    nameEn: "Forests & Parks",
    nameTr: "Ormanlar ve Parklar",
    category: "landuse",
    query: (bbox) => `[out:json][timeout:30];(way["landuse"~"forest|meadow"](${bb(bbox)});way["leisure"="park"](${bb(bbox)}););out geom;`,
  },
  {
    id: "railways",
    nameEn: "Railways",
    nameTr: "Demiryolları",
    category: "transport",
    query: (bbox) => `[out:json][timeout:30];(way["railway"="rail"](${bb(bbox)}););out geom;`,
  },
  {
    id: "bus-stops",
    nameEn: "Bus Stops",
    nameTr: "Otobüs Durakları",
    category: "transport",
    query: (bbox) => `[out:json][timeout:30];(node["highway"="bus_stop"](${bb(bbox)}););out geom;`,
  },
  {
    id: "peaks",
    nameEn: "Mountain Peaks",
    nameTr: "Dağ Zirveleri",
    category: "nature",
    query: (bbox) => `[out:json][timeout:30];(node["natural"="peak"](${bb(bbox)}););out geom;`,
  },
];
