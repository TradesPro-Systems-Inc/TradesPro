// device.ts
export type DeviceType =
  | "waterHeater"
  | "appliance"
  | "ev"
  | "range"
  | "heater"
  | "ac"
  | "other";

// Heater 的细分（符合 CEC 62）
export type HeaterType =
  | "ETS" // electric thermal storage
  | "duct" // duct heater
  | "furnace" // electric furnace
  | "spaceHeating" // space heating with thermostats
  | "other";

// AC 风格和单位
export type ACStyleType = "window" | "split" | "central" | "heatPump" | "other";
export type ACUnitType = "watts" | "btu" | "current" | "ton";

// 通用设备基类
export interface DeviceBase {
  id: string; // 唯一标识符（uuid）
  name: string; // UI 名称
  type: DeviceType; // 主类型
}

// 各类具体设备
export interface EVDevice extends DeviceBase {
  type: "ev";
  kw: number;
  hasAutoManagement?: boolean; // EVEMS 控制
}

export interface HeaterDevice extends DeviceBase {
  type: "heater";
  kw: number;
  heaterType: HeaterType;
}

export interface ACDevice extends DeviceBase {
  type: "ac";
  unitType: ACUnitType;
  style: ACStyleType;
  value: number; // 数值，随 unitType 不同而不同
}

export interface RangeDevice extends DeviceBase {
  type: "range";
  kw: number;
}

export interface WaterHeaterDevice extends DeviceBase {
  type: "waterHeater";
  kw: number;
  subType?: string | undefined; // 细分类型，如 tank, tankless, heatPump
}

export interface ApplianceDevice extends DeviceBase {
  type: "appliance";
  kw: number;
}

export interface OtherDevice extends DeviceBase {
  type: "other";
  kw: number;
}

// 联合类型
export type Device =
  | EVDevice
  | HeaterDevice
  | ACDevice
  | RangeDevice
  | WaterHeaterDevice
  | ApplianceDevice
  | OtherDevice;
