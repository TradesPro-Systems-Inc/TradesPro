// types/device.ts

// 设备类型运行时选项与类型
export const DEVICE_TYPE_OPTIONS = [
  { label: "Heater", value: "heater", color: "red", icon: "heating" },
  { label: "AC", value: "ac", color: "blue", icon: "ac_unit" },
  {
    label: "Water Heater",
    value: "waterHeater",
    color: "primary",
    icon: "bolt"
  },
  {
    label: "Range",
    value: "range",
    color: "secondary",
    icon: "local_fire_department"
  },
  { label: "EV Charger", value: "ev", color: "teal", icon: "ev_station" },

  {
    label: "Appliance >1500W",
    value: "appliance",
    color: "orange",
    icon: "device_hub"
  }

  // { label: "Other", value: "other", color: "grey", icon: "devices" }
] as const;
export type DeviceType = (typeof DEVICE_TYPE_OPTIONS)[number]["value"];

// 子类型映射（统一管理所有子类型）
export const SUB_TYPE_MAP = {
  waterHeater: [
    "electric tankless water heaters",
    "electric water heaters for steamers",
    "electric water heaters for swimming pools",
    "electric water heaters for hot tubs",
    "electric water heaters for spas"
  ] as const,

  heater: ["ETS", "duct", "furnace", "spaceHeating", "other"] as const,

  // AC-specific: 风格（style） 和 单位（unit）
  ac: {
    styles: ["window", "split", "central", "heatPump", "other"] as const,
    units: ["watts", "btu", "current", "ton"] as const
  }
} as const;

// 推导子类型字面量类型
export type WaterHeaterSubType = (typeof SUB_TYPE_MAP)["waterHeater"][number];
export type HeaterType = (typeof SUB_TYPE_MAP)["heater"][number];

// AC 风格与单位类型
export type ACStyleType = (typeof SUB_TYPE_MAP)["ac"]["styles"][number];
export type ACUnitType = (typeof SUB_TYPE_MAP)["ac"]["units"][number];

// 基础设备接口与具体设备接口示例
export interface DeviceBase {
  id: string;
  name: string;
  type: DeviceType;
  kw?: number; // 统一以 kW 为内部规范（可选）
}

export interface ACDevice extends DeviceBase {
  type: "ac";
  // 输入值用 value + unit（value 用户界面输入，unit 从 ACUnitType 中选）
  value: number;
  unit: ACUnitType;
  style?: ACStyleType;
  voltage?: number; // 当 unit === 'current' 时需要
}

export interface WaterHeaterDevice extends DeviceBase {
  type: "waterHeater";
  kw: number;
  subType?: WaterHeaterSubType;
}

export interface EVDevice extends DeviceBase {
  type: "ev";
  kw: number;
  hasAutoManagement?: boolean;
  maxAllowedByEVEMS?: number; // 当 hasAutoManagement 为 true 时需要
}

export interface HeaterDevice extends DeviceBase {
  type: "heater";
  kw: number;
  heaterType: HeaterType;
}

export interface RangeDevice extends DeviceBase {
  type: "range";
  kw: number;
}

export interface ApplianceDevice extends DeviceBase {
  type: "appliance";
  kw: number;
}

// export interface OtherDevice extends DeviceBase {
//   type: "other";
//   kw: number;
// }

// 联合类型
export type Device =
  | EVDevice
  | HeaterDevice
  | ACDevice
  | RangeDevice
  | WaterHeaterDevice
  | ApplianceDevice;
// | OtherDevice;
