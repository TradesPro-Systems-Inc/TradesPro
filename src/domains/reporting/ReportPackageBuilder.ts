import JSZip from "jszip";
import { AuditLog } from "@/engines/modules/auditLogger";
import { generateReportHTML } from "@/engines/modules/reportGenerator";
import { generateSrEdNarrative } from "@/engines/modules/srEdNarrativeGenerator";

export async function buildReportPackage(audit: AuditLog): Promise<Blob> {
  const zip = new JSZip();

  // HTML Report
  const html = generateReportHTML(audit);
  zip.file("report.html", html);

  // SR&ED Narrative
  const narrative = generateSrEdNarrative(audit);
  zip.file("srEdNarrative.txt", narrative);

  // Audit JSON
  zip.file("auditLog.json", JSON.stringify(audit, null, 2));

  // Optional: metadata
  zip.file(
    "meta.txt",
    `Generated: ${new Date().toISOString()}\nDwelling Type: ${audit.dwellingType}`
  );

  return zip.generateAsync({ type: "blob" });
}
