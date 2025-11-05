// frontend/copy-tables.mjs
// Build-time script to sync rule tables from SSoT (Single Source of Truth) to frontend public directory
// This ensures frontend uses the exact same table data as backend

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. SSoT (Single Source of Truth): calculation-engine package data directory
// TODO: When plugin architecture is implemented, change to:
// const SSoT_DIR = path.resolve(__dirname, '../packages/plugin-cec-8-200/data/tables');
const SSoT_DIR = path.resolve(__dirname, '../packages/calculation-engine/data/tables');

// 2. Target directory: frontend public folder
const DEST_DIR = path.resolve(__dirname, 'public/data/tables');

console.log('📦 Syncing rule tables from SSoT to frontend...');
console.log(`   Source: ${SSoT_DIR}`);
console.log(`   Destination: ${DEST_DIR}`);

// 3. Verify source exists
if (!fs.existsSync(SSoT_DIR)) {
  console.error(`❌ ERROR: Source directory does not exist: ${SSoT_DIR}`);
  console.error('   Please ensure @tradespro/calculation-engine package is installed.');
  process.exit(1);
}

// 4. Ensure destination directory exists
fs.mkdirSync(DEST_DIR, { recursive: true });

// 5. Recursively copy all table files (all editions: 2021, 2024, 2027, etc.)
try {
  // Copy entire tables directory structure
  if (fs.existsSync(SSoT_DIR)) {
    fs.cpSync(SSoT_DIR, DEST_DIR, { 
      recursive: true, 
      force: true,
      preserveTimestamps: true
    });
    
    // Verify copy succeeded
    const sourceFiles = getAllJsonFiles(SSoT_DIR);
    const destFiles = getAllJsonFiles(DEST_DIR);
    
    if (sourceFiles.length === 0) {
      console.warn('⚠️  WARNING: No table files found in source directory.');
    } else if (sourceFiles.length !== destFiles.length) {
      console.error(`❌ ERROR: File count mismatch. Source: ${sourceFiles.length}, Dest: ${destFiles.length}`);
      process.exit(1);
    } else {
      console.log(`✅ Successfully synced ${sourceFiles.length} table files:`);
      sourceFiles.forEach(file => {
        const relativePath = path.relative(SSoT_DIR, file);
        console.log(`   ✓ ${relativePath}`);
      });
    }
  } else {
    console.error(`❌ ERROR: Source directory does not exist: ${SSoT_DIR}`);
    process.exit(1);
  }
  
  console.log('✅ Rule tables sync complete.');
} catch (error) {
  console.error('❌ ERROR: Failed to sync rule tables:', error);
  process.exit(1);
}

// Helper function to get all JSON files recursively
function getAllJsonFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllJsonFiles(filePath, fileList);
    } else if (file.endsWith('.json')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}






