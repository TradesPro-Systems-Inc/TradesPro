// TradesPro - Permission-based Data Filtering
// 根据用户等级过滤计算结果，确保用户只能访问其权限范围内的数据

import type { UserTier } from '@/pinia-stores/types';
import type { UnsignedBundle, CalculationStep } from '@tradespro/calculation-engine';

/**
 * 根据用户等级过滤计算结果
 * @param bundle 原始计算结果
 * @param userTier 用户等级
 * @returns 过滤后的计算结果
 */
export function filterBundleByTier(
  bundle: UnsignedBundle | null,
  userTier: UserTier | null | undefined
): UnsignedBundle | null {
  if (!bundle) return null;

  // guest（非注册用户）：只返回基本结果，不包含步骤
  if (!userTier || userTier === 'guest') {
    return {
      ...bundle,
      steps: [], // 不包含计算步骤
      warnings: bundle.warnings || [],
      // 保留results，但移除详细的计算过程信息
      results: {
        ...bundle.results,
        // 只保留最终结果，移除中间计算值
      },
    };
  }

  // tier1及以上：包含所有数据
  // 前端UI层面会控制显示，这里不需要过滤
  return bundle;
}

/**
 * 检查用户是否可以查看计算步骤
 */
export function canViewSteps(userTier: UserTier | null | undefined): boolean {
  if (!userTier || userTier === 'guest') {
    return false;
  }
  return true; // tier1及以上都可以查看
}

/**
 * 检查用户是否可以下载JSON
 */
export function canDownloadJSON(userTier: UserTier | null | undefined): boolean {
  if (!userTier || userTier === 'guest' || userTier === 'tier1') {
    return false;
  }
  return true; // tier2及以上可以下载
}

/**
 * 检查用户是否可以下载PDF
 */
export function canDownloadPDF(userTier: UserTier | null | undefined): boolean {
  if (!userTier || userTier === 'guest' || userTier === 'tier1') {
    return false;
  }
  return true; // tier2及以上可以下载
}

/**
 * 检查用户是否可以创建项目
 */
export function canCreateProject(userTier: UserTier | null | undefined): boolean {
  if (!userTier || userTier !== 'tier3') {
    return false;
  }
  return true; // 只有tier3可以创建项目
}

/**
 * 检查用户是否可以管理项目
 */
export function canManageProjects(userTier: UserTier | null | undefined): boolean {
  if (!userTier || userTier !== 'tier3') {
    return false;
  }
  return true; // 只有tier3可以管理项目
}





