// TradesPro Frontend - Offline Calculation Composable
// 核心特性：完全离线工作，无需后端服务

import { ref, computed } from "vue";
// import {
//   calculateSingleDwelling,
//   tableManager,
//   EngineMeta,
//   CecInputsSingle,
//   UnsignedBundle,
//   CecResults,
// } from "@tradespro/calculation-service";

// 临时类型定义
interface EngineMeta {
  name: string;
  version: string;
  commit: string;
  buildTimestamp?: string;
}

interface CecInputsSingle {
  id?: string;
  project?: string;
  livingArea_m2?: number;
  systemVoltage: number;
  phase?: 1 | 3;
  appliances?: any[];
  continuousLoads?: any[];
  [key: string]: any;
}

interface CecResults {
  chosenCalculatedLoad_W?: string;
  serviceCurrentA?: string;
  conductorSize?: string;
  panelRatingA?: string;
  breakerSizeA?: string;
  [key: string]: any;
}

interface UnsignedBundle {
  id?: string;
  createdAt: string;
  inputs: CecInputsSingle;
  results: CecResults;
  steps: any[];
  warnings?: string[];
  [key: string]: any;
}

// 临时模拟函数 - 纯同步计算，无需异步
// eslint-disable-next-line no-unused-vars
const calculateSingleDwelling = (inputs: CecInputsSingle, _engineMeta: EngineMeta, _tables: any): UnsignedBundle => {
  // 确保 inputs 对象存在
  if (!inputs) {
    throw new Error('Calculation inputs cannot be empty');
  }

  // 纯同步计算 - 按照CEC 8-200规则
  const livingArea = inputs.livingArea_m2 || 0;
  const voltage = inputs.systemVoltage || 240;
  const phase = inputs.phase || 1;
  
  // 步骤1: 计算方法a) - 详细计算
  const basicLoadA = livingArea <= 90 
    ? 5000 
    : 5000 + Math.ceil((livingArea - 90) / 90) * 1000;
  
  // 加上供暖负载 (带需求系数 - CEC 62-118 3))
  const heatingLoadW = inputs.heatingLoadW || 0;
  const heatingDemand = heatingLoadW <= 10000 
    ? heatingLoadW 
    : 10000 + (heatingLoadW - 10000) * 0.75;
  
  // 加上空调负载 (100% 需求系数)
  const coolingLoadW = inputs.coolingLoadW || 0;
  
  // 供暖和空调互锁处理 (CEC 8-106 3))
  const hvacLoad = inputs.isHeatingAcInterlocked 
    ? Math.max(heatingDemand, coolingLoadW)
    : heatingDemand + coolingLoadW;
  
  // 加上电炉灶负载 (CEC 8-200 1)a)iv))
  // 注意：只计算第一个电炉灶，第二个及以上应在"其他电器"中添加
  let rangeLoad = 0;
  
  if (inputs.hasElectricRange && inputs.electricRangeRatingKW) {
    // 第一个电炉灶：按CEC 8-200 1)a)iv)公式计算
    const rangeRatingW = inputs.electricRangeRatingKW * 1000;
    if (rangeRatingW <= 12000) {
      rangeLoad = 6000;
    } else {
      rangeLoad = 6000 + (rangeRatingW - 12000) * 0.4;
    }
  }
  
  // 加上热水器负载 (CEC 8-200 1)a)v) + Section 62)
  let waterHeaterLoad = 0;
  if (inputs.waterHeaterType && inputs.waterHeaterType !== 'none' && inputs.waterHeaterRatingW) {
    // 根据CEC Section 62规定，所有类型热水器都按100%需求系数计算
    // tankless (即热式), storage (储水式), pool/spa都是100%
    waterHeaterLoad = inputs.waterHeaterRatingW;
  }
  
  // 加上EV充电设备负载 (CEC 8-200 1)a)vi))
  let evseLoad = 0;
  if (inputs.hasEVSE && inputs.evseRatingW && !inputs.hasEVEMS) {
    // EV充电设备：100% 需求系数 (除非有能源管理系统 8-106 11))
    // 如果有EVEMS (Electric Vehicle Energy Management System)，EVSE负载可以豁免
    evseLoad = inputs.evseRatingW;
  }
  
  // 加上其他大负载电器 (CEC 8-200 1)a)vii))
  let otherLargeLoadsTotal = 0;
  let continuousLoadExtra = 0; // 连续负载额外25%
  let applianceDetails: string[] = [];
  
  if (inputs.appliances && inputs.appliances.length > 0) {
    // 先收集所有 >1500W 的负载
    const largeLoads = inputs.appliances.filter(app => app.watts && app.watts > 1500);
    
    if (largeLoads.length > 0) {
      // 计算总负载（原始功率）
      const totalLargeLoad = largeLoads.reduce((sum, app) => sum + (app.watts || 0), 0);
      
      if (inputs.hasElectricRange) {
        // A) 有电炉灶：每个大负载按25%计算 (CEC 8-200 1)a)vii)A)
        otherLargeLoadsTotal = totalLargeLoad * 0.25;
        applianceDetails.push(`Total large loads: ${totalLargeLoad} W x 25% = ${otherLargeLoadsTotal.toFixed(0)} W`);
      } else {
        // B) 无电炉灶：前6000W按100%，超过部分按25% (CEC 8-200 1)a)vii)B)
        if (totalLargeLoad <= 6000) {
          otherLargeLoadsTotal = totalLargeLoad; // 100%
          applianceDetails.push(`Total large loads: ${totalLargeLoad} W x 100% = ${otherLargeLoadsTotal.toFixed(0)} W`);
        } else {
          otherLargeLoadsTotal = 6000 + (totalLargeLoad - 6000) * 0.25;
          applianceDetails.push(`First 6000 W at 100%: 6000 W`);
          applianceDetails.push(`Remaining ${(totalLargeLoad - 6000).toFixed(0)} W at 25%: ${((totalLargeLoad - 6000) * 0.25).toFixed(0)} W`);
          applianceDetails.push(`Total: ${otherLargeLoadsTotal.toFixed(0)} W`);
        }
      }
      
      // 计算连续负载的额外25% (CEC 8-104)
      largeLoads.forEach(app => {
        if (app.isContinuous) {
          const extraLoad = (app.watts || 0) * 0.25;
          continuousLoadExtra += extraLoad;
          applianceDetails.push(`${app.name || 'Appliance'} (${app.watts} W): Continuous load +25% = +${extraLoad.toFixed(0)} W`);
        }
      });
      
      if (continuousLoadExtra > 0) {
        applianceDetails.push(`Total continuous load extra: ${continuousLoadExtra.toFixed(0)} W`);
      }
    }
  }
  
  const calculatedLoadA = basicLoadA + hvacLoad + rangeLoad + waterHeaterLoad + evseLoad + otherLargeLoadsTotal + continuousLoadExtra;
  
  // 步骤2: 计算方法b) - 最小值 (CEC 8-200 1)b))
  // 注意: 这里应该用"不含地下室的面积"，但简化为总面积
  const minimumLoadB = livingArea >= 80 ? 24000 : 14400;
  
  // 步骤3: 取较大值 (CEC 8-200 1) "greater of Item a) or b)")
  const finalLoad = Math.max(calculatedLoadA, minimumLoadB);
  
  // 步骤4: 计算服务电流
  const serviceCurrent = phase === 3 
    ? finalLoad / (voltage * Math.sqrt(3))
    : finalLoad / voltage;
  
  // 步骤5: 导体尺寸选择 (考虑材料和温度修正)
  const material = inputs.conductorMaterial || 'Cu';
  const terminationTemp = inputs.terminationTempC || 75;
  const ambientTemp = inputs.ambientTempC || 30;
  
  // CEC Table 2 - 75°C铜线/铝线载流量 (简化版)
  const conductorTable75C = [
    // AWG/kcmil, Cu (A), Al (A)
    { size: '14 AWG', cu: 15, al: 0 },
    { size: '12 AWG', cu: 20, al: 15 },
    { size: '10 AWG', cu: 30, al: 25 },
    { size: '8 AWG', cu: 40, al: 30 },
    { size: '6 AWG', cu: 55, al: 40 },
    { size: '4 AWG', cu: 70, al: 55 },
    { size: '3 AWG', cu: 85, al: 65 },
    { size: '2 AWG', cu: 95, al: 75 },
    { size: '1 AWG', cu: 110, al: 85 },
    { size: '1/0 AWG', cu: 125, al: 100 },
    { size: '2/0 AWG', cu: 145, al: 115 },
    { size: '3/0 AWG', cu: 165, al: 130 },
    { size: '4/0 AWG', cu: 195, al: 150 },
    { size: '250 kcmil', cu: 215, al: 170 },
    { size: '300 kcmil', cu: 240, al: 190 },
    { size: '350 kcmil', cu: 260, al: 210 },
    { size: '400 kcmil', cu: 280, al: 225 },
    { size: '500 kcmil', cu: 320, al: 260 }
  ];
  
  // 温度修正系数 (CEC Table 5A - 简化)
  // 环境温度30°C为基准，75°C端接温度
  let tempCorrectionFactor = 1.0;
  if (terminationTemp === 75) {
    if (ambientTemp <= 30) tempCorrectionFactor = 1.0;
    else if (ambientTemp <= 35) tempCorrectionFactor = 0.94;
    else if (ambientTemp <= 40) tempCorrectionFactor = 0.88;
    else if (ambientTemp <= 45) tempCorrectionFactor = 0.82;
    else if (ambientTemp <= 50) tempCorrectionFactor = 0.75;
    else tempCorrectionFactor = 0.67;
  } else if (terminationTemp === 60) {
    if (ambientTemp <= 30) tempCorrectionFactor = 0.94;
    else if (ambientTemp <= 35) tempCorrectionFactor = 0.88;
    else tempCorrectionFactor = 0.82;
  } else if (terminationTemp === 90) {
    if (ambientTemp <= 30) tempCorrectionFactor = 1.04;
    else if (ambientTemp <= 35) tempCorrectionFactor = 1.0;
    else if (ambientTemp <= 40) tempCorrectionFactor = 0.96;
    else tempCorrectionFactor = 0.91;
  }
  
  // 选择最小满足要求的导体
  let conductorSize = '14 AWG';
  let baseAmpacity = 15;
  let deratedAmpacity = 15;
  
  for (const conductor of conductorTable75C) {
    const ampacity = material === 'Cu' ? conductor.cu : conductor.al;
    if (ampacity === 0) continue; // 跳过不适用的尺寸
    
    const derated = ampacity * tempCorrectionFactor;
    
    if (derated >= serviceCurrent) {
      conductorSize = conductor.size;
      baseAmpacity = ampacity;
      deratedAmpacity = derated;
      break;
    }
  }
  
  // Step 6: Breaker sizing (round up to standard sizes)
  const standardBreakerSizes = [15, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200];
  const breakerSize = standardBreakerSizes.find(size => size >= serviceCurrent) || 200;
  
  const warnings: any[] = [];
  if (finalLoad === minimumLoadB) {
    warnings.push({
      type: 'minimumLoadApplied',
      calculated: calculatedLoadA.toFixed(0),
      minimum: minimumLoadB.toFixed(0)
    });
  }

  const result: UnsignedBundle = {
    id: `calc-${Date.now()}`,
    createdAt: new Date().toISOString(),
    inputs: {
      ...inputs,
      project: inputs.project || 'Untitled Project',
      livingArea_m2: livingArea,
      systemVoltage: voltage,
      phase: phase,
      appliances: inputs.appliances || [],
      continuousLoads: inputs.continuousLoads || [],
      heatingLoadW: inputs.heatingLoadW || 0,
      coolingLoadW: inputs.coolingLoadW || 0,
      isHeatingAcInterlocked: inputs.isHeatingAcInterlocked || false
    },
    results: {
      chosenCalculatedLoad_W: finalLoad.toFixed(2),
      serviceCurrentA: serviceCurrent.toFixed(2),
      conductorSize: conductorSize,
      conductorMaterial: material,
      conductorAmpacity: deratedAmpacity.toFixed(1),
      baseAmpacity: baseAmpacity.toString(),
      tempCorrectionFactor: tempCorrectionFactor.toFixed(3),
      terminationTemp: terminationTemp.toString(),
      ambientTemp: ambientTemp.toString(),
      panelRatingA: breakerSize.toString(),
      breakerSizeA: breakerSize.toString(),
      demandVA: finalLoad.toFixed(2),
      demand_kVA: (finalLoad / 1000).toFixed(2),
      // Load breakdown
      basicLoadA: basicLoadA.toFixed(2),
      hvacLoad: hvacLoad.toFixed(2),
      rangeLoad: rangeLoad.toFixed(2),
      waterHeaterLoad: waterHeaterLoad.toFixed(2),
      evseLoad: evseLoad.toFixed(2),
      otherLargeLoadsTotal: otherLargeLoadsTotal.toFixed(2),
      continuousLoadExtra: continuousLoadExtra.toFixed(2),
      calculatedLoadA: calculatedLoadA.toFixed(2),
      minimumLoadB: minimumLoadB.toFixed(2)
    },
    steps: [
      {
        stepIndex: 1,
        operationId: 'calculate_basic_load_method_a',
        formulaRef: 'CEC 8-200 1)a)i-ii)',
        output: { basicLoad: basicLoadA.toFixed(2), area: livingArea.toFixed(2) },
        intermediateValues: {
          livingArea_m2: livingArea.toFixed(2),
          first90m2: '5000',
          additional90m2Portions: Math.ceil(Math.max(0, livingArea - 90) / 90).toString(),
          additionalLoad: Math.max(0, basicLoadA - 5000).toFixed(2)
        },
        timestamp: new Date().toISOString(),
        note: `Method A: ${livingArea} m² area → Basic load ${basicLoadA} W`
      },
      {
        stepIndex: 2,
        operationId: 'calculate_hvac_load',
        formulaRef: 'CEC 8-200 1)a)iii), 62-118 3), 8-106 3)',
        output: { 
          hvacLoad: hvacLoad.toFixed(2),
          heating: heatingDemand.toFixed(2),
          cooling: coolingLoadW.toFixed(2),
          interlocked: inputs.isHeatingAcInterlocked
        },
        intermediateValues: {
          heatingLoadRaw_W: heatingLoadW.toString(),
          heatingDemand_W: heatingDemand.toFixed(2),
          coolingLoad_W: coolingLoadW.toString(),
          isInterlocked: inputs.isHeatingAcInterlocked ? 'Yes' : 'No'
        },
        timestamp: new Date().toISOString(),
        note: `Heating demand: ${heatingDemand.toFixed(0)} W, Cooling: ${coolingLoadW} W, Interlocked: ${inputs.isHeatingAcInterlocked ? 'Yes' : 'No'}`
      },
      {
        stepIndex: 3,
        operationId: 'calculate_range_load',
        formulaRef: 'CEC 8-200 1)a)iv)',
        output: { 
          rangeLoad: rangeLoad.toFixed(2),
          rating_kW: (inputs.electricRangeRatingKW || 0).toFixed(2)
        },
        intermediateValues: {
          hasRange: inputs.hasElectricRange ? 'Yes' : 'No',
          rangeRating_kW: (inputs.electricRangeRatingKW || 0).toString(),
          rangeRating_W: ((inputs.electricRangeRatingKW || 0) * 1000).toString(),
          formula: (inputs.electricRangeRatingKW || 0) * 1000 <= 12000 
            ? '6000W (<=12kW)' 
            : `6000 + ${((inputs.electricRangeRatingKW || 0) * 1000 - 12000).toFixed(0)} x 0.4`,
          note: '2nd and subsequent ranges should be added in "Other Appliances" at 25%'
        },
        timestamp: new Date().toISOString(),
        note: inputs.hasElectricRange 
          ? `Electric Range #1: ${rangeLoad.toFixed(0)} W (rated ${inputs.electricRangeRatingKW} kW)` 
          : 'No electric range (add 2nd+ ranges in "Other Appliances")'
      },
      {
        stepIndex: 4,
        operationId: 'calculate_water_heater_load',
        formulaRef: 'CEC 8-200 1)a)v)',
        output: { 
          waterHeaterLoad: waterHeaterLoad.toFixed(2),
          type: inputs.waterHeaterType || 'none',
          rating_W: (inputs.waterHeaterRatingW || 0).toFixed(2)
        },
        intermediateValues: {
          type: inputs.waterHeaterType || 'none',
          rating_W: (inputs.waterHeaterRatingW || 0).toString(),
          demandFactor: '100%', // All water heater types per CEC Section 62
          note: 'CEC 8-200 1)a)v) - tankless, storage, pool/spa all at 100%'
        },
        timestamp: new Date().toISOString(),
        note: inputs.waterHeaterType && inputs.waterHeaterType !== 'none'
          ? `Water heater (${inputs.waterHeaterType}): ${waterHeaterLoad.toFixed(0)} W @ 100% (CEC Section 62)`
          : 'No water heater'
      },
      {
        stepIndex: 5,
        operationId: 'calculate_evse_load',
        formulaRef: 'CEC 8-200 1)a)vi)',
        output: { 
          evseLoad: evseLoad.toFixed(2),
          exempted: inputs.hasEVEMS || false,
          hasEVEMS: inputs.hasEVEMS || false
        },
        intermediateValues: {
          hasEVSE: inputs.hasEVSE ? 'Yes' : 'No',
          evseRating_W: (inputs.evseRatingW || 0).toString(),
          demandFactor: '100%',
          note: 'Except as permitted by Rule 8-106 11) with energy management system'
        },
        timestamp: new Date().toISOString(),
        note: inputs.hasEVSE && inputs.evseRatingW
          ? (inputs.hasEVEMS 
              ? `EVSE: ${inputs.evseRatingW} W (Exempted by EVEMS per CEC 8-106 11))`
              : `EVSE: ${evseLoad.toFixed(0)} W @ 100% (CEC 8-200 1)a)vi))`)
          : 'No EVSE'
      },
      {
        stepIndex: 5,
        operationId: 'calculate_other_large_loads',
        formulaRef: 'CEC 8-200 1)a)vii) + CEC 8-104 (continuous loads)',
        output: { 
          otherLargeLoadsTotal: otherLargeLoadsTotal.toFixed(2),
          continuousLoadExtra: continuousLoadExtra.toFixed(2),
          combinedTotal: (otherLargeLoadsTotal + continuousLoadExtra).toFixed(2)
        },
        intermediateValues: {
          hasRange: inputs.hasElectricRange ? 'Yes' : 'No',
          numAppliances: (inputs.appliances?.filter(a => a.watts && a.watts > 1500).length || 0).toString(),
          demandFactor: inputs.hasElectricRange ? '25%' : '100% up to 6kW, then 25%',
          continuousLoadExtra: continuousLoadExtra.toFixed(2),
          calculation: applianceDetails.join('; ')
        },
        timestamp: new Date().toISOString(),
        note: applianceDetails.length > 0 
          ? applianceDetails.join('\n') 
          : `Other large loads (>1500W): ${otherLargeLoadsTotal.toFixed(0)} W ${inputs.hasElectricRange ? '@ 25%' : '@ stepped demand'}`
      },
      {
        stepIndex: 6,
        operationId: 'total_method_a',
        formulaRef: 'CEC 8-200 1)a) Total',
        output: { totalLoadA: calculatedLoadA.toFixed(2) },
        intermediateValues: {
          basicLoad: basicLoadA.toFixed(2),
          hvacLoad: hvacLoad.toFixed(2),
          rangeLoad: rangeLoad.toFixed(2),
          waterHeaterLoad: waterHeaterLoad.toFixed(2),
          evseLoad: evseLoad.toFixed(2),
          otherLoads: otherLargeLoadsTotal.toFixed(2),
          continuousExtra: continuousLoadExtra.toFixed(2),
          total: calculatedLoadA.toFixed(2)
        },
        timestamp: new Date().toISOString(),
        note: continuousLoadExtra > 0
          ? `Method A total: ${basicLoadA}+${hvacLoad.toFixed(0)}+${rangeLoad.toFixed(0)}+${waterHeaterLoad.toFixed(0)}+${evseLoad.toFixed(0)}+${otherLargeLoadsTotal.toFixed(0)}+${continuousLoadExtra.toFixed(0)} = ${calculatedLoadA.toFixed(0)} W`
          : `Method A total: ${basicLoadA}+${hvacLoad.toFixed(0)}+${rangeLoad.toFixed(0)}+${waterHeaterLoad.toFixed(0)}+${evseLoad.toFixed(0)}+${otherLargeLoadsTotal.toFixed(0)} = ${calculatedLoadA.toFixed(0)} W`
      },
      {
        stepIndex: 4,
        operationId: 'minimum_load_method_b',
        formulaRef: 'CEC 8-200 1)b)',
        output: { minimumLoadB: minimumLoadB.toFixed(2), area: livingArea.toFixed(2) },
        intermediateValues: {
          livingArea_m2: livingArea.toFixed(2),
          threshold: '80',
          minimumLoad: minimumLoadB.toString()
        },
        timestamp: new Date().toISOString(),
        note: `Method B: ${livingArea >= 80 ? '>=80 m² -> 24000 W (100A)' : '<80 m² -> 14400 W (60A)'}`
      },
      {
        stepIndex: 5,
        operationId: 'choose_greater_load',
        formulaRef: 'CEC 8-200 1) "greater of Item a) or b)"',
        output: { 
          chosenLoad: finalLoad.toFixed(2),
          methodA: calculatedLoadA.toFixed(2),
          methodB: minimumLoadB.toFixed(2)
        },
        intermediateValues: {
          methodA: calculatedLoadA.toFixed(2),
          methodB: minimumLoadB.toString(),
          chosen: finalLoad.toFixed(2),
          reason: finalLoad === minimumLoadB ? 'Using Method B minimum' : 'Using Method A detailed calculation'
        },
        timestamp: new Date().toISOString(),
        note: `Final load: ${finalLoad.toFixed(2)} W (${finalLoad === minimumLoadB ? 'minimum' : 'calculated'})`
      },
      {
        stepIndex: 6,
        operationId: 'calculate_service_current',
        formulaRef: phase === 3 ? 'I = P / (V × √3)' : 'I = P / V',
        output: { 
          serviceCurrent: serviceCurrent.toFixed(2),
          voltage: voltage.toFixed(2)
        },
        intermediateValues: {
          load_W: finalLoad.toString(),
          voltage_V: voltage.toString(),
          phase: phase.toString(),
          formula: phase === 3 ? 'I = P / (V × √3)' : 'I = P / V'
        },
        timestamp: new Date().toISOString(),
        note: `Service current: ${serviceCurrent.toFixed(2)} A @ ${voltage} V ${phase}-phase`
      },
      {
        stepIndex: 7,
        operationId: 'select_conductor',
        formulaRef: 'CEC Table 2, Table 5A',
        output: { 
          conductorSize: conductorSize,
          material: material,
          ampacity: deratedAmpacity.toFixed(2),
          ambientTemp: ambientTemp.toFixed(2)
        },
        intermediateValues: {
          requiredCurrent: serviceCurrent.toFixed(2),
          material: material,
          terminationTemp: `${terminationTemp}°C`,
          ambientTemp: `${ambientTemp}°C`,
          tempCorrectionFactor: tempCorrectionFactor.toFixed(3),
          baseAmpacity: baseAmpacity.toString(),
          deratedAmpacity: deratedAmpacity.toFixed(2),
          selectedSize: conductorSize
        },
        timestamp: new Date().toISOString(),
        note: `Conductor: ${conductorSize} ${material} | Base: ${baseAmpacity}A | Temp correction: x${tempCorrectionFactor.toFixed(3)} | Rated: ${deratedAmpacity.toFixed(1)}A`
      },
      {
        stepIndex: 8,
        operationId: 'select_breaker',
        formulaRef: 'CEC 14-104 (Standard breaker sizes)',
        output: { 
          breakerSize: breakerSize.toFixed(2),
          panelRating: breakerSize.toFixed(2)
        },
        intermediateValues: {
          serviceCurrent: serviceCurrent.toFixed(2),
          selectedBreaker: breakerSize.toString()
        },
        timestamp: new Date().toISOString(),
        note: `Breaker size: ${breakerSize} A`
      }
    ],
    warnings: warnings
  };
  
  return result;
};

