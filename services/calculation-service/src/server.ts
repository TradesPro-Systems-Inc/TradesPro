// services/calculation-service/src/server.ts
// TradesPro Calculation Microservice - Main Entry Point

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { tableManager } from './core/tables';
import { CecInputsSingle, EngineMeta, RuleTables } from './core/types';

const app: Express = express();
const PORT = process.env.CALC_SERVICE_PORT || 3001;

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
// Simple Test Calculation Endpoint
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
      console.log(`  POST http://localhost:${PORT}/api/calculate/test`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;