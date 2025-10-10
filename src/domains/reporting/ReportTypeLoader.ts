// ReportTypeLoader.ts
import definitions from "@/config/ReportTypeDefinition.json";
import { registerReportType } from "../calculation/services/engines/ReportTypeRegistry";

definitions.forEach(def => {
  registerReportType({
    id: def.id,
    label: def.label,
    icon: def.icon,
    templatePath: def.templatePath,
    builder: require(def.builderModule).default,
    pdfRenderer: require(def.pdfRendererModule).default,
    submitter: def.submitterModule
      ? require(def.submitterModule).default
      : undefined
  });
});