// 临时模拟表格管理器 - 同步返回空表格
const tableManager = {
  loadTables: () => ({ 
    table2: { entries: [] }, 
    table4: { entries: [] },
    table5A: { entries: [] },
    table5C: { entries: [] }
  })
};
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";

export function useOfflineCalculation() {
  const bundle = ref<UnsignedBundle | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const calculationTimeMs = ref(0);

  const hasResults = computed(() => bundle.value !== null);
  const hasWarnings = computed(() => (bundle.value?.warnings?.length ?? 0) > 0);
  const results = computed(() => bundle.value?.results ?? null);
  const steps = computed(() => bundle.value?.steps ?? []);

  /**
   * 核心计算函数 - 100% 离线工作
   */
  async function calculateLocally(inputs: CecInputsSingle) {
    loading.value = true;
    error.value = null;
    const startTime = performance.now();

    try {
      // The `createOfflineEngine` function is not exported from the calculation-service.
      // Instead, we should construct the EngineMeta object directly.
      const engineMeta: EngineMeta = {
        name: 'tradespro-cec-engine', // Or a more specific name if available
        version: '5.0.0', // Or dynamically get from a config/env
        commit: 'offline-local', // import.meta.env.VITE_GIT_COMMIT || 'offline-local',
      };

      // ✅ 关键：纯同步计算，无网络请求，无异步等待
      const rawBundle = calculateSingleDwelling(
        inputs,
        engineMeta,
        tableManager.loadTables()
      );

      // 直接赋值，无需等待
      bundle.value = rawBundle;

      calculationTimeMs.value = performance.now() - startTime;

      // 保存到本地存储（离线持久化）
      await saveToLocalStorage(bundle.value);

      // 可选：如果在线且用户已登录，同步到云端
      if (navigator.onLine && isUserLoggedIn()) {
        syncToCloudBackground(bundle.value);
      }

      return bundle.value;
    } catch (err: any) {
      console.error('计算错误:', err);
      error.value = err.message || '计算失败';
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 保存计算到本地存储
   */
  async function saveToLocalStorage(bundle: UnsignedBundle) {
    const key = `calc-${bundle.id || Date.now()}`;
    const value = JSON.stringify(bundle);

    if (Capacitor.isNativePlatform()) {
      // 移动端使用 Capacitor Preferences
      await Preferences.set({ key, value });
    } else {
      // 浏览器使用 localStorage
      localStorage.setItem(key, value);
    }

    // 同时更新计算列表索引
    await updateCalculationIndex(bundle);
  }

  /**
   * 从本地存储加载计算
   */
  async function loadFromLocalStorage(calcId: string) {
    loading.value = true;
    error.value = null;

    try {
      const key = `calc-${calcId}`;
      let value: string | null = null;

      if (Capacitor.isNativePlatform()) {
        const result = await Preferences.get({ key });
        value = result.value;
      } else {
        value = localStorage.getItem(key);
      }

      if (value) {
        bundle.value = JSON.parse(value);
        return bundle.value;
      } else {
        error.value = '未找到计算记录';
        return null;
      }
    } catch (err: any) {
      error.value = '加载失败';
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取所有本地计算列表
   */
  async function listLocalCalculations(): Promise<Array<{
    id: string;
    project?: string;
    createdAt: string;
    buildingType?: string;
  }>> {
    try {
      if (Capacitor.isNativePlatform()) {
        const { value } = await Preferences.get({ key: 'calc-index' });
        return value ? JSON.parse(value) : [];
      } else {
        const index = localStorage.getItem('calc-index');
        return index ? JSON.parse(index) : [];
      }
    } catch {
      return [];
    }
  }

  /**
   * 更新计算索引（用于列表显示）
   */
  async function updateCalculationIndex(bundle: UnsignedBundle) {
    const index = await listLocalCalculations();
    
    const newEntry = {
      id: bundle.id || `calc-${Date.now()}`,
      project: bundle.inputs?.project || 'Untitled Project',
      createdAt: bundle.createdAt,
      buildingType: bundle.buildingType
    };

    // 避免重复
    const filtered = index.filter(item => item.id !== newEntry.id);
    filtered.unshift(newEntry);

    // 最多保存 100 条记录
    const updated = filtered.slice(0, 100);

    const value = JSON.stringify(updated);
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: 'calc-index', value });
    } else {
      localStorage.setItem('calc-index', value);
    }
  }

  /**
   * 删除本地计算
   */
  async function deleteLocalCalculation(calcId: string) {
    const key = `calc-${calcId}`;

    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }

    // 更新索引
    const index = await listLocalCalculations();
    const updated = index.filter(item => item.id !== calcId);
    const value = JSON.stringify(updated);

    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: 'calc-index', value });
    } else {
      localStorage.setItem('calc-index', value);
    }
  }

  /**
   * 后台同步到云端（可选，不影响离线功能）
   */
  function syncToCloudBackground(bundle: UnsignedBundle) {
    // 静默失败，不影响用户体验
    fetch('/api/v1/calculations', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        project_id: getCurrentProjectId(),
        bundle
      })
    }).catch(() => {
      console.log('云端同步失败（离线模式）');
    });
  }

  /**
   * 导出为 JSON
   */
  function exportAsJSON(): string {
    if (!bundle.value) return '';
    return JSON.stringify(bundle.value, null, 2);
  }

  /**
   * 下载 JSON 文件
   */
  function downloadJSON(filename?: string) {
    if (!bundle.value) return;

    const json = exportAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `calculation-${bundle.value.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * 重置状态
   */
  function reset() {
    bundle.value = null;
    error.value = null;
    calculationTimeMs.value = 0;
  }

  // 辅助函数
  function isUserLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  function getAuthToken(): string {
    return localStorage.getItem('access_token') || '';
  }

  function getCurrentProjectId(): number {
    return parseInt(localStorage.getItem('current_project_id') || '1');
  }

  return {
    // 状态
    bundle,
    loading,
    error,
    calculationTimeMs,

    // 计算属性
    hasResults,
    hasWarnings,
    results,
    steps,

    // 方法
    calculateLocally,
    loadFromLocalStorage,
    listLocalCalculations,
    deleteLocalCalculation,
    exportAsJSON,
    downloadJSON,
    reset
  };
}