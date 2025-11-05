// Backend calculation engine wrapper
// This script wraps the TypeScript calculation engine for use by Python backend
// It reads JSON input from stdin and outputs JSON result to stdout

const path = require('path');
const fs = require('fs');

// Redirect console.log to stderr to prevent debug output from interfering with JSON output
const originalConsoleLog = console.log;
console.log = function(...args) {
  // Only output to stderr for debugging - stdout is reserved for JSON output
  process.stderr.write(args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ') + '\n');
};

// Function to output JSON to stdout (for final result only)
function outputJSON(data) {
  const jsonString = JSON.stringify(data);
  process.stdout.write(jsonString + '\n');
}

// Resolve the calculation engine path
const enginePath = path.resolve(__dirname, '../../../packages/calculation-engine/dist/index.js');

// Import the calculation engine
let computeSingleDwelling;
let computeNECSingleDwelling;
let tableManager;

try {
  const engine = require(enginePath);
  computeSingleDwelling = engine.computeSingleDwelling;
  computeNECSingleDwelling = engine.computeNECSingleDwelling;
  
  // Try to get tableManager from browser tables (for Node.js compatibility)
  try {
    tableManager = engine.tableManager || require(path.resolve(__dirname, '../../../packages/calculation-engine/dist/core/tables.browser.js')).tableManager;
  } catch (e) {
    // Fallback to Node.js tables if browser version not available
    const tablesNode = require(path.resolve(__dirname, '../../../packages/calculation-engine/dist/core/tables.js'));
    tableManager = tablesNode.tableManager || tablesNode;
  }
} catch (error) {
  console.error('Error loading calculation engine:', error);
  process.exit(1);
}

// Read input from stdin
let inputData = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', async () => {
  try {
    // Validate input data is not empty
    if (!inputData || !inputData.trim()) {
      outputJSON({
        success: false,
        error: 'No input data received from stdin',
        stack: 'Input data was empty'
      });
      process.exit(1);
      return;
    }

    const input = JSON.parse(inputData);
    
    const {
      inputs,           // CecInputsSingle or NEC inputs
      engineMeta,       // EngineMeta
      codeEdition,      // Code edition for table loading
      codeType,         // 'cec' or 'nec'
      necMethod         // 'standard' or 'optional' (for NEC only)
    } = input;
    
    // Validate required fields
    if (!inputs) {
      outputJSON({
        success: false,
        error: 'Missing required field: inputs',
        stack: 'Input object must contain "inputs" field'
      });
      process.exit(1);
      return;
    }
    
    // Determine code type (default to 'cec')
    const codeTypeValue = codeType || inputs.codeType || 'cec';
    const codeEditionValue = codeEdition || inputs.codeEdition || (codeTypeValue === 'nec' ? '2023' : '2024');
    
    // Load tables
    const ruleTables = await tableManager.loadTables(codeEditionValue);
    
    // Execute calculation based on code type
    let resultBundle;
    if (codeTypeValue === 'nec') {
      // NEC calculation
      if (!computeNECSingleDwelling || typeof computeNECSingleDwelling !== 'function') {
        outputJSON({
          success: false,
          error: 'computeNECSingleDwelling function not available',
          stack: 'NEC calculation engine was not loaded correctly'
        });
        process.exit(1);
        return;
      }
      
      // Use optional method if specified (default to standard method)
      const useOptionalMethod = necMethod === 'optional' || inputs.necMethod === 'optional';
      resultBundle = computeNECSingleDwelling(inputs, engineMeta, ruleTables, useOptionalMethod);
    } else {
      // CEC calculation (default)
      if (!computeSingleDwelling || typeof computeSingleDwelling !== 'function') {
        outputJSON({
          success: false,
          error: 'computeSingleDwelling function not available',
          stack: 'Calculation engine was not loaded correctly'
        });
        process.exit(1);
        return;
      }
      
      resultBundle = computeSingleDwelling(inputs, engineMeta, ruleTables);
    }
    
    // Validate result
    if (!resultBundle) {
      outputJSON({
        success: false,
        error: 'Calculation returned null or undefined',
        stack: 'computeSingleDwelling did not return a bundle'
      });
      process.exit(1);
      return;
    }
    
    // Output result as JSON to stdout (not stderr)
    // Use outputJSON to ensure only JSON goes to stdout, not debug logs
    outputJSON({
      success: true,
      bundle: resultBundle
    });
    
  } catch (error) {
    // Always output JSON to stdout, even on error
    // This allows Python to parse the error response
    // Use outputJSON to ensure only JSON goes to stdout, not debug logs
    outputJSON({
      success: false,
      error: error.message || String(error),
      stack: error.stack || 'No stack trace available'
    });
    // Also log to stderr for debugging (but stdout is what Python reads)
    console.error(`[ERROR] ${error.message}`);
    process.exit(1);
  }
});

