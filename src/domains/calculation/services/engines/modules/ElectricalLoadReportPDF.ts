import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ElectricalLoadReport } from "./ElectricalLoadReportBuilder";

export async function generateElectricalLoadReportPDF(
  report: ElectricalLoadReport
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size: 8.5 x 11 inches

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  function drawText(text: string, size = 12, offset = 0) {
    page.drawText(text, {
      x: margin,
      y: y - offset,
      size,
      font,
      color: rgb(0, 0, 0)
    });
    y -= offset + 4;
  }

  drawText("Electrical Load Calculation Report", 18, 0);
  drawText(
    `Generated At: ${new Date(report.generatedAt).toLocaleString()}`,
    12,
    20
  );
  drawText(`Project: ${report.project.name}`, 12, 16);
  drawText(`Location: ${report.project.location}`, 12, 14);
  if (report.project.designer)
    drawText(`Designer: ${report.project.designer}`, 12, 14);
  if (report.project.date)
    drawText(`Report Date: ${report.project.date}`, 12, 14);

  drawText(" ", 12, 20);
  drawText("Load Summary:", 14, 16);
  drawText(`• Total Power: ${report.load.totalPowerKW} kW`, 12, 14);
  drawText(`• Total Current: ${report.load.totalCurrentA} A`, 12, 14);
  drawText(`• Voltage: ${report.load.voltage} V`, 12, 14);
  if (report.load.powerFactor)
    drawText(`• Power Factor: ${report.load.powerFactor}`, 12, 14);

  drawText(" ", 12, 20);
  drawText("Circuit Details:", 14, 16);
  report.circuits.forEach(c => {
    drawText(`• [${c.id}] ${c.description}`, 12, 14);
    drawText(
      `   Load: ${c.loadKW} kW | Breaker: ${c.breakerSizeA} A | Wire: ${c.wireSizeAWG}`,
      12,
      14
    );
    if (c.voltageDropPercent !== undefined)
      drawText(`   Voltage Drop: ${c.voltageDropPercent}%`, 12, 14);
  });

  drawText(" ", 12, 20);
  drawText("Compliance & Safety:", 14, 16);
  if (report.compliance?.standard)
    drawText(`• Standard: ${report.compliance.standard}`, 12, 14);
  if (report.compliance?.notes)
    drawText(`• Notes: ${report.compliance.notes}`, 12, 14);
  if (report.compliance?.checkedBy)
    drawText(`• Checked By: ${report.compliance.checkedBy}`, 12, 14);

  drawText(" ", 12, 20);
  drawText("Consultant Sign-Off:", 14, 16);
  drawText(
    `• Name: ${report.signoff?.name ?? "________________________"}`,
    12,
    14
  );
  drawText(`• Date: ${report.signoff?.date ?? "________________"}`, 12, 14);
  drawText(`• Signature: ${report.signoff?.signature ?? "(on file)"}`, 12, 14);

  drawText(" ", 12, 20);
  page.drawText("Electrical Load Report — Letter Size", {
    x: margin,
    y: 20,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5)
  });

  return await pdfDoc.save();
}
