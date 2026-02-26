# GIS Demo Helper

Demo ve test için GIS verisi bulmakta zorlanıyorsanız, bu uygulama tam size göre. Üçüncü parti kaynaklardan harita tile'ları, yükseklik verileri, uydu görüntüleri ve vektör verileri **API key olmadan** indirin.

> **Türkçe / English** — Uygulama çift dil destekler, tarayıcı dilinize göre otomatik seçilir.

---

## Hızlı Başlangıç

```bash
git clone <repo-url> && cd gis-demo-helper
chmod +x setup.sh && ./setup.sh
```

`setup.sh` tek komutla bağımlılıkları yükler, projeyi derler ve başlatır.

### Manuel Kurulum

```bash
# Gereksinimler: Node.js 18+
npm install --legacy-peer-deps
npm run dev
# → http://localhost:3000
```

### Production

```bash
npm run build
npm run start
```

---

## Veri Kaynakları

| Sekme | Kaynak | Format | Çözünürlük | API Key |
|-------|--------|--------|------------|---------|
| **M** — OpenStreetMap | Overpass API | GeoJSON, KML | Vektör | Yok |
| **T** — Tile İndir | OSM, ESRI, CartoDB, OpenTopoMap | PNG/JPG tiles | z1–z19 | Yok |
| **E** — Terrain/DEM | SRTM (AWS), Copernicus DEM, ViewFinderPanoramas | HGT, GeoTIFF | 30m / 90m | Yok |
| **S** — Uydu Görüntüsü | Sentinel-2, Landsat 8/9 | GeoTIFF (COG) | 10m / 30m | Yok |
| **N** — Natural Earth | GitHub CDN | GeoJSON, KML | 10m–110m | Yok |
| **G** — Geofabrik | Geofabrik.de | Shapefile, PBF | Ülke bazlı | Yok |
| **W** — WMS/WFS | Özel sunucu | GeoJSON | Değişken | Sunucuya bağlı |

### Terrain / DEM Detayları

| Kaynak | Format | Dosya Uzantısı | Kapsam |
|--------|--------|----------------|--------|
| SRTM 30m | HGT (gzip) | `.hgt.gz` | 60°N – 56°S |
| Copernicus DEM 30m | Cloud-Optimized GeoTIFF | `.tif` | Global |
| Copernicus DEM 90m | Cloud-Optimized GeoTIFF | `.tif` | Global |
| ViewFinder Panoramas 90m | HGT (zip) | `.hgt.zip` | Global |

**DTED2 formatına dönüştürmek için:**

```bash
# GDAL yüklü olmalı
gdal_translate -of DTED input.hgt output.dt2
gdal_translate -of DTED input.tif output.dt2
```

### Uydu Görüntüsü Detayları

| Kaynak | Bandlar | Çözünürlük | Arama |
|--------|---------|------------|-------|
| Sentinel-2 L2A | TCI (RGB), R, G, B, NIR, SCL | 10m (RGB), 20m (NIR) | STAC API (Element84) |
| Landsat 8/9 | R, G, B, NIR | 30m, 15m (pan) | STAC API (USGS) |

Tüm uydu görüntüleri Cloud-Optimized GeoTIFF (COG) formatındadır. Doğrudan QGIS, GDAL veya GeoServer'a yüklenebilir.

---

## Proje Yapısı

```
gis-demo-helper/
├── setup.sh                    # Tek komutla kurulum
├── package.json                # Next.js 15, React 19, Leaflet
├── .env.local                  # Sadece Overpass URL (opsiyonel)
│
├── src/
│   ├── app/
│   │   ├── page.tsx            # Ana sayfa
│   │   ├── layout.tsx          # Root layout, providers
│   │   └── api/
│   │       ├── osm/            # Overpass API proxy
│   │       ├── tiles/          # Tile indirme (count, download, proxy)
│   │       ├── elevation/      # Terrain DEM (SRTM, Copernicus)
│   │       ├── satellite/      # Sentinel-2 / Landsat STAC arama + proxy
│   │       ├── natural-earth/  # GitHub CDN proxy
│   │       ├── geofabrik/      # Geofabrik redirect
│   │       └── geocode/        # Nominatim geocoding
│   │
│   ├── components/
│   │   ├── data-sources/       # Veri kaynağı panelleri (OSM, Tile, DEM, Uydu...)
│   │   ├── download/           # İndirme paneli + geçmiş
│   │   ├── map/                # Leaflet harita + basemap switcher
│   │   ├── search/             # Konum arama
│   │   ├── layout/             # Header
│   │   └── ui/                 # Button, Badge, Card, Select...
│   │
│   ├── lib/
│   │   ├── tile-math.ts        # Bbox → tile koordinat hesaplama
│   │   ├── tile-sources.ts     # 8 ücretsiz tile sunucusu
│   │   └── data-sources/
│   │       ├── terrain.ts      # SRTM, Copernicus, ViewFinder URL'leri
│   │       ├── satellite.ts    # Sentinel-2 / Landsat STAC
│   │       ├── overpass.ts     # OSM query presetleri
│   │       ├── natural-earth.ts# Natural Earth datasetleri
│   │       └── geofabrik.ts    # Ülke listesi + URL'ler
│   │
│   ├── i18n/                   # Türkçe / İngilizce çeviri
│   ├── store/                  # React Context + useReducer state
│   └── types/                  # TypeScript tip tanımları
│
└── tailwind.config.ts          # Tailwind CSS (tema, animasyon)
```

---

## Teknolojiler

- **Next.js 15** (App Router, API Routes)
- **React 19**
- **TypeScript 5.9**
- **Tailwind CSS** + shadcn/ui benzeri bileşenler
- **Leaflet** — interaktif harita

---

## Kullanım Akışı

1. Haritada konum arayın veya doğrudan gezinin
2. **Alan Seç** butonuna basıp haritada dikdörtgen çizin (mobilde sol alt FAB butonu)
3. Sol panelden veri kaynağı seçin (M, T, E, S, N, G, W)
4. Kaynak seçeneklerini ayarlayın (format, zoom, filtre...)
5. **İndir** — dosya doğrudan tarayıcıya iner

---

## Ortam Değişkenleri

| Değişken | Zorunlu | Varsayılan | Açıklama |
|----------|---------|------------|----------|
| `OVERPASS_API_URL` | Hayır | `https://overpass-api.de/api/interpreter` | Özel Overpass endpoint |

> **API key gerekmez.** Tüm veri kaynakları ücretsiz ve açık erişimlidir.

---

## Lisans

MIT
