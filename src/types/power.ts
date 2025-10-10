export type LoadInput = {
  dwellingParams: DwellingParams;
  voltage: number;
  temperature: number;
  insulation: "60c" | "75c" | "90c";
  conductorCount: number;
  conductorType: "single" | "cable";
  installationMethod: "freeAir" | "raceway" | "bundled" | "tray";
  cableContact: "spaced" | "touching";
  cableCount: number;
  conductorMaterial: "copper" | "aluminum";
  dwellingType: "single" | "duplex" | "multi";
};
export type DwellingParams = {
  dwellingType: "single" | "row" | "apartment";
  area: number;
  rangeKw: number;
  appliances: number[]; // 额外电器负载（W）
  hasEV: boolean;
  evLoad: number;
  hasAC: boolean;
  acLoad: number;
  hasHeating: boolean;
  heatingLoad: number;
};
export type DwellingType = "single" | "row" | "apartment";

export type AmpacityContext = {
  temperature: number;
  insulation: "60c" | "75c" | "90c";
  conductorCount: number;
  conductorType: "single" | "cable";
  installationMethod: "freeAir" | "raceway" | "bundled" | "tray";
  cableContact: "spaced" | "touching";
  cableCount: number;
};
