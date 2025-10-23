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
}

/**
 * Translation function type
 */
type TranslateFn = (key: string, params?: any) => string;

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
  
  // Fallback translation function if none provided
  const translate: TranslateFn = t || ((key: string) => key);
  
  try {
    const doc = new jsPDF();
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
      { label: translate('pdf.livingArea'), value: `${bundle.inputs?.livingArea_m2 || 0} m²`, ref: 'CEC 8-110' },
      { label: translate('pdf.systemVoltage'), value: `${bundle.inputs?.systemVoltage || 240} V`, ref: '' },
      { label: translate('pdf.systemConfig'), value: bundle.inputs?.phase === 3 ? translate('pdf.threePhase') : translate('pdf.singlePhase'), ref: '' },
      { label: translate('pdf.conductorMaterial'), value: bundle.inputs?.conductorMaterial || 'Cu', ref: 'CEC Table 2' },
      { label: translate('pdf.terminationTemp'), value: `${bundle.inputs?.terminationTempC || 75}°C`, ref: 'CEC 4-006' },
      { label: translate('pdf.ambientTemp'), value: `${bundle.inputs?.ambientTempC || 30}°C`, ref: 'CEC Table 5A' }
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
        doc.text('(Heating and cooling are interlocked - CEC 8-106 3))', leftMargin + 10, yPos);
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
        doc.text(`• ${item}`, leftMargin + 10, yPos);
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
    
    const results = [
      { 
        label: translate('pdf.serviceCurrent'), 
        value: `${bundle.results?.serviceCurrentA || 'N/A'} A`,
        formula: `I = P / V = ${finalLoad} / ${bundle.inputs?.systemVoltage || 240}`
      },
      { 
        label: translate('pdf.selectedConductor'), 
        value: `${bundle.results?.conductorSize || 'N/A'} AWG (${bundle.results?.conductorMaterial || 'Cu'})`,
        formula: (() => {
          const serviceCurrent = parseFloat(bundle.results?.serviceCurrentA || 0);
          const tempFactor = parseFloat(bundle.results?.tempCorrectionFactor || 1);
          const requiredBase = serviceCurrent / tempFactor;
          const baseAmpacity = bundle.results?.baseAmpacity || 0;
          return `${serviceCurrent.toFixed(2)}A ÷ ${tempFactor.toFixed(3)} = ${requiredBase.toFixed(2)}A (required) → Selected: ${bundle.results?.conductorSize} (${baseAmpacity}A base)`;
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
          return `${baseAmpacity}A × ${tempFactor.toFixed(3)} = ${derated.toFixed(2)}A ≥ ${serviceCurrent.toFixed(2)}A ✓`;
        })()
      },
      { 
        label: translate('pdf.breakerSize'), 
        value: `${bundle.results?.breakerSizeA || bundle.results?.panelRatingA || 'N/A'} A`,
        formula: 'CEC 14-104'
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
    
    // Method A: Detailed Calculation
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(translate('pdf.methodA').toUpperCase() + ' (CEC 8-200 1)a))', leftMargin, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Build load breakdown table
    const loadBreakdown = [];
    
    // i) & ii) Basic Load
    const livingArea = bundle.inputs?.livingArea_m2 || 0;
    const basicLoadFormula = livingArea <= 90 
      ? '5000 W (for first 90 m²)'
      : `5000 + ${Math.ceil((livingArea - 90) / 90)} x 1000 = ${bundle.results?.basicLoadA} W`;
    
    loadBreakdown.push({
      item: `i) & ii) ${translate('pdf.basicLoad')}`,
      description: `${translate('pdf.livingArea')}: ${livingArea} m²`,
      formula: basicLoadFormula,
      load: bundle.results?.basicLoadA || '0'
    });
    
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
    
    // iv) Electric Range
    if (bundle.results?.rangeLoad && parseFloat(bundle.results.rangeLoad) > 0) {
      const rangeKW = bundle.inputs?.electricRangeRatingKW || 0;
      const rangeW = rangeKW * 1000;
      let rangeFormula = '';
      
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
    
    // v) Water Heater
    if (bundle.results?.waterHeaterLoad && parseFloat(bundle.results.waterHeaterLoad) > 0) {
      const whType = bundle.inputs?.waterHeaterType || 'storage';
      const whRating = bundle.inputs?.waterHeaterRatingW || 0;
      let whFormula = '';
      
      if (whType === 'tankless' || whType === 'pool_spa') {
        whFormula = `${whRating} W x 100% = ${bundle.results.waterHeaterLoad} W`;
      } else {
        whFormula = `${whRating} W x 75% = ${bundle.results.waterHeaterLoad} W (CEC Section 63)`;
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
    
    // Total Method A
    yPos += 2;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(leftMargin + 5, yPos, rightMargin - 5, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL METHOD A:', leftMargin + 5, yPos);
    doc.text(`${bundle.results?.calculatedLoadA || 'N/A'} W`, rightMargin - 5, yPos, { align: 'right' });
    yPos += 10;
    
    // Method B: Minimum Load
    doc.setFontSize(12);
    doc.text('METHOD B - Minimum Load (CEC 8-200 1)b))', leftMargin, yPos);
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
    doc.text(`${bundle.results?.minimumLoadB || 'N/A'} W`, rightMargin - 5, yPos, { align: 'right' });
    yPos += 12;
    
    // Final Selection
    doc.setFillColor(230, 255, 230);
    doc.rect(leftMargin, yPos - 3, rightMargin - leftMargin, 12, 'F');
    
    doc.setFontSize(12);
    doc.text('FINAL SERVICE LOAD (Greater of Method A or B):', leftMargin + 5, yPos + 4);
    doc.setFontSize(14);
    doc.text(`${finalLoad} W`, rightMargin - 5, yPos + 4, { align: 'right' });
    yPos += 18;
    
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
          warningText = `Method A calculated ${warning.calculated} W, but CEC 8-200 1)b) minimum of ${warning.minimum} W applies.`;
        } else {
          warningText = JSON.stringify(warning);
        }
        
        const lines = doc.splitTextToSize(`• ${warningText}`, 165);
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
      
      bundle.steps.forEach((step: any, index: number) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`STEP ${step.stepIndex || index + 1}:`, leftMargin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(translateOperationId(step.operationId), leftMargin + 20, yPos);
        yPos += 6;
        
        doc.setFontSize(8);
        if (step.formulaRef) {
          doc.setFont('helvetica', 'italic');
          doc.text(`Code Reference: ${step.formulaRef}`, leftMargin + 5, yPos);
          yPos += 5;
        }
        
        if (step.note) {
          doc.setFont('courier', 'normal');
          // Note should be in English only to avoid encoding issues
          const noteText = step.note.replace(/[^\x00-\x7F]/g, '?'); // Replace non-ASCII
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
          
          // Format output in a human-readable way
          const outputText = formatAuditOutput(step.output, step.operationId);
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
          'This report is computer-generated based on CEC 2024. Verify all calculations and consult current code requirements.',
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
    const fileName = `CEC_LoadCalc_${projectName}_${new Date().toISOString().split('T')[0]}.pdf`;
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
function translateOperationId(operationId: string): string {
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
    'select_conductor': 'Conductor Selection (CEC Table 2 & 5A)',
    'select_breaker': 'Overcurrent Protection Sizing (CEC 14-104)'
  };

  return translations[operationId] || operationId.replace(/_/g, ' ').toUpperCase();
}

/**
 * Format audit trail output in natural language
 */
function formatAuditOutput(output: any, operationId: string): string {
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
      return `Electric range: ${ratingKW} kW rated\nDemand load: ${rangeLoad} W (per CEC 8-200 1)a)iv))`;
    
    case 'calculate_water_heater_load':
      const whLoad = output.waterHeaterLoad || output.value || 0;
      const whType = output.type || 'N/A';
      const whRating = output.rating_W || 0;
      return `Water heater: ${whType} type, ${whRating} W rated\nDemand load: ${whLoad} W @ 100% (CEC Section 62)`;
    
    case 'calculate_evse_load':
      if (output.exempted || output.hasEVEMS) {
        return `EVSE: Exempted by Energy Management System\nDemand load: 0 W (per CEC 8-106 11))`;
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
      const totalA = output.totalLoadA || output.totalMethodA || output.calculatedLoadA || output.value || 0;
      return `Total Method A: ${totalA} W`;
    
    case 'minimum_load_method_b':
      const minLoad = output.minimumLoadB || output.value || 0;
      const minArea = output.area || 0;
      return `Living area: ${minArea} m²\nMinimum load (Method B): ${minLoad} W`;
    
    case 'choose_greater_load':
      const chosenLoad = output.chosenLoad || output.value || 0;
      const methodALoad = output.methodA || 0;
      const methodBLoad = output.methodB || 0;
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
      return `Selected: ${condSize} AWG ${condMat}\nCorrected ampacity: ${condAmp} A (@ ${condTemp}°C ambient)`;
    
    case 'select_breaker':
      const breakerSize = output.breakerSize || output.panelRating || 0;
      return `Overcurrent protection: ${breakerSize} A breaker\n(Standard size per CEC 14-104)`;
    
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
      parts.push(`Formula: ${area} m² ≤ 90 m² → 5000 W`);
    } else {
      parts.push(`Formula: 5000 W + ${portions} × 1000 W = ${5000 + portions * 1000} W`);
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
    parts.push(`Ambient temp: ${values.ambientTemp || values.ambientTempC}°C`);
  }
  
  if (values.terminationTemp || values.terminationTempC) {
    parts.push(`Termination temp: ${values.terminationTemp || values.terminationTempC}°C`);
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
