// services/calculation-service/src/server.ts
// TradesPro Calculation Microservice - Main Entry Point

import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import { 
  executePlugin, 
  createPluginContext,
  pluginRegistry 
} from '@tradespro/core-engine';
import { cecSingleDwellingPlugin } from '@tradespro/plugin-cec-8-200';
// Note: tableManager I/O is still in calculation-engine for now
// In the future, this could be moved to a separate package or integrated into plugins
import { tableManager } from '@tradespro/calculation-engine';
import type { CecInputsSingle, EngineMeta, RuleTables } from '@tradespro/core-engine';

const app: Application = express();
const PORT = parseInt(process.env.CALC_SERVICE_PORT || '3001', 10);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Global tables cache
let cachedTables: RuleTables | null = null;

// ============================================
// Health Check
// ============================================
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'calculation-service',
    version: process.env.ENGINE_VERSION || '5.0.0',
    commit: process.env.GIT_COMMIT || 'dev',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// Get Engine Info
// ============================================
app.get('/api/engine/info', (_req: Request, res: Response) => {
  res.json({
    name: 'tradespro-cec-engine',
    version: process.env.ENGINE_VERSION || '5.0.0',
    commit: process.env.GIT_COMMIT || 'dev',
    buildTimestamp: process.env.BUILD_TIMESTAMP || new Date().toISOString(),
    supportedBuildingTypes: ['single-dwelling', 'apartment'],
    supportedCodeEditions: ['2021', '2024', '2027'],
    supportedCodeTypes: ['cec', 'nec']
  });
});

// ============================================
// Get Available Tables Info
// ============================================
app.get('/api/tables', async (req: Request, res: Response) => {
  try {
    const edition = (req.query.edition as string) || '2024';
    const code = (req.query.code as string) || 'cec';
    
    const tables = await tableManager.loadTables(code as any, edition as any);
    
    res.json({
      code,
      edition,
      tables: [
        {
          tableId: tables.table2?.tableId,
          name: tables.table2?.name,
          entries: tables.table2?.entries.length
        },
        {
          tableId: tables.table4?.tableId,
          name: tables.table4?.name,
          entries: tables.table4?.entries.length
        },
        {
          tableId: tables.table5A?.tableId,
          name: tables.table5A?.name,
          entries: tables.table5A?.entries.length
        },
        {
          tableId: tables.table5C?.tableId,
          name: tables.table5C?.name,
          entries: tables.table5C?.entries.length
        }
      ]
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to load tables',
      message: error.message
    });
  }
});

// ============================================
// TRUE Single Dwelling Calculation Endpoint
// ============================================
app.post('/api/calculate/single-dwelling', async (req: Request, res: Response) => {
  try {
    const inputs: CecInputsSingle = req.body;

    if (!cachedTables) {
      throw new Error("Tables are not loaded on the server.");
    }
    
    const engineMeta: EngineMeta = {
      name: 'tradespro-cec-engine',
      version: process.env.ENGINE_VERSION || '5.0.0',
      commit: process.env.GIT_COMMIT || 'dev', // This MUST be injected by CI
    };

    // ✅ V5 ARCHITECTURE: Use plugin system for calculation
    // Register plugin if not already registered
    if (!pluginRegistry.has('cec-single-dwelling-2024')) {
      pluginRegistry.registerDefault(cecSingleDwellingPlugin);
    }
    
    // Create plugin context
    const context = createPluginContext(engineMeta, cachedTables, {
      mode: 'official',
      tier: 'premium'
    });
    
    // Execute plugin
    const result = await executePlugin('cec-single-dwelling-2024', inputs, context);
    const unsignedBundle = result.bundle;

    // TODO: The FastAPI backend will handle packaging, signing, and persistence.
    // This microservice's only job is to return the pure, unsigned calculation.
    res.json({
      success: true,
      bundle: unsignedBundle,
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Calculation failed',
      message: error.message,
    });
  }
});

// ============================================
// Legacy Test Endpoint (for backward compatibility)
// ============================================
app.post('/api/calculate/test', async (req: Request, res: Response) => {
  try {
    const { livingArea_m2 = 150 } = req.body;
    
    // Simple calculation for testing
    const basicLoad = livingArea_m2 <= 90 
      ? 5000 
      : 5000 + Math.ceil((livingArea_m2 - 90) / 90) * 1000;
    
    res.json({
      success: true,
      result: {
        livingArea_m2,
        basicLoad_W: basicLoad,
        message: 'Test calculation successful'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Error Handler
// ============================================
app.use((err: Error, _req: Request, res: Response, _next: Function) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// ============================================
// Start Server
// ============================================
async function startServer() {
  try {
    // Preload default tables
    console.log('Loading default tables...');
    cachedTables = await tableManager.loadTables('cec', '2024');
    console.log('✓ Tables loaded successfully');
    
    app.listen(PORT, () => {
      console.log('==========================================');
      console.log('TradesPro Calculation Microservice');
      console.log('==========================================');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Engine version: ${process.env.ENGINE_VERSION || '5.0.0'}`);
      console.log(`🔧 Git commit: ${process.env.GIT_COMMIT || 'dev'}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('==========================================');
      console.log('\nAvailable endpoints:');
      console.log(`  GET  http://localhost:${PORT}/health`);
      console.log(`  GET  http://localhost:${PORT}/api/engine/info`);
      console.log(`  GET  http://localhost:${PORT}/api/tables`);
      console.log(`  POST http://localhost:${PORT}/api/calculate/single-dwelling`);
      console.log(`  POST http://localhost:${PORT}/api/calculate/test (legacy)`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;