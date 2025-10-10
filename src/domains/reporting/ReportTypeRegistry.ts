export type ReportTypeDefinition = {
  id: string; // e.g. 'electrical', 'cra', 'hvac', 'plumbing'
  label: string; // e.g. 'Electrical Load Report'
  icon?: string; // optional UI icon
  templatePath: string;
  builder: (projectId: string) => any;
  pdfRenderer: (report: any) => Promise<Uint8Array>;
  submitter?: (report: any, endpoint: string, token?: string) => Promise<any>;
};

const registry = new Map<string, ReportTypeDefinition>();

export function registerReportType(def: ReportTypeDefinition) {
  if (registry.has(def.id)) {
    console.warn(`Report type '${def.id}' is already registered.`);
    return;
  }
  registry.set(def.id, def);
}

export function getReportType(id: string): ReportTypeDefinition | undefined {
  return registry.get(id);
}

export function listReportTypes(): ReportTypeDefinition[] {
  return Array.from(registry.values());
}
