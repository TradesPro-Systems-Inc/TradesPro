// Quick test script for Node.js table loader
// Run with: node test-table-loader-node.js

const { TableVersionManager } = require('./dist/core/tableLoader.node');

async function test() {
  console.log('🧪 Testing Node.js Table Loader...\n');
  
  const manager = new TableVersionManager();
  
  try {
    console.log('📊 Loading CEC 2024 tables...');
    const tables = await manager.loadTables('cec', '2024');
    
    console.log('✅ Tables loaded successfully!');
    console.log(`   - Table 2 entries: ${tables.table2?.entries?.length || 0}`);
    console.log(`   - Table 4 entries: ${tables.table4?.entries?.length || 0}`);
    console.log(`   - Table 5A entries: ${tables.table5A?.entries?.length || 0}`);
    console.log(`   - Table 5C entries: ${tables.table5C?.entries?.length || 0}`);
    console.log(`   - Edition: ${tables.edition}`);
    console.log(`   - Code: ${tables.code}\n`);
    
    // Test cache
    console.log('📊 Testing cache...');
    const startTime = Date.now();
    const cached = await manager.loadTables('cec', '2024');
    const endTime = Date.now();
    console.log(`✅ Cache works! Load time: ${endTime - startTime}ms\n`);
    
    console.log('✅ All tests passed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

test();






