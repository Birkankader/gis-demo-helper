export interface NaturalEarthDataset {
  id: string;
  nameEn: string;
  nameTr: string;
  category: "cultural" | "physical";
  scales: string[];
  filename: string;
}

export const naturalEarthCategories = [
  { id: "cultural", nameEn: "Cultural", nameTr: "Kültürel" },
  { id: "physical", nameEn: "Physical", nameTr: "Fiziksel" },
];

export const naturalEarthDatasets: NaturalEarthDataset[] = [
  // Cultural
  {
    id: "admin-0-countries",
    nameEn: "Country Boundaries",
    nameTr: "Ülke Sınırları",
    category: "cultural",
    scales: ["10m", "50m", "110m"],
    filename: "admin_0_countries",
  },
  {
    id: "admin-1-states",
    nameEn: "States / Provinces",
    nameTr: "Eyaletler / İller",
    category: "cultural",
    scales: ["10m", "50m", "110m"],
    filename: "admin_1_states_provinces",
  },
  {
    id: "populated-places",
    nameEn: "Populated Places",
    nameTr: "Yerleşim Yerleri",
    category: "cultural",
    scales: ["10m", "50m", "110m"],
    filename: "populated_places",
  },
  {
    id: "airports",
    nameEn: "Airports",
    nameTr: "Havalimanları",
    category: "cultural",
    scales: ["10m", "50m"],
    filename: "airports",
  },
  {
    id: "ports",
    nameEn: "Ports",
    nameTr: "Limanlar",
    category: "cultural",
    scales: ["10m", "50m"],
    filename: "ports",
  },
  {
    id: "roads",
    nameEn: "Roads",
    nameTr: "Yollar",
    category: "cultural",
    scales: ["10m"],
    filename: "roads",
  },
  {
    id: "railroads",
    nameEn: "Railroads",
    nameTr: "Demiryolları",
    category: "cultural",
    scales: ["10m", "50m"],
    filename: "railroads",
  },
  {
    id: "urban-areas",
    nameEn: "Urban Areas",
    nameTr: "Kentsel Alanlar",
    category: "cultural",
    scales: ["10m", "50m"],
    filename: "urban_areas",
  },
  // Physical
  {
    id: "coastline",
    nameEn: "Coastline",
    nameTr: "Kıyı Çizgisi",
    category: "physical",
    scales: ["10m", "50m", "110m"],
    filename: "coastline",
  },
  {
    id: "land",
    nameEn: "Land",
    nameTr: "Kara",
    category: "physical",
    scales: ["10m", "50m", "110m"],
    filename: "land",
  },
  {
    id: "ocean",
    nameEn: "Ocean",
    nameTr: "Okyanus",
    category: "physical",
    scales: ["10m", "50m", "110m"],
    filename: "ocean",
  },
  {
    id: "rivers-lake-centerlines",
    nameEn: "Rivers & Lake Centerlines",
    nameTr: "Nehirler ve Göl Merkez Çizgileri",
    category: "physical",
    scales: ["10m", "50m", "110m"],
    filename: "rivers_lake_centerlines",
  },
  {
    id: "lakes",
    nameEn: "Lakes",
    nameTr: "Göller",
    category: "physical",
    scales: ["10m", "50m", "110m"],
    filename: "lakes",
  },
  {
    id: "glaciated-areas",
    nameEn: "Glaciated Areas",
    nameTr: "Buzul Alanları",
    category: "physical",
    scales: ["10m", "50m", "110m"],
    filename: "glaciated_areas",
  },
  {
    id: "geography-regions",
    nameEn: "Geographic Regions",
    nameTr: "Coğrafi Bölgeler",
    category: "physical",
    scales: ["10m", "50m", "110m"],
    filename: "geography_regions_polys",
  },
];

export function getNaturalEarthUrl(dataset: NaturalEarthDataset, scale: string): string {
  return `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_${scale}_${dataset.filename}.geojson`;
}

export function getNaturalEarthShapefileUrl(dataset: NaturalEarthDataset, scale: string): string {
  return `https://naciscdn.org/naturalearth/${scale.replace("m", "")}/cultural/ne_${scale}_${dataset.filename}.zip`;
}
