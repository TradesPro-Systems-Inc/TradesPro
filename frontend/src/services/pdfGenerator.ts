import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface UnsignedBundle {
  id?: string;
  createdAt: string;
  inputs: any;
  results: any;
  steps: any[];
  warnings?: any[];
  engineMeta?: any;
  ruleSets?: Array<{ code?: string; ruleSetId?: string; jurisdiction?: string; source?: string }>;
  calculationType?: 'cec_load' | 'nec_load';
}

/**
 * Translation function type
 */
type TranslateFn = (key: string, params?: any) => string;

/**
 * Sanitize text for PDF rendering (fix garbled characters)
 * Converts special Unicode characters to PDF-safe equivalents
 * Preserves Latin-1 characters (French, Spanish, etc.)
 */
function sanitizeForPDF(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/×/g, ' x ')       // Multiplication sign → x
    .replace(/÷/g, ' / ')       // Division sign → /
    .replace(/√/g, 'sqrt')      // Square root → sqrt
    .replace(/≥/g, '>=')        // Greater than or equal → >=
    .replace(/≤/g, '<=')        // Less than or equal → <=
    .replace(/²/g, '2')         // Superscript 2 → 2
    .replace(/³/g, '3')         // Superscript 3 → 3
    .replace(/°/g, ' deg ')     // Degree symbol → deg
    .replace(/–/g, '-')         // En dash → hyphen
    .replace(/—/g, '-')         // Em dash → hyphen
    .replace(/"/g, '"')         // Smart quote left → straight quote
    .replace(/"/g, '"')         // Smart quote right → straight quote
    .replace(/'/g, "'")         // Smart apostrophe left → straight
    .replace(/'/g, "'")         // Smart apostrophe right → straight
    // Keep Latin-1 Supplement (U+0080 to U+00FF) for French/Spanish/German
    // Only replace characters outside Basic Latin + Latin-1 range
    .replace(/[^\x00-\xFF]/g, '');  // Remove chars outside Latin-1 (keeps É, é, è, ç, etc.)
}

/**
 * Generate CEC 8-200 Single Dwelling Load Calculation PDF Report
 * Professional engineering-style report with multi-language support
 * @param bundle Calculation result bundle
 * @param locale Current language
 * @param t Translation function from vue-i18n
 */
export async function generateLoadCalculationPDF(
  bundle: UnsignedBundle,
  locale: string = 'en-CA',
  t?: TranslateFn
): Promise<void> {
  console.log(`📄 Generating PDF report in ${locale}...`);
  
  // Detect code type (NEC or CEC) from bundle
  const codeType = bundle.ruleSets?.[0]?.code || 
                   (bundle.calculationType === 'nec_load' ? 'nec' : 'cec') ||
                   'cec'; // Default to CEC if cannot determine
  const isNEC = codeType === 'nec';
  
  console.log(`📄 Code type detected: ${codeType.toUpperCase()}`);
  
  // Fallback translation function if none provided
  const baseTranslate: TranslateFn = t || ((key: string) => key);
  
  // Code-specific text mappings
  const codeTexts = {
    cec: {
      codeName: 'Canadian Electrical Code (CEC)',
      codeSection: 'Section 8-200',
      codeReference: 'Canadian Electrical Code (CEC) Section 8-200',
      livingAreaRef: 'CEC 8-110',
      table2Ref: 'CEC Table 2',
      terminationRef: 'CEC 4-006',
      table5ARef: 'CEC Table 5A',
      hvacInterlockedRef: 'CEC 8-106 3)',
      methodATitle: 'METHOD A (DETAILED CALCULATION)',
      methodARef: 'CEC 8-200 1)a)',
      methodBTitle: 'METHOD B - Minimum Load',
      methodBRef: 'CEC 8-200 1)b)',
      rangeRef: 'CEC 8-200 1)a)iv)',
      waterHeaterRef: 'CEC Section 63',
      evseRef: 'CEC 8-106 11)',
      breakerRef: 'CEC 14-104',
      conductorRef: 'CEC Table 2 & 5A',
      disclaimer: 'This report is computer-generated based on CEC 2024. Verify all calculations and consult current code requirements.',
      fileNamePrefix: 'CEC_LoadCalc'
    },
    nec: {
      codeName: 'National Electrical Code (NEC)',
      codeSection: 'Article 220',
      codeReference: 'National Electrical Code (NEC) Article 220',
      livingAreaRef: 'NEC 220.12',
      table2Ref: 'NEC Table 310.15(B)(16)',
      terminationRef: 'NEC 110.14(C)',
      table5ARef: 'NEC Table 310.15(B)(1)',
      hvacInterlockedRef: 'NEC 220.60',
      methodATitle: 'CALCULATED LOAD',
      methodARef: 'NEC 220.40',
      methodBTitle: 'METHOD B - Minimum Load',
      methodBRef: 'N/A', // NEC doesn't have Method B
      rangeRef: 'NEC 220.55',
      waterHeaterRef: 'NEC 220.53',
      evseRef: 'NEC 220.82',
      breakerRef: 'NEC 240.6',
      conductorRef: 'NEC Table 310.15(B)(16)',
      disclaimer: 'This report is computer-generated based on NEC 2023. Verify all calculations and consult current code requirements.',
      fileNamePrefix: 'NEC_LoadCalc'
    }
  };
  
  const code = codeTexts[isNEC ? 'nec' : 'cec'];
  
  // English fallback translations for when Chinese/other languages are removed
  const englishFallbacks: Record<string, string> = {
    'pdf.title': 'ELECTRICAL LOAD CALCULATION REPORT',
    'pdf.subtitle': 'Single Dwelling Unit',
    'pdf.codeReference': code.codeReference,
    'pdf.projectInfo': 'PROJECT INFORMATION',
    'pdf.projectName': 'Project Name',
    'pdf.calculationId': 'Calculation ID',
    'pdf.datePrepared': 'Date Prepared',
    'pdf.inputParameters': 'INPUT PARAMETERS',
    'pdf.livingArea': 'Living Area',
    'pdf.systemVoltage': 'System Voltage',
    'pdf.systemConfig': 'System Configuration',
    'pdf.singlePhase': 'Single-Phase',
    'pdf.threePhase': 'Three-Phase',
    'pdf.conductorMaterial': 'Conductor Material',
    'pdf.terminationTemp': 'Termination Temperature',
    'pdf.ambientTemp': 'Ambient Temperature',
    'pdf.loadSummary': 'LOAD CALCULATION SUMMARY',
    'pdf.finalLoad': 'FINAL LOAD',
    'pdf.serviceCurrent': 'Service Current',
    'pdf.selectedConductor': 'Selected Conductor',
    'pdf.deratedAmpacity': 'Derated Ampacity',
    'pdf.breakerSize': 'Breaker Size',
    'pdf.detailedCalc': 'DETAILED CALCULATION STEPS',
    'pdf.methodA': 'METHOD A (DETAILED CALCULATION)',
    'pdf.basicLoad': 'Basic Load',
    'pdf.hvacLoad': 'HVAC Load',
    'pdf.heatingCooling': 'Heating & Cooling',
    'pdf.electricRange': 'Electric Range',
    'pdf.waterHeater': 'Water Heater',
    'pdf.evseLoad': 'EVSE Load',
    'pdf.otherLargeLoads': 'Other Large Loads',
    'pdf.methodB': 'METHOD B - Minimum Load',
    'pdf.finalServiceLoad': 'FINAL SERVICE LOAD (Greater of Method A or B)',
    'pdf.auditTrail': 'CALCULATION AUDIT TRAIL',
    'pdf.warnings': 'WARNINGS',
    'calculator.electricRange': 'Electric Range'
  };
  
  // Wrapper to sanitize all translated text with English fallback
  const translate = (key: string, params?: any): string => {
    const translated = baseTranslate(key, params);
    const sanitized = sanitizeForPDF(translated);
    
    // If sanitized result is empty or very short (likely Chinese was removed),
    // use English fallback
    if (!sanitized || sanitized.trim().length < 2) {
      return englishFallbacks[key] || key;
    }
    
    return sanitized;
  };
  
  try {
    const doc = new jsPDF();
    
    // Override jsPDF text method to auto-sanitize all text
    const originalText = (doc as any).text.bind(doc);
    (doc as any).text = function(...args: any[]) {
      // Sanitize the first argument (text content)
      if (typeof args[0] === 'string') {
        args[0] = sanitizeForPDF(args[0]);
      } else if (Array.isArray(args[0])) {
        args[0] = args[0].map((line: any) => 
          typeof line === 'string' ? sanitizeForPDF(line) : line
        );
      }
      return originalText(...args);
    };
    let yPos = 20;
    const leftMargin = 20;
    const rightMargin = 190;
    const pageWidth = 210; // A4 width in mm
    
    // ============================================================
    // PAGE 1: COVER PAGE & SUMMARY
    // ============================================================
    
    // Main Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(translate('pdf.title'), pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(translate('pdf.subtitle'), pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    
    doc.setFontSize(11);
    doc.text(translate('pdf.codeReference'), pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    // Horizontal line
    doc.setLineWidth(0.5);
    doc.line(leftMargin, yPos, rightMargin, yPos);
    yPos += 10;
    
    // Project Information Box
    doc.setFillColor(240, 240, 240);
    doc.rect(leftMargin, yPos, rightMargin - leftMargin, 35, 'F');
    yPos += 8;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(translate('pdf.projectInfo'), leftMargin + 5, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${translate('pdf.projectName')}: ${bundle.inputs?.project || 'Untitled Project'}`, leftMargin + 5, yPos);
    yPos += 6;
    doc.text(`${translate('pdf.calculationId')}: ${bundle.id || 'N/A'}`, leftMargin + 5, yPos);
    yPos += 6;
    doc.text(`${translate('pdf.datePrepared')}: ${new Date(bundle.createdAt).toLocaleDateString(locale, { 
      year: 'numeric', month: 'long', day: 'numeric' 
    })}`, leftMargin + 5, yPos);
    yPos += 15;
    
    // Input Parameters Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(translate('pdf.inputParameters'), leftMargin, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const inputs = [
      { label: translate('pdf.livingArea'), value: `${bundle.inputs?.livingArea_m2 || 0} m²`, ref: code.livingAreaRef },
      { label: translate('pdf.systemVoltage'), value: `${bundle.inputs?.systemVoltage || 240} V`, ref: '' },
      { label: translate('pdf.systemConfig'), value: bundle.inputs?.phase === 3 ? translate('pdf.threePhase') : translate('pdf.singlePhase'), ref: '' },
      { label: translate('pdf.conductorMaterial'), value: bundle.inputs?.conductorMaterial || 'Cu', ref: code.table2Ref },
      { label: translate('pdf.terminationTemp'), value: `${bundle.inputs?.terminationTempC || 75} deg C`, ref: code.terminationRef },
      { label: translate('pdf.ambientTemp'), value: `${bundle.inputs?.ambientTempC || 30} deg C`, ref: code.table5ARef }
    ];
    
    inputs.forEach(item => {
      doc.text(`${item.label}:`, leftMargin + 5, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(item.value, 80, yPos);
      if (item.ref) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.text(`(${item.ref})`, 120, yPos);
        doc.setFontSize(10);
      }
      doc.setFont('helvetica', 'normal');
      yPos += 6;
    });
    
    yPos += 5;
    
    // HVAC Information
    if (bundle.inputs?.heatingLoadW || bundle.inputs?.coolingLoadW) {
      doc.setFont('helvetica', 'bold');
      doc.text('HVAC Equipment:', leftMargin + 5, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      
      if (bundle.inputs.heatingLoadW) {
        doc.text(`Heating: ${bundle.inputs.heatingLoadW} W`, leftMargin + 10, yPos);
        yPos += 5;
      }
      if (bundle.inputs.coolingLoadW) {
        doc.text(`Cooling: ${bundle.inputs.coolingLoadW} W`, leftMargin + 10, yPos);
        yPos += 5;
      }
      if (bundle.inputs.isHeatingAcInterlocked) {
        doc.setFont('helvetica', 'italic');
        doc.text(`(Heating and cooling are interlocked - ${code.hvacInterlockedRef})`, leftMargin + 10, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 5;
      }
      yPos += 3;
    }
    
    // Other Equipment
    const equipment = [];
    if (bundle.inputs?.hasElectricRange && bundle.inputs?.electricRangeRatingKW) {
      equipment.push(`Electric Range: ${bundle.inputs.electricRangeRatingKW} kW`);
    }
    if (bundle.inputs?.waterHeaterType && bundle.inputs?.waterHeaterType !== 'none') {
      equipment.push(`Water Heater (${bundle.inputs.waterHeaterType}): ${bundle.inputs.waterHeaterRatingW} W`);
    }
    if (bundle.inputs?.hasEVSE && bundle.inputs?.evseRatingW) {
      equipment.push(`EVSE (Electric Vehicle Charger): ${bundle.inputs.evseRatingW} W`);
    }
    
    if (equipment.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Major Equipment:', leftMargin + 5, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      equipment.forEach(item => {
        doc.text(`- ${item}`, leftMargin + 10, yPos);
        yPos += 5;
      });
      yPos += 3;
    }
    
    // ============================================================
    // CALCULATION RESULTS SUMMARY
    // ============================================================
    
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }
    
    yPos += 5;
    doc.setLineWidth(0.5);
    doc.line(leftMargin, yPos, rightMargin, yPos);
    yPos += 10;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(translate('pdf.loadSummary'), leftMargin, yPos);
    yPos += 10;
    
    // Highlight box for final load
    doc.setFillColor(255, 250, 205);
    doc.setDrawColor(200, 150, 0);
    doc.setLineWidth(1);
    doc.rect(leftMargin, yPos - 3, rightMargin - leftMargin, 14, 'FD');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${translate('pdf.finalLoad').toUpperCase()}:`, leftMargin + 5, yPos + 5);
    doc.setFontSize(16);
    const finalLoad = bundle.results?.chosenCalculatedLoad_W || bundle.results?.demandVA || 'N/A';
    doc.text(`${finalLoad} W`, rightMargin - 5, yPos + 5, { align: 'right' });
    yPos += 20;
    
    // Results table
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Helper: standard breaker selection per common service sizes
    const standardBreakers = [60, 100, 125, 150, 200];
    const pickStandardBreaker = (requiredAmps: number): number => {
      for (const size of standardBreakers) {
        if (size >= requiredAmps) return size;
      }
      return standardBreakers[standardBreakers.length - 1];
    };

    const results = [
      { 
        label: translate('pdf.serviceCurrent'), 
        value: `${bundle.results?.serviceCurrentA || 'N/A'} A`,
        formula: `I = P / V = ${finalLoad} / ${bundle.inputs?.systemVoltage || 240}`
      },
      { 
        label: translate('pdf.selectedConductor'), 
        value: `${bundle.results?.conductorSize || 'N/A'}`,
        formula: (() => {
          const serviceCurrent = parseFloat(bundle.results?.serviceCurrentA || 0);
          const tempFactor = parseFloat(bundle.results?.tempCorrectionFactor || 1);
          const requiredBase = serviceCurrent / tempFactor;
          const baseAmpacity = bundle.results?.baseAmpacity || 0;
          return `${serviceCurrent.toFixed(2)}A / ${tempFactor.toFixed(3)} = ${requiredBase.toFixed(2)}A (required) - Selected: ${bundle.results?.conductorSize} (${baseAmpacity}A base)`;
        })()
      },
      { 
        label: translate('pdf.deratedAmpacity'), 
        value: `${bundle.results?.conductorAmpacity || 'N/A'} A`,
        formula: (() => {
          const baseAmpacity = bundle.results?.baseAmpacity || 0;
          const tempFactor = parseFloat(bundle.results?.tempCorrectionFactor || 1);
          const derated = baseAmpacity * tempFactor;
          const serviceCurrent = parseFloat(bundle.results?.serviceCurrentA || 0);
          return `${baseAmpacity}A x ${tempFactor.toFixed(3)} = ${derated.toFixed(2)}A >= ${serviceCurrent.toFixed(2)}A (OK)`;
        })()
      },
      { 
        label: translate('pdf.breakerSize'), 
        value: (() => {
          const req = typeof bundle.results?.serviceCurrentA === 'number' ? bundle.results?.serviceCurrentA : 0;
          const computed = pickStandardBreaker(req);
          const existing = (typeof bundle.results?.breakerSizeA === 'number' && bundle.results?.breakerSizeA > 0)
            ? bundle.results?.breakerSizeA
            : (typeof bundle.results?.panelRatingA === 'number' && bundle.results?.panelRatingA > 0)
              ? bundle.results?.panelRatingA
              : undefined;
          const finalVal = existing || computed;
          return `${finalVal} A`;
        })(),
        formula: code.breakerRef
      }
    ];
    
    results.forEach(item => {
      doc.setFont('helvetica', 'normal');
      doc.text(`${item.label}:`, leftMargin + 5, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(item.value, 80, yPos);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      const formulaLines = doc.splitTextToSize(item.formula, 80);
      doc.text(formulaLines, leftMargin + 5, yPos + 4);
      doc.setFontSize(10);
      yPos += formulaLines.length * 4 + 8;
    });
    
    // ============================================================
    // PAGE 2: DETAILED LOAD BREAKDOWN
    // ============================================================
    
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(translate('pdf.detailedCalculation'), leftMargin, yPos);
    yPos += 8;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.text(translate('pdf.codeReference'), leftMargin, yPos);
    yPos += 12;
    
    // Method A: Detailed Calculation (or just "Calculated Load" for NEC)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const methodATitle = isNEC ? code.methodATitle : translate('pdf.methodA').toUpperCase();
    doc.text(`${methodATitle} (${code.methodARef})`, leftMargin, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Build load breakdown table
    const loadBreakdown = [];
    
    // Basic Load (CEC) or General Lighting (NEC)
    const livingArea = bundle.inputs?.livingArea_m2 || 0;
    if (isNEC) {
      // NEC: General Lighting (3 VA/ft²)
      const livingArea_ft2 = livingArea * 10.764;
      const generalLightingVA = livingArea_ft2 * 3;
      loadBreakdown.push({
        item: '1) General Lighting Load',
        description: `${translate('pdf.livingArea')}: ${livingArea.toFixed(2)} m² (${livingArea_ft2.toFixed(2)} ft²)`,
        formula: `3 VA/ft² × ${livingArea_ft2.toFixed(2)} ft² = ${generalLightingVA.toFixed(2)} VA (NEC 220.12)`,
        load: bundle.results?.basicVA || generalLightingVA.toFixed(2)
      });
      // NEC: Small Appliance Circuits (4500 VA)
      loadBreakdown.push({
        item: '2) Small Appliance & Laundry Circuits',
        description: 'Kitchen + Laundry',
        formula: '2×1500 VA (kitchen) + 1500 VA (laundry) = 4500 VA (NEC 220.52)',
        load: '4500'
      });
    } else {
      // CEC: Basic Load
      const portions = livingArea > 90 ? Math.ceil((livingArea - 90) / 90) : 0;
      const basicLoadValue = portions > 0 ? 5000 + portions * 1000 : 5000;
      const basicLoadFormula = livingArea <= 90 
        ? '5000 W (for first 90 m2)'
        : `5000 + ${portions} x 1000 = ${basicLoadValue} W`;
      
      loadBreakdown.push({
        item: `i) & ii) ${translate('pdf.basicLoad')}`,
        description: `${translate('pdf.livingArea')}: ${livingArea} m2`,
        formula: basicLoadFormula,
        load: bundle.results?.basicVA || basicLoadValue.toString()
      });
    }
    
    // iii) HVAC
    if (bundle.results?.hvacLoad && parseFloat(bundle.results.hvacLoad) > 0) {
      const heating = bundle.inputs?.heatingLoadW || 0;
      const cooling = bundle.inputs?.coolingLoadW || 0;
      let hvacFormula = '';
      
      if (heating <= 10000) {
        hvacFormula = `Heating: ${heating} W (<=10kW, 100%)`;
      } else {
        const heatingDemand = 10000 + (heating - 10000) * 0.75;
        hvacFormula = `Heating: 10000 + (${heating}-10000)x0.75 = ${heatingDemand.toFixed(0)} W`;
      }
      
      if (bundle.inputs?.isHeatingAcInterlocked) {
        hvacFormula += `\nCooling: ${cooling} W (interlocked, use greater)`;
      } else if (cooling > 0) {
        hvacFormula += `\nCooling: ${cooling} W (100%)`;
      }
      
      loadBreakdown.push({
        item: `iii) ${translate('pdf.hvacLoad')}`,
        description: `${translate('pdf.heating')} & ${translate('pdf.cooling')}`,
        formula: hvacFormula,
        load: bundle.results.hvacLoad
      });
    }
    
    // Electric Range (different numbering for NEC vs CEC)
    if (bundle.results?.rangeLoad && parseFloat(bundle.results.rangeLoad) > 0) {
      const rangeKW = bundle.inputs?.electricRangeRatingKW || 0;
      const rangeW = rangeKW * 1000;
      let rangeFormula = '';
      
      if (isNEC) {
        // NEC uses Table 220.55
        rangeFormula = `Electric range: ${rangeKW} kW. Using Table 220.55 = ${bundle.results.rangeLoad} VA (NEC 220.55)`;
        loadBreakdown.push({
          item: '3) Electric Range Load',
          description: `${translate('calculator.electricRange')}: ${rangeKW} kW`,
          formula: rangeFormula,
          load: bundle.results.rangeLoad
        });
      } else {
        // CEC formula
        if (rangeW <= 12000) {
          rangeFormula = `${rangeKW} kW <= 12 kW -> 6000 W`;
        } else {
          rangeFormula = `6000 + (${rangeW}-12000)x0.4 = ${bundle.results.rangeLoad} W`;
        }
        loadBreakdown.push({
          item: `iv) ${translate('pdf.rangeLoad')}`,
          description: `${translate('calculator.electricRange')}: ${rangeKW} kW`,
          formula: rangeFormula,
          load: bundle.results.rangeLoad
        });
      }
    }
    
    // v) Water Heater
    if (bundle.results?.waterHeaterLoad && parseFloat(bundle.results.waterHeaterLoad) > 0) {
      const whType = bundle.inputs?.waterHeaterType || 'storage';
      const whRating = bundle.inputs?.waterHeaterRatingW || 0;
      let whFormula = '';
      
      if (isNEC) {
        whFormula = `${whRating} W @ 100% = ${bundle.results.waterHeaterLoad} W (NEC 220.53)`;
      } else {
        if (whType === 'tankless' || whType === 'pool_spa') {
          whFormula = `${whRating} W x 100% = ${bundle.results.waterHeaterLoad} W`;
        } else {
          whFormula = `${whRating} W x 75% = ${bundle.results.waterHeaterLoad} W (${code.waterHeaterRef})`;
        }
      }
      
      loadBreakdown.push({
        item: `v) ${translate('pdf.waterHeaterLoad')}`,
        description: `${translate('pdf.type')}: ${whType}`,
        formula: whFormula,
        load: bundle.results.waterHeaterLoad
      });
    }
    
    // vi) EVSE
    if (bundle.results?.evseLoad && parseFloat(bundle.results.evseLoad) > 0) {
      loadBreakdown.push({
        item: `vi) ${translate('pdf.evseLoad')}`,
        description: translate('calculator.evse'),
        formula: `${bundle.inputs?.evseRatingW} W x 100%`,
        load: bundle.results.evseLoad
      });
    }
    
    // vii) Other Large Loads
    if (bundle.results?.otherLargeLoadsTotal && parseFloat(bundle.results.otherLargeLoadsTotal) > 0) {
      loadBreakdown.push({
        item: `vii) ${translate('pdf.otherLargeLoads')}`,
        description: `${translate('pdf.appliances')} > 1500 W`,
        formula: translate('pdf.demandFactor'),
        load: bundle.results.otherLargeLoadsTotal
      });
    }
    
    // Print load breakdown
    loadBreakdown.forEach((item, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Item number and description
      doc.setFont('helvetica', 'bold');
      doc.text(item.item, leftMargin + 5, yPos);
      yPos += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(item.description, leftMargin + 10, yPos);
      yPos += 5;
      
      // Formula
      doc.setFont('courier', 'normal');
      const formulaLines = doc.splitTextToSize(item.formula, 120);
      formulaLines.forEach((line: string) => {
        doc.text(line, leftMargin + 10, yPos);
        yPos += 4;
      });
      
      // Load value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${item.load} W`, rightMargin - 5, yPos - 4, { align: 'right' });
      
      yPos += 4;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(leftMargin + 5, yPos, rightMargin - 5, yPos);
      yPos += 6;
      
      doc.setFontSize(10);
    });
    
    // Total Method A (or just "Total Load" for NEC)
    yPos += 2;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(leftMargin + 5, yPos, rightMargin - 5, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const totalLabel = isNEC ? 'TOTAL CALCULATED LOAD:' : 'TOTAL METHOD A:';
    doc.text(totalLabel, leftMargin + 5, yPos);
    doc.text(`${bundle.results?.itemA_total_W || 'N/A'} ${isNEC ? 'VA' : 'W'}`, rightMargin - 5, yPos, { align: 'right' });
    yPos += 10;
    
    // Method B: Minimum Load (CEC only - NEC doesn't have Method B)
    if (!isNEC && parseFloat(bundle.results?.itemB_value_W || '0') > 0) {
      doc.setFontSize(12);
      doc.text(`METHOD B - Minimum Load (${code.methodBRef})`, leftMargin, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const minimumFormula = livingArea >= 80 
        ? `${livingArea} m² >= 80 m² -> 24000 W (100 A @ 240 V)`
        : `${livingArea} m² < 80 m² -> 14400 W (60 A @ 240 V)`;
      
      doc.text('Formula:', leftMargin + 5, yPos);
      yPos += 5;
      doc.setFont('courier', 'normal');
      doc.text(minimumFormula, leftMargin + 10, yPos);
      yPos += 6;
      
      doc.setFont('helvetica', 'bold');
      doc.text('MINIMUM LOAD (METHOD B):', leftMargin + 5, yPos);
      const methodBValue = bundle.results?.itemB_value_W || bundle.results?.minimumLoadB || 'N/A';
      doc.text(`${methodBValue} W`, rightMargin - 5, yPos, { align: 'right' });
      yPos += 12;
      
      // Final Selection (CEC: Greater of A or B)
      doc.setFillColor(230, 255, 230);
      doc.rect(leftMargin, yPos - 3, rightMargin - leftMargin, 12, 'F');
      
      doc.setFontSize(12);
      doc.text('FINAL SERVICE LOAD (Greater of Method A or B):', leftMargin + 5, yPos + 4);
      doc.setFontSize(14);
      doc.text(`${finalLoad} W`, rightMargin - 5, yPos + 4, { align: 'right' });
      yPos += 18;
    } else {
      // NEC: No Method B, so final load is just the calculated load
      doc.setFillColor(230, 255, 230);
      doc.rect(leftMargin, yPos - 3, rightMargin - leftMargin, 12, 'F');
      
      doc.setFontSize(12);
      doc.text('FINAL SERVICE LOAD:', leftMargin + 5, yPos + 4);
      doc.setFontSize(14);
      doc.text(`${finalLoad} ${isNEC ? 'VA' : 'W'}`, rightMargin - 5, yPos + 4, { align: 'right' });
      yPos += 18;
    }
    
    // Warnings
    if (bundle.warnings && bundle.warnings.length > 0) {
      doc.setFillColor(255, 245, 230);
      doc.rect(leftMargin, yPos, rightMargin - leftMargin, 8 + bundle.warnings.length * 6, 'F');
      yPos += 6;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(200, 100, 0);
      doc.text('NOTES:', leftMargin + 5, yPos);
      yPos += 6;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      bundle.warnings.forEach((warning: any) => {
        let warningText = '';
        if (typeof warning === 'string') {
          warningText = warning;
        } else if (warning.type === 'minimumLoadApplied') {
          warningText = isNEC 
            ? `Calculated load: ${warning.calculated} W`
            : `Method A calculated ${warning.calculated} W, but ${code.methodBRef} minimum of ${warning.minimum} W applies.`;
        } else {
          warningText = JSON.stringify(warning);
        }
        
        const lines = doc.splitTextToSize(`- ${warningText}`, 165);
        lines.forEach((line: string) => {
          doc.text(line, leftMargin + 10, yPos);
          yPos += 5;
        });
      });
    }
    
    // ============================================================
    // PAGE 3+: CALCULATION STEPS (OPTIONAL DETAILED AUDIT TRAIL)
    // ============================================================
    
    if (bundle.steps && bundle.steps.length > 0) {
      doc.addPage();
      yPos = 20;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('CALCULATION AUDIT TRAIL', leftMargin, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('(Detailed step-by-step calculation for verification purposes)', leftMargin, yPos);
      yPos += 10;
      
      // Helper to build output text with fallbacks from bundle.results
      const buildOutputText = (step: any): string => {
        const base = formatAuditOutput(step.output, step.operationId, code, isNEC);
        if (step.operationId === 'select_conductor') {
          const size = bundle.results?.conductorSize || 'N/A';
          const amp = bundle.results?.conductorAmpacity ?? bundle.results?.correctedAmpacity;
          const amb = bundle.inputs?.ambientTempC ?? bundle.inputs?.ambientTemp;
          if (typeof amp === 'number' && amp > 0) {
            return `Selected: ${size}\nCorrected ampacity: ${amp} A${amb !== undefined ? ` (@ ${amb} deg C ambient)` : ''}`;
          }
          return `Selected: ${size}`;
        }
        if (step.operationId === 'select_breaker') {
          const standardBreakers = [60, 100, 125, 150, 200];
          const pick = (required: number) => {
            for (const s of standardBreakers) if (s >= required) return s;
            return standardBreakers[standardBreakers.length - 1];
          };
          const required = typeof bundle.results?.serviceCurrentA === 'number' ? bundle.results?.serviceCurrentA : 0;
          const fromResults =
            (typeof bundle.results?.breakerSizeA === 'number' && bundle.results?.breakerSizeA > 0)
              ? bundle.results?.breakerSizeA
              : (typeof bundle.results?.panelRatingA === 'number' && bundle.results?.panelRatingA > 0)
                ? bundle.results?.panelRatingA
                : undefined;
          const finalBreaker = fromResults ?? pick(required);
          return `Overcurrent protection: ${finalBreaker} A breaker\n(Standard size per ${code.breakerRef})`;
        }
        return base;
      };

      bundle.steps.forEach((step: any, index: number) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`STEP ${step.stepIndex || index + 1}:`, leftMargin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(translateOperationId(step.operationId, code), leftMargin + 20, yPos);
        yPos += 6;
        
        doc.setFontSize(8);
        if (step.formulaRef) {
          doc.setFont('helvetica', 'italic');
          doc.text(`Code Reference: ${step.formulaRef}`, leftMargin + 5, yPos);
          yPos += 5;
        }
        
        if (step.note) {
          doc.setFont('courier', 'normal');
          // Sanitize note using the same sanitizer to preserve ASCII-safe conversions
          const noteText = sanitizeForPDF(step.note);
          const noteLines = doc.splitTextToSize(noteText, 165);
          noteLines.forEach((line: string) => {
            if (yPos > 285) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(line, leftMargin + 5, yPos);
            yPos += 4;
          });
        }
        
        if (step.output) {
          doc.setFont('helvetica', 'normal');
          
          // Format output in a human-readable way with fallbacks
          const outputText = buildOutputText(step);
          const outputLines = doc.splitTextToSize(outputText, 165);
          
          outputLines.forEach((line: string) => {
            if (yPos > 285) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(line, leftMargin + 5, yPos);
            yPos += 4;
          });
        }
        
        // Show intermediate values if available
        if (step.intermediateValues) {
          doc.setFontSize(7);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(100, 100, 100);
          const intermediateText = formatIntermediateValues(step.intermediateValues);
          if (intermediateText) {
            const intLines = doc.splitTextToSize(`Details: ${intermediateText}`, 165);
            intLines.forEach((line: string) => {
              if (yPos > 285) {
                doc.addPage();
                yPos = 20;
              }
              doc.text(line, leftMargin + 10, yPos);
              yPos += 3.5;
            });
          }
          doc.setFontSize(8);
          doc.setTextColor(0, 0, 0);
        }
        
        yPos += 3;
      });
    }
    
    // ============================================================
    // FOOTER ON ALL PAGES
    // ============================================================
    
    const totalPages = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(leftMargin, 285, rightMargin, 285);
      
      // Footer text
      doc.text(
        `Generated: ${new Date().toLocaleString('en-CA')}`,
        leftMargin,
        290
      );
      doc.text(
        `Page ${i} of ${totalPages}`,
        rightMargin,
        290,
        { align: 'right' }
      );
      
      // Disclaimer
      if (i === totalPages) {
        doc.setFontSize(7);
        doc.text(
          code.disclaimer,
          pageWidth / 2,
          293,
          { align: 'center' }
        );
      }
    }
    
    // ============================================================
    // SAVE PDF
    // ============================================================
    
    const projectName = (bundle.inputs?.project || 'Report').replace(/[^\x00-\x7F]/g, '_'); // ASCII only
    const fileName = `${code.fileNamePrefix}_${projectName}_${new Date().toISOString().split('T')[0]}.pdf`;
    console.log('💾 Saving PDF:', fileName);
    doc.save(fileName);
    console.log('✅ Professional PDF report generated successfully');
  
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw error;
  }
}

/**
 * Translate operation ID to human-readable name (English only for PDF)
 */
function translateOperationId(operationId: string, code: any): string {
  const translations: Record<string, string> = {
    'calculate_basic_load_method_a': 'Basic Load Calculation (Method A)',
    'calculate_hvac_load': 'HVAC Load Calculation',
    'calculate_range_load': 'Electric Range Load Calculation',
    'calculate_water_heater_load': 'Water Heater Load Calculation',
    'calculate_evse_load': 'EVSE Load Calculation',
    'calculate_other_large_loads': 'Other Large Loads Calculation',
    'total_method_a': 'Total Method A Calculation',
    'minimum_load_method_b': 'Minimum Load Calculation (Method B)',
    'choose_greater_load': 'Final Load Selection (Greater of A or B)',
    'calculate_service_current': 'Service Current Calculation',
      'select_conductor': `Conductor Selection (${code.conductorRef})`,
      'select_breaker': `Overcurrent Protection Sizing (${code.breakerRef})`,
      'nec_general_lighting': 'General Lighting Load (NEC 220.12)',
      'nec_small_appliance': 'Small Appliance and Laundry Circuits (NEC 220.52)',
      'nec_combine_lighting': 'Combine Lighting and Small Appliance Loads',
      'nec_lighting_demand': 'Apply Lighting Demand Factors (NEC 220.42)',
      'nec_range_load': 'Electric Range Load (NEC 220.55)',
      'nec_dryer_load': 'Electric Dryer Load (NEC 220.54)',
      'nec_hvac_load': 'Heating and Air Conditioning Load (NEC 220.60)',
      'nec_fixed_appliances': 'Fixed Appliances Load (NEC 220.53)',
      'nec_total_load': 'Total Calculated Load (NEC 220.40)',
      'nec_service_current': 'Service Current Calculation (NEC 220.60)',
      'nec_optional_general': 'General Load (Optional Method - NEC 220.82(B))',
      'nec_optional_demand': 'Apply Optional Method Demand Factors (NEC 220.82(B))',
      'nec_optional_hvac': 'Heating and Air Conditioning Load (NEC 220.82(C))',
      'nec_optional_total': 'Total Load (Optional Method - NEC 220.82)'
  };

  return translations[operationId] || operationId.replace(/_/g, ' ').toUpperCase();
}

/**
 * Format audit trail output in natural language
 */
function formatAuditOutput(output: any, operationId: string, code: any, isNEC: boolean): string {
  if (!output || typeof output !== 'object') {
    return String(output || 'N/A');
  }

  // Handle different operation types with natural language descriptions
  switch (operationId) {
    case 'calculate_basic_load_method_a':
      const area = parseFloat(output.basicLoad || 0) > 0 ? output.area : (output.area || 0);
      const basicLoad = output.basicLoad || output.value || 0;
      return `Living area: ${area} m²\nBasic load calculated: ${basicLoad} W`;
    
    case 'calculate_hvac_load':
      const hvacLoad = output.hvacLoad || output.value || 0;
      if (output.interlocked) {
        return `HVAC load: ${hvacLoad} W\n(Heating and cooling interlocked, using greater value)`;
      }
      return `HVAC load: ${hvacLoad} W\n(Heating: ${output.heating || 0} W + Cooling: ${output.cooling || 0} W)`;
    
    case 'calculate_range_load':
      const rangeLoad = output.rangeLoad || output.value || 0;
      const ratingKW = output.rating_kW || 0;
      const rangeCodeRef = isNEC ? 'NEC 220.55' : code.rangeRef;
      return `Electric range: ${ratingKW} kW rated\nDemand load: ${rangeLoad} ${isNEC ? 'VA' : 'W'} (per ${rangeCodeRef})`;
    
    case 'calculate_water_heater_load':
      const whLoad = output.waterHeaterLoad || output.value || 0;
      const whType = output.type || 'N/A';
      const whRating = output.rating_W || 0;
      const whCodeRef = isNEC ? 'NEC 220.53' : code.waterHeaterRef;
      return `Water heater: ${whType} type, ${whRating} W rated\nDemand load: ${whLoad} W @ 100% (${whCodeRef})`;
    
    case 'calculate_evse_load':
      if (output.exempted || output.hasEVEMS) {
        const evseCodeRef = isNEC ? 'NEC 220.82' : code.evseRef;
        return `EVSE: Exempted by Energy Management System\nDemand load: 0 W (per ${evseCodeRef})`;
      }
      const evseLoad = output.evseLoad || output.value || 0;
      return `EVSE: ${evseLoad} W @ 100% demand factor`;
    
    case 'calculate_other_large_loads':
      const otherLoad = output.otherLargeLoadsTotal || output.value || 0;
      const continuousExtra = output.continuousLoadExtra || 0;
      const combined = output.combinedTotal || otherLoad;
      if (continuousExtra > 0) {
        return `Other large loads: ${otherLoad} W\nContinuous load extra (+25%): ${continuousExtra} W\nTotal: ${combined} W`;
      }
      return `Other large loads (>1500W): ${otherLoad} W`;
    
    case 'total_method_a':
      const totalA = output.itemA_total_W || output.totalLoadA || output.totalMethodA || output.value || 0;
      return `Total Method A: ${totalA} W`;
    
    case 'minimum_load_method_b':
      // Use itemB_value_W from calculation engine results
      const minLoad = output.itemB_value_W || output.minimumLoadB || output.value || 0;
      const minArea = output.area || output.livingArea_m2 || 0;
      return `Living area: ${minArea} m²\nMinimum load (Method B): ${minLoad} W`;
    
    case 'choose_greater_load':
      const chosenLoad = output.chosenCalculatedLoad_W || output.chosenLoad || output.value || 0;
      const methodALoad = output.itemA_total_W || output.methodA || 0;
      const methodBLoad = output.itemB_value_W || output.methodB || 0;
      return `Method A: ${methodALoad} W\nMethod B: ${methodBLoad} W\nFinal service load: ${chosenLoad} W (using greater value)`;
    
    case 'calculate_service_current':
      const current = output.serviceCurrent || output.value || 0;
      const voltage = output.voltage || 240;
      return `Service current: ${current} A @ ${voltage} V`;
    
    case 'select_conductor':
      const condSize = output.conductorSize || 'N/A';
      const condMat = output.material || 'Cu';
      const condAmp = output.ampacity || 0;
      const condTemp = output.ambientTemp || 30;
      return `Selected: ${condSize}\nCorrected ampacity: ${condAmp} A (@ ${condTemp} deg C ambient)`;
    
    case 'select_breaker':
      const breakerSize = output.breakerSize || output.panelRating || 0;
      return `Overcurrent protection: ${breakerSize} A breaker\n(Standard size per ${code.breakerRef})`;
    
    default:
      // For unknown operations, format key-value pairs nicely
      const entries = Object.entries(output);
      if (entries.length === 0) return 'No output data';
      
      if (entries.length === 1 && entries[0][0] === 'value') {
        return `Result: ${entries[0][1]}`;
      }
      
      return entries
        .filter(([key]) => !key.startsWith('_'))
        .map(([key, value]) => {
          const label = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
          return `${label}: ${value}`;
        })
        .join(', ');
  }
}

/**
 * Format intermediate values in natural language
 */
function formatIntermediateValues(values: any): string {
  if (!values || typeof values !== 'object') {
    return '';
  }

  const parts: string[] = [];

  // Special handling for basic load calculation formula
  if (values.livingArea_m2 && values.first90m2 && values.additional90m2Portions !== undefined) {
    const area = parseFloat(values.livingArea_m2);
    const portions = parseInt(values.additional90m2Portions);
    if (area <= 90) {
      parts.push(`Formula: ${area} m2 <= 90 m2 -> 5000 W`);
    } else {
      parts.push(`Formula: 5000 W + ${portions} x 1000 W = ${5000 + portions * 1000} W`);
    }
    return parts.join('; ');
  }

  // Common intermediate value formatting
  if (values.area || values.area_m2) {
    parts.push(`Area: ${values.area || values.area_m2} m²`);
  }
  
  if (values.rating_W || values.rating_kW) {
    parts.push(`Rating: ${values.rating_W ? values.rating_W + ' W' : values.rating_kW + ' kW'}`);
  }
  
  if (values.demandFactor) {
    parts.push(`Demand factor: ${values.demandFactor}`);
  }
  
  if (values.heating || values.heatingLoad) {
    parts.push(`Heating: ${values.heating || values.heatingLoad} W`);
  }
  
  if (values.cooling || values.coolingLoad) {
    parts.push(`Cooling: ${values.cooling || values.coolingLoad} W`);
  }
  
  if (values.interlocked !== undefined) {
    parts.push(`Interlocked: ${values.interlocked ? 'Yes' : 'No'}`);
  }
  
  if (values.type) {
    parts.push(`Type: ${values.type}`);
  }
  
  if (values.material) {
    parts.push(`Material: ${values.material}`);
  }
  
  if (values.ambientTemp || values.ambientTempC) {
    parts.push(`Ambient temp: ${values.ambientTemp || values.ambientTempC} deg C`);
  }
  
  if (values.terminationTemp || values.terminationTempC) {
    parts.push(`Termination temp: ${values.terminationTemp || values.terminationTempC} deg C`);
  }
  
  if (values.tempCorrectionFactor) {
    parts.push(`Temp correction: ${values.tempCorrectionFactor}`);
  }
  
  if (values.baseAmpacity) {
    parts.push(`Base ampacity: ${values.baseAmpacity} A`);
  }
  
  if (values.correctedAmpacity) {
    parts.push(`Corrected ampacity: ${values.correctedAmpacity} A`);
  }

  // Add any other values not already included
  Object.entries(values).forEach(([key, value]) => {
    if (
      !key.startsWith('_') &&
      !['area', 'area_m2', 'rating_W', 'rating_kW', 'demandFactor', 
        'heating', 'heatingLoad', 'cooling', 'coolingLoad', 'interlocked',
        'type', 'material', 'ambientTemp', 'ambientTempC', 'terminationTemp',
        'terminationTempC', 'tempCorrectionFactor', 'baseAmpacity', 
        'correctedAmpacity', 'note'].includes(key)
    ) {
      const label = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
      parts.push(`${label}: ${value}`);
    }
  });

  return parts.join('; ');
}
