/* eslint-env node */

import { configure } from 'quasar/wrappers';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));



// Vite plugin to handle Node.js modules in browser builds
function nodeModulesStubPlugin() {
  const signatureVerifierBrowserPath = path
    .resolve(__dirname, '../packages/core-engine/src/plugins/signatureVerifier.browser.ts')
    .replace(/\\/g, '/');
  const signatureVerifierPath = path
    .resolve(__dirname, '../packages/core-engine/src/plugins/signatureVerifier.ts')
    .replace(/\\/g, '/');
  
  return {
    name: 'node-modules-stub',
    enforce: 'pre', // Run before other plugins
    resolveId(id, importer) {
      // Normalize paths for comparison
      const normalizedId = id ? id.replace(/\\/g, '/') : '';
      const normalizedPath = signatureVerifierPath.replace(/\\/g, '/');
      const normalizedBrowserPath = signatureVerifierBrowserPath.replace(/\\/g, '/');
      
      // Intercept Node.js built-in modules
      const nodeModules = ['fs', 'crypto', 'vm', 'path', 'os', 'util'];
      if (nodeModules.includes(id)) {
        return { id: './src/utils/node-stub.js', external: false };
      }
      
      // Intercept signatureVerifier imports - match by absolute path (normalized)
      if (normalizedId === normalizedPath || normalizedId === normalizedPath.replace('.ts', '')) {
        console.log(`[Vite Plugin] Redirecting signatureVerifier from ${id} to browser stub`);
        return { id: normalizedBrowserPath, external: false };
      }
      
      // Match any import ending with signatureVerifier (but not the browser version)
      if (normalizedId.includes('signatureVerifier') && !normalizedId.includes('signatureVerifier.browser')) {
        // Check if it's a relative import
        if (id === './signatureVerifier' || id === './signatureVerifier.ts' ||
            id === '../signatureVerifier' || id === '../signatureVerifier.ts' ||
            normalizedId.endsWith('/signatureVerifier') || normalizedId.endsWith('/signatureVerifier.ts')) {
          console.log(`[Vite Plugin] Redirecting signatureVerifier import from ${id} (importer: ${importer || 'unknown'})`);
          return { id: normalizedBrowserPath, external: false };
        }
      }
      
      return null;
    },
    load(id) {
      // Intercept the actual file load - if it's signatureVerifier.ts, load the browser stub instead
      const normalizedId = id.replace(/\\/g, '/');
      const normalizedPath = signatureVerifierPath.replace(/\\/g, '/');
      if (normalizedId === normalizedPath || normalizedId === normalizedPath.replace('.ts', '')) {
        console.log(`[Vite Plugin] Loading browser stub instead of ${id}`);
        // Return null to let Vite handle the redirect via resolveId
        return null;
      }
      return null;
    }
  };
}

