export interface DEMType {
  id: string;
  nameEn: string;
  nameTr: string;
  resolution: string;
  description: string;
}

export const demTypes: DEMType[] = [
  {
    id: "SRTMGL3",
    nameEn: "SRTM GL3 (90m)",
    nameTr: "SRTM GL3 (90m)",
    resolution: "90m",
    description: "Shuttle Radar Topography Mission - Global 3 arc second",
  },
  {
    id: "SRTMGL1",
    nameEn: "SRTM GL1 (30m)",
    nameTr: "SRTM GL1 (30m)",
    resolution: "30m",
    description: "Shuttle Radar Topography Mission - Global 1 arc second",
  },
  {
    id: "COP30",
    nameEn: "Copernicus 30m",
    nameTr: "Copernicus 30m",
    resolution: "30m",
    description: "Copernicus Global DEM 30m",
  },
  {
    id: "COP90",
    nameEn: "Copernicus 90m",
    nameTr: "Copernicus 90m",
    resolution: "90m",
    description: "Copernicus Global DEM 90m",
  },
  {
    id: "NASADEM",
    nameEn: "NASADEM (30m)",
    nameTr: "NASADEM (30m)",
    resolution: "30m",
    description: "NASA Digital Elevation Model",
  },
  {
    id: "AW3D30",
    nameEn: "ALOS World 3D (30m)",
    nameTr: "ALOS World 3D (30m)",
    resolution: "30m",
    description: "ALOS World 3D - 30m (JAXA)",
  },
];
