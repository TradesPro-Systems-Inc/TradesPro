import { ElectricalLoadReportTemplate } from "@/engines/templates/ElectricalLoadReportTemplate";

export type ElectricalLoadReport = {
  generatedAt: string;
  project: {
    name: string;
    location: string;
    designer?: string;
    date?: string;
  };
  load: {
    totalPowerKW: number;
    totalCurrentA: number;
    voltage: number;
    powerFactor?: number;
  };
  circuits: {
    id: string;
    description: string;
    loadKW: number;
    breakerSizeA: number;
    wireSizeAWG: string;
    voltageDropPercent?: number;
  }[];
  compliance?: {
    standard?: string;
    notes?: string;
    checkedBy?: string;
  };
  signoff?: {
    name?: string;
    date?: string;
    signature?: string;
  };
};

export function buildElectricalLoadReport(
  data: Partial<ElectricalLoadReport>
): ElectricalLoadReport {
  const totalPowerKW =
    data.circuits?.reduce((sum, c) => sum + (c.loadKW || 0), 0) ?? 0;
  const totalCurrentA =
    data.circuits?.reduce((sum, c) => sum + (c.breakerSizeA || 0), 0) ?? 0;

  return {
    generatedAt: new Date().toISOString(),
    project: {
      name: data.project?.name ?? "Unnamed Project",
      location: data.project?.location ?? "Unknown Location",
      designer: data.project?.designer,
      date: data.project?.date
    },
    load: {
      totalPowerKW,
      totalCurrentA,
      voltage: data.load?.voltage ?? 120,
      powerFactor: data.load?.powerFactor
    },
    circuits: data.circuits ?? [],
    compliance: data.compliance,
    signoff: data.signoff
  };
}