// eslint-disable-next-line no-unused-vars
export default configure(function (_ctx) {
  return {
    eslint: {
      // [✓] TEMPORARILY DISABLED to troubleshoot blank page.
      // You can enable this again later.
      warnings: false,
      errors: false
    },

    boot: [
      'pinia',
      'i18n'
    ],

    css: [
      'app.scss'
    ],

    extras: [
      'roboto-font',
      'material-icons',
    ],

    assetsInclude: ['**/*.json'],

    vite: {
      plugins: [
        nodeModulesStubPlugin()
      ],
      server: {
        fs: {
          // Allow serving files from one level up to the project root
          allow: ['..']
        },
        // Configure HMR for ngrok/tunnel access
        // Note: ngrok free tier has limitations with WebSocket connections
        // For ngrok, we disable HMR WebSocket to avoid connection errors
        // You can still use full page reload (F5) to see changes
        hmr: (() => {
          // Check if HMR should be disabled via environment variable
          if (process.env.DISABLE_HMR === 'true') {
            return false;
          }
          
          // Check if we're running behind a tunnel (ngrok, etc.)
          // If so, disable HMR to avoid WebSocket connection errors
          const isTunnel = process.env.NGROK_HOST || 
                          process.env.VITE_API_BASE_URL?.includes('ngrok') ||
                          process.env.VITE_API_BASE_URL?.includes('tunnel');
          
          if (isTunnel) {
            // Disable HMR for tunnel access (avoids WebSocket errors)
            return false;
          }
          
          // Default HMR configuration for local development
          return {
            protocol: 'ws',
            host: 'localhost',
            port: 3000
          };
        })()
      },
      optimizeDeps: {
        // Ensure calculation-engine is processed by Vite from source
        include: ['@tradespro/calculation-engine'],
        // Force re-optimization after alias change
        force: true,
        // Exclude Node.js-only modules from optimization
        exclude: ['fs', 'crypto', 'vm', 'path', 'os']
      },
      ssr: {
        // For SSR, also use source imports
        noExternal: ['@tradespro/calculation-engine']
      }
    },
    
    // Extend Vite config to set up aliases
    extendViteConf(viteConf, { isServer, isClient }) {
      if (!viteConf.resolve) {
        viteConf.resolve = {};
      }

      if (!viteConf.resolve.alias) {
        viteConf.resolve.alias = [];
      }

      // Normalize alias definition to an array for easier manipulation
      const aliasEntries = Array.isArray(viteConf.resolve.alias)
        ? [...viteConf.resolve.alias]
        : Object.entries(viteConf.resolve.alias).map(([find, replacement]) => ({ find, replacement }));

      // For client builds, configure resolve conditions to prefer browser exports
      if (isClient) {
        // Configure Vite to prefer browser exports from package.json
        if (!viteConf.resolve.conditions) {
          viteConf.resolve.conditions = [];
        }
        // Prefer browser exports over default
        if (!viteConf.resolve.conditions.includes('browser')) {
          viteConf.resolve.conditions.unshift('browser');
        }
        
        const nodeModulesStub = path.resolve(__dirname, './src/utils/node-stub.js').replace(/\\/g, '/');
        
        // Ensure Node.js modules are not bundled in browser
        const nodeModules = ['fs', 'crypto', 'vm', 'path', 'os', 'util'];
        nodeModules.forEach(moduleName => {
          const idx = aliasEntries.findIndex(
            entry => !(entry.find instanceof RegExp) && entry.find === moduleName
          );
          if (idx >= 0) {
            aliasEntries[idx] = { find: moduleName, replacement: nodeModulesStub };
          } else {
            aliasEntries.push({ find: moduleName, replacement: nodeModulesStub });
          }
        });
      }

      const srcPath = path.resolve(__dirname, './src').replace(/\\/g, '/');
      const enginePath = path
        .resolve(__dirname, '../packages/calculation-engine/src/index.ts')
        .replace(/\\/g, '/');
      const engineCorePath = path
        .resolve(__dirname, '../packages/calculation-engine/src')
        .replace(/\\/g, '/');

      const upsertAlias = (find, replacement) => {
        // Handle regex patterns
        if (find instanceof RegExp) {
          const idx = aliasEntries.findIndex((entry) => 
            entry.find instanceof RegExp && entry.find.source === find.source
          );
          if (idx >= 0) {
            aliasEntries[idx] = { find, replacement };
          } else {
            aliasEntries.push({ find, replacement });
          }
        } else {
          // Handle string patterns
          const idx = aliasEntries.findIndex((entry) => 
            !(entry.find instanceof RegExp) && entry.find === find
          );
          if (idx >= 0) {
            aliasEntries[idx] = { find, replacement };
          } else {
            aliasEntries.push({ find, replacement });
          }
        }
      };

      upsertAlias('@', srcPath);
      upsertAlias(/^@\/(.*)$/, `${srcPath}/$1`);
      upsertAlias('@tradespro/calculation-engine', enginePath);
      // Support subpath exports for calculation-engine (e.g., /core/tables.browser)
      upsertAlias(/^@tradespro\/calculation-engine\/(.+)$/, `${engineCorePath}/$1`);
      
      // For browser builds, use browser-safe entry point for core-engine
      if (isClient) {
        const coreEngineBrowserPath = path
          .resolve(__dirname, '../packages/core-engine/src/index.browser.ts')
          .replace(/\\/g, '/');
        const signatureVerifierBrowserPath = path
          .resolve(__dirname, '../packages/core-engine/src/plugins/signatureVerifier.browser.ts')
          .replace(/\\/g, '/');
        
        upsertAlias('@tradespro/core-engine', coreEngineBrowserPath);
        const signatureVerifierPath = path
          .resolve(__dirname, '../packages/core-engine/src/plugins/signatureVerifier')
          .replace(/\\/g, '/');
        upsertAlias(signatureVerifierPath, signatureVerifierBrowserPath);
        
        console.log('[Quasar Config] Browser alias @tradespro/core-engine ->', coreEngineBrowserPath);
        console.log('[Quasar Config] Browser alias signatureVerifier ->', signatureVerifierBrowserPath);
      }

      viteConf.resolve.alias = aliasEntries;

      console.log('[Quasar Config] Alias @ ->', srcPath);
      console.log('[Quasar Config] Alias @/ ->', `${srcPath}/$1`);
      console.log('[Quasar Config] Alias @tradespro/calculation-engine ->', enginePath);
    },

    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node16'
      },

      vueRouterMode: 'hash',
    },

    devServer: {
      host: '0.0.0.0',
      open: true, // opens browser window automatically
      port: 3000 // or a port of your choice
    },

    framework: {
      config: {
        // Enhanced dark mode palette for better contrast
        dark: true, // Enable dark mode support
        brand: {
          primary: '#1976d2',
          secondary: '#26a69a',
          accent: '#9c27b0',
          dark: '#121212', // Darker background for better contrast
          positive: '#21ba45',
          negative: '#c10015',
          info: '#31ccec',
          warning: '#f2c037'
        }
      },
      plugins: ['Notify', 'Loading', 'Dialog']
    },

    animations: [],

    ssr: {
      pwa: false,
      prodPort: 3000,
      middlewares: [
        'render'
      ]
    },

    pwa: {
      workboxMode: 'generateSW',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false,
    },

    cordova: {},

    capacitor: {
      hideSplashscreen: true
    },

    electron: {
      inspectPort: 5858,

      bundler: 'packager',

      packager: {},

      builder: {
        appId: 'tradespro-frontend'
      }
    },

    bex: {
      contentScripts: [
        'my-content-script'
      ],
    }
  }
});