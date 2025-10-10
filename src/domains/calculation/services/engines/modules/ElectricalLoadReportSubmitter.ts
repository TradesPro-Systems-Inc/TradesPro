import { ElectricalLoadReport } from "./ElectricalLoadReportBuilder";

export type SubmissionResult = {
  success: boolean;
  statusCode?: number;
  message: string;
  timestamp: string;
  versionTag?: string;
};

export async function submitElectricalLoadReport(
  report: ElectricalLoadReport,
  endpointUrl: string,
  authToken?: string
): Promise<SubmissionResult> {
  try {
    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify(report)
    });

    const result = await response.json();

    return {
      success: response.ok,
      statusCode: response.status,
      message: result.message ?? "Report submitted",
      timestamp: new Date().toISOString(),
      versionTag: `v${new Date().toISOString().slice(0, 10)}`
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message ?? "Submission failed",
      timestamp: new Date().toISOString()
    };
  }
}
