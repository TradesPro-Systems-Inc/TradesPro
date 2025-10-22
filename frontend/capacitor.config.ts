import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tradespro.cecapp',
  appName: 'TradesPro CEC',
  webDir: 'dist/spa',
  
  server: {
    // 开发时允许从浏览器访问
    androidScheme: 'https',
    iosScheme: 'https'
  },

  plugins: {
    // 离线存储
    Preferences: {
      group: 'com.tradespro.storage'
    },
    
    // 文件系统访问
    Filesystem: {
      iosScheme: 'private'
    },
    
    // 分享功能
    Share: {
      // 默认配置
    },

    // 启动画面
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1976D2',
      showSpinner: true,
      spinnerColor: '#ffffff'
    }
  },

  // iOS 特定配置
  ios: {
    contentInset: 'always'
  },

  // Android 特定配置
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined
    }
  }
};

export default config;