// src/types/load.ts
export interface OtherLoad {
  name: string;
  watts: number;
  type: "water heaters" | "other" | "range";
}

export interface LoadInput {
  aboveGroundFloorArea: number;
  belowGroundFloorArea: number;
  heatingLoad: number;
  acLoad: number;
  interlocked: boolean; // NEW: heater & AC interlock flag
  rangeLoad: number;
  waterHeaterLoad: number;
  evLoad: number;
  additionalLoads: number;
  totalLoad: number;
  largerLoad: number;
  finalLoad: number;
  feederSize: string;
  conductorMaterial: "copper" | "aluminum";
  temperature: "60c" | "75c" | "90c";
  otherLoads: OtherLoad[];
}

export interface LoadResult {
  totalLoad: number;
  finalLoad: number;
  panelSize: string;
  breakerSize: string;
  feederCable: string;
  waterHeaterLoad: number;
  additionalLoads: number;
}
