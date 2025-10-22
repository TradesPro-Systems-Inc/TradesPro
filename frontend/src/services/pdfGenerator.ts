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
 * Generate CEC 8-200 Single Dwelling Load Calculation PDF Report
 * Professional engineering-style report with formulas
 * @param bundle Calculation result bundle
 * @param locale Current language (converted to English for PDF to avoid font issues)
 */
export async function generateLoadCalculationPDF(
  bundle: UnsignedBundle,
  locale: string = 'en-CA'
): Promise<void> {
  console.log('📄 Generating professional PDF report...');
  
  try {
    const doc = new jsPDF();
    let yPos = 20;
    const leftMargin = 20;
    const rightMargin = 190;
    const pageWidth = 210; // A4 width in mm
    
    // Always use English for PDF to avoid font encoding issues
    // This ensures professional engineering documentation standards
    
    // ============================================================
    // PAGE 1: COVER PAGE & SUMMARY
    // ============================================================
    
    // Main Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ELECTRICAL LOAD CALCULATION REPORT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Single Dwelling Unit', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    
    doc.setFontSize(11);
    doc.text('Canadian Electrical Code (CEC) Section 8-200', pageWidth / 2, yPos, { align: 'center' });
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
    doc.text('PROJECT INFORMATION', leftMargin + 5, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Project Name: ${bundle.inputs?.project || 'Untitled Project'}`, leftMargin + 5, yPos);
    yPos += 6;
    doc.text(`Calculation ID: ${bundle.id || 'N/A'}`, leftMargin + 5, yPos);
    yPos += 6;
    doc.text(`Date Prepared: ${new Date(bundle.createdAt).toLocaleDateString('en-CA', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    })}`, leftMargin + 5, yPos);
    yPos += 15;
    
    // Input Parameters Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INPUT PARAMETERS', leftMargin, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const inputs = [
      { label: 'Living Area', value: `${bundle.inputs?.livingArea_m2 || 0} m²`, ref: 'CEC 8-110' },
      { label: 'System Voltage', value: `${bundle.inputs?.systemVoltage || 240} V`, ref: '' },
      { label: 'System Configuration', value: bundle.inputs?.phase === 3 ? '3-Phase' : 'Single-Phase', ref: '' },
      { label: 'Conductor Material', value: bundle.inputs?.conductorMaterial || 'Cu', ref: 'CEC Table 2' },
      { label: 'Termination Temperature', value: `${bundle.inputs?.terminationTempC || 75}°C`, ref: 'CEC 4-006' },
      { label: 'Ambient Temperature', value: `${bundle.inputs?.ambientTempC || 30}°C`, ref: 'CEC Table 5A' }
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
    doc.text('CALCULATION RESULTS', leftMargin, yPos);
    yPos += 10;
    
    // Highlight box for final load
    doc.setFillColor(255, 250, 205);
    doc.setDrawColor(200, 150, 0);
    doc.setLineWidth(1);
    doc.rect(leftMargin, yPos - 3, rightMargin - leftMargin, 14, 'FD');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CALCULATED SERVICE LOAD:', leftMargin + 5, yPos + 5);
    doc.setFontSize(16);
    const finalLoad = bundle.results?.chosenCalculatedLoad_W || bundle.results?.demandVA || 'N/A';
    doc.text(`${finalLoad} W`, rightMargin - 5, yPos + 5, { align: 'right' });
    yPos += 20;
    
    // Results table
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const results = [
      { 
        label: 'Service Current', 
        value: `${bundle.results?.serviceCurrentA || 'N/A'} A`,
        formula: `I = P / V = ${finalLoad} / ${bundle.inputs?.systemVoltage || 240}`
      },
      { 
        label: 'Required Conductor Size', 
        value: `${bundle.results?.conductorSize || 'N/A'} AWG (${bundle.results?.conductorMaterial || 'Cu'})`,
        formula: `CEC Table 2, corrected for temperature`
      },
      { 
        label: 'Conductor Ampacity', 
        value: `${bundle.results?.conductorAmpacity || 'N/A'} A`,
        formula: `Base: ${bundle.results?.baseAmpacity}A x Temp Factor: ${bundle.results?.tempCorrectionFactor}`
      },
      { 
        label: 'Overcurrent Protection', 
        value: `${bundle.results?.breakerSizeA || bundle.results?.panelRatingA || 'N/A'} A`,
        formula: 'CEC 14-104 (Standard breaker sizes)'
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
    doc.text('DETAILED LOAD CALCULATION', leftMargin, yPos);
    yPos += 8;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.text('CEC Section 8-200: Calculation of Minimum Service for a Single Dwelling', leftMargin, yPos);
    yPos += 12;
    
    // Method A: Detailed Calculation
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('METHOD A - Detailed Calculation (CEC 8-200 1)a))', leftMargin, yPos);
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
      item: 'i) & ii) Basic Load',
      description: `Living area: ${livingArea} m²`,
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
        item: 'iii) HVAC Load',
        description: 'Heating & Cooling',
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
        item: 'iv) Electric Range',
        description: `First range: ${rangeKW} kW`,
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
        item: 'v) Water Heater',
        description: `Type: ${whType}`,
        formula: whFormula,
        load: bundle.results.waterHeaterLoad
      });
    }
    
    // vi) EVSE
    if (bundle.results?.evseLoad && parseFloat(bundle.results.evseLoad) > 0) {
      loadBreakdown.push({
        item: 'vi) EVSE',
        description: 'Electric Vehicle Supply Equipment',
        formula: `${bundle.inputs?.evseRatingW} W x 100%`,
        load: bundle.results.evseLoad
      });
    }
    
    // vii) Other Large Loads
    if (bundle.results?.otherLargeLoadsTotal && parseFloat(bundle.results.otherLargeLoadsTotal) > 0) {
      loadBreakdown.push({
        item: 'vii) Other Large Loads',
        description: 'Appliances > 1500 W',
        formula: 'Calculated with demand factors',
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
          doc.setFont('courier', 'normal');
          doc.text(`Output: ${JSON.stringify(step.output)}`, leftMargin + 5, yPos);
          yPos += 5;
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
