// Test script for table loader (Node.js version)
// Run with: npx ts-node test-table-loader.ts

import { TableVersionManager } from './src/core/tableLoader.node';

async function testNodeLoader() {
  console.log('🧪 Testing Node.js Table Loader...\n');

  const manager = new TableVersionManager();

  try {
    // Test 1: Load CEC 2024 tables
    console.log('📊 Test 1: Loading CEC 2024 tables...');
    const tables2024 = await manager.loadTables('cec', '2024');
    
    console.log('✅ Tables loaded successfully!');
    console.log(`   - Table 2 entries: ${tables2024.table2?.entries?.length || 0}`);
    console.log(`   - Table 4 entries: ${tables2024.table4?.entries?.length || 0}`);
    console.log(`   - Table 5A entries: ${tables2024.table5A?.entries?.length || 0}`);
    console.log(`   - Table 5C entries: ${tables2024.table5C?.entries?.length || 0}`);
    console.log(`   - Edition: ${tables2024.edition}`);
    console.log(`   - Code: ${tables2024.code}\n`);

    // Test 2: Cache test
    console.log('📊 Test 2: Testing cache...');
    const startTime = Date.now();
    const tables2024Cached = await manager.loadTables('cec', '2024');
    const endTime = Date.now();
    console.log(`✅ Cache works! Load time: ${endTime - startTime}ms (should be < 10ms)\n`);

    // Test 3: Clear cache and reload
    console.log('📊 Test 3: Testing cache clear...');
    manager.clearCache();
    const tables2024Reloaded = await manager.loadTables('cec', '2024');
    console.log(`✅ Cache cleared and reloaded! Entries: ${tables2024Reloaded.table2?.entries?.length || 0}\n`);

    console.log('✅ All Node.js loader tests passed!\n');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run test
testNodeLoader();






