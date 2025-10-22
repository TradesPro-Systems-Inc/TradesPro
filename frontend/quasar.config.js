/* eslint-env node */

import { configure } from 'quasar/wrappers';

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
      server: {
        fs: {
          // Allow serving files from one level up to the project root
          allow: ['..']
        }
      }
    },

    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node16'
      },

      vueRouterMode: 'hash',
    },

    devServer: {
      open: true, // opens browser window automatically
      port: 3000 // or a port of your choice
    },

    framework: {
      config: {},
      plugins: ['Notify', 'Loading']
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