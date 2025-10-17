
'use strict';
const fs = require('fs');
const path = require('path');

function loadJsonSafe(p){
  try{
    return JSON.parse(fs.readFileSync(p,'utf8'));
  }catch(e){
    return null;
  }
}

function nearestAmbientEntry(table5, ambientTempC){
  if(!table5) return null;
  const arr = table5.table5a || table5.table5A || table5.table5 || null;
  if(!arr || !Array.isArray(arr)) return null;
  let best = arr[0];
  let bestDiff = Math.abs((best.ambientTemperature||best.ambient||0) - ambientTempC);
  for(const e of arr){
    const diff = Math.abs((e.ambientTemperature||e.ambient||0) - ambientTempC);
    if(diff < bestDiff){
      best = e; bestDiff = diff;
    }
  }
  return best;
}

function findParallelFactor(table5, numConductors){
  if(!table5) return 1.0;
  const arr = table5.table5c || table5.table5C || table5.table5_c || null;
  if(!arr || !Array.isArray(arr)) return 1.0;
  for(const e of arr){
    const min = e.min || e.minConductors || 0;
    const max = (e.max || e.maxConductors || Infinity);
    if(numConductors >= min && numConductors <= max){
      return (e.factor || e.correctionFactor || 1.0);
    }
  }
  return 1.0;
}

/**
 * Lookup conductor by required current considering temp/parallel factors and tables.
 * options: { material:'Cu'|'Al', insulationTempC:90, ambientTempC:30, numConductorsInRaceway:3, tablesPath }
 */
function lookupConductorFromTable(requiredCurrent, options = {}){
  const material = options.material === 'Al' ? 'Al' : 'Cu';
  const insulationTempC = options.insulationTempC || 90;
  const ambientTempC = (typeof options.ambientTempC === 'number') ? options.ambientTempC : 30;
  const numConductors = options.numConductorsInRaceway || 3;
  const tablesPath = options.tablesPath || path.join(__dirname, '..', 'tables');

  const table2 = loadJsonSafe(path.join(tablesPath, 'table2.json')) || {};
  const table4 = loadJsonSafe(path.join(tablesPath, 'table4.json')) || {};
  const table5 = loadJsonSafe(path.join(tablesPath, 'table5.json')) || {};

  const baseTable = (material === 'Cu') ? table2 : table4;

  const ambientEntry = nearestAmbientEntry(table5, ambientTempC);
  let tempFactor = 1.0;
  if(ambientEntry){
    const key1 = `${insulationTempC}c`;
    if(ambientEntry.correctionFactors && (ambientEntry.correctionFactors[key1] != null)){
      tempFactor = ambientEntry.correctionFactors[key1];
    } else if(ambientEntry.correctionFactors && (ambientEntry.correctionFactors[String(insulationTempC)] != null)){
      tempFactor = ambientEntry.correctionFactors[String(insulationTempC)];
    } else if(ambientEntry.factor != null){
      tempFactor = ambientEntry.factor;
    }
  }

  const parallelFactor = findParallelFactor(table5, numConductors);
  const requiredBaseAmpacity = requiredCurrent / (tempFactor * parallelFactor);

  const tempKey = `${insulationTempC}c`;
  const candidates = [];
  for(const gauge of Object.keys(baseTable)){
    const entry = baseTable[gauge] || {};
    const ampObj = entry.ampacity || {};
    let baseAmp = ampObj[tempKey];
    if(baseAmp == null){
      baseAmp = ampObj[String(insulationTempC)] || ampObj['90c'] || ampObj['75c'] || ampObj['60c'] || null;
    }
    if(baseAmp != null){
      candidates.push({gauge, baseAmp, area: entry.area || 0});
    }
  }

  candidates.sort((a,b)=>a.baseAmp - b.baseAmp || a.area - b.area);

  let chosen = null;
  for(const c of candidates){
    if(c.baseAmp >= requiredBaseAmpacity){
      chosen = c; break;
    }
  }
  if(!chosen && candidates.length>0) chosen = candidates[candidates.length-1];

  const foundBase = chosen ? chosen.baseAmp : null;
  const adjusted = foundBase ? foundBase * tempFactor * parallelFactor : null;
  const conductorLabel = chosen ? `#${chosen.gauge}` : null;

  const formula = `I_base ≥ I_req / (F_temp × F_parallel) = ${requiredCurrent} / (${tempFactor.toFixed(3)} × ${parallelFactor.toFixed(3)}) = ${requiredBaseAmpacity.toFixed(3)} A`;

  return {
    conductorSize: conductorLabel,
    baseAmpacity: foundBase,
    adjustedAmpacity: adjusted,
    tempFactor,
    parallelFactor,
    requiredBaseAmpacity,
    tableUsed: (material === 'Cu') ? 'Table 2 (Cu)' : 'Table 4 (Al)',
    formula
  };
}

module.exports = { lookupConductorFromTable };
