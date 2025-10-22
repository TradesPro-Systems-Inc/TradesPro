// TradesPro Frontend - Font Size Control Composable
// Font size adjustment with small/medium/large options

import { ref, computed, watch } from 'vue';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

export type FontSize = 'small' | 'medium' | 'large';

export function useFontSize() {
  const fontSize = ref<FontSize>('medium');
  
  // Font size configuration
  // Note: Names will be translated in the component using i18n
  const fontSizeConfig = {
    small: {
      key: 'small',  // Translation key: fontSize.small
      scale: 0.875,
      class: 'font-size-small'
    },
    medium: {
      key: 'medium',  // Translation key: fontSize.medium
      scale: 1.0,
      class: 'font-size-medium'
    },
    large: {
      key: 'large',  // Translation key: fontSize.large
      scale: 1.125,
      class: 'font-size-large'
    }
  };

  // 当前字体配置
  const currentConfig = computed(() => fontSizeConfig[fontSize.value]);
  
  // CSS变量值
  const cssScale = computed(() => currentConfig.value.scale);
  
  // 应用字体大小到文档
  function applyFontSize(size: FontSize) {
    fontSize.value = size;
    
    // 设置CSS变量
    document.documentElement.style.setProperty('--font-scale', cssScale.value.toString());
    document.documentElement.className = document.documentElement.className
      .replace(/font-size-\w+/g, '')
      .trim() + ` ${currentConfig.value.class}`;
  }

  // 保存到本地存储
  async function saveFontSize(size: FontSize) {
    try {
      const value = JSON.stringify(size);
      if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key: 'font-size', value });
      } else {
        localStorage.setItem('font-size', value);
      }
    } catch (error) {
      console.warn('保存字体大小失败:', error);
    }
  }

  // 从本地存储加载
  async function loadFontSize() {
    try {
      let value: string | null = null;
      
      if (Capacitor.isNativePlatform()) {
        const result = await Preferences.get({ key: 'font-size' });
        value = result.value;
      } else {
        value = localStorage.getItem('font-size');
      }
      
      if (value) {
        const savedSize = JSON.parse(value) as FontSize;
        if (Object.keys(fontSizeConfig).includes(savedSize)) {
          applyFontSize(savedSize);
        }
      }
    } catch (error) {
      console.warn('加载字体大小失败:', error);
    }
  }

  // 监听字体大小变化
  watch(fontSize, (newSize) => {
    applyFontSize(newSize);
    saveFontSize(newSize);
  });

  // 初始化
  loadFontSize();

  return {
    fontSize,
    fontSizeConfig,
    currentConfig,
    cssScale,
    applyFontSize,
    loadFontSize
  };
}
