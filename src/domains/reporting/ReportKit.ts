import type { ReportTypeDefinition } from "../calculation/services/engines/ReportTypeRegistry";
import { getReportType } from "../calculation/services/engines/ReportTypeRegistry";
import { useProjectStore } from "@/stores/ProjectStore";
import { useCustomerStore } from "@/stores/CustomerStore";
import { useReportContextStore } from "@/stores/ReportContextStore";

export async function generateReportPDF(
  reportContextId: string
): Promise<Uint8Array> {
  const contextStore = useReportContextStore();
  const projectStore = useProjectStore();
  const customerStore = useCustomerStore();

  const context = contextStore.contexts.find(c => c.id === reportContextId);
  if (!context) throw new Error("Report context not found");

  const reportType = getReportType(context.reportTypeId);
  if (!reportType)
    throw new Error(`Report type '${context.reportTypeId}' not registered`);

  const project = projectStore.projects.find(p => p.id === context.projectId);
  if (!project) throw new Error("Project not found");

  const report = reportType.builder(project.id);
  return await reportType.pdfRenderer(report);
}

export async function submitReport(
  reportContextId: string,
  endpoint: string,
  token?: string
): Promise<any> {
  const contextStore = useReportContextStore();
  const projectStore = useProjectStore();

  const context = contextStore.contexts.find(c => c.id === reportContextId);
  if (!context) throw new Error("Report context not found");

  const reportType = getReportType(context.reportTypeId);
  if (!reportType?.submitter)
    throw new Error(
      `Report type '${context.reportTypeId}' does not support submission`
    );

  const project = projectStore.projects.find(p => p.id === context.projectId);
  if (!project) throw new Error("Project not found");

  const report = reportType.builder(project.id);
  return await reportType.submitter(report, endpoint, token);
}

export function listAvailableReportTypes(): ReportTypeDefinition[] {
  return listReportTypes();
}
