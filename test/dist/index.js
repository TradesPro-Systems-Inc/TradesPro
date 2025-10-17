/**
 * 完整版 lookupConductorFromTable
 * 根据需求电流、温度修正、并列修正，选择最小可用线径。
 */
export function lookupConductorFromTable(requiredCurrent, opts) {
  const {
    material = 'Cu',          // Cu 或 Al
    insulation = '90c',       // 绝缘等级
    ambientTempC = 30,        // 环境温度
    numConductors = 3,        // 根数
    table4,
    table2,
    table5
  } = opts;

  // === Step 1: 读取修正因子 ===
  const tempFactor = table5?.tempCorrection?.[insulation]?.[ambientTempC] ?? 1.0;
  const parallelFactor = table5?.parallelAdjustment?.[numConductors] ?? 1.0;

  // === Step 2: 反推修正前需求电流 ===
  const requiredBaseCurrent = requiredCurrent / (tempFactor * parallelFactor);

  // === Step 3: 选表 ===
  const table = material.toLowerCase() === 'al' ? table4 : table2;

  // === Step 4: 找最小满足载流量的线径 ===
  let selected = null;
  let baseAmpacity = null;
  for (const [awg, data] of Object.entries(table)) {
    const ampacity = data.ampacity?.[insulation];
    if (ampacity >= requiredBaseCurrent) {
      selected = awg;
      baseAmpacity = ampacity;
      break;
    }
  }

  // === Step 5: 计算修正后的容量 ===
  const adjustedAmpacity = baseAmpacity * tempFactor * parallelFactor;

  return {
    conductor: `${selected} AWG ${material.toUpperCase()}`,
    baseAmpacity,
    adjustedAmpacity,
    tempFactor,
    parallelFactor,
    requiredBaseCurrent,
    meetsRequirement: adjustedAmpacity >= requiredCurrent
  };
}
