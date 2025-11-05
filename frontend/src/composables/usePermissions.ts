// TradesPro - Permission System Composable
// 基于用户等级（tier）的权限控制系统

import { computed } from 'vue';
import { useUserStore } from '../pinia-stores/user';
import type { UserTier } from '../pinia-stores/types';

/**
 * 权限功能定义
 */
export interface Permissions {
  // 计算相关权限
  canCalculate: boolean;              // 是否可以执行计算
  canViewSteps: boolean;              // 是否可以查看计算步骤
  canDownloadJSON: boolean;           // 是否可以下载JSON文件
  canDownloadPDF: boolean;            // 是否可以下载PDF文件
  
  // 项目相关权限
  canViewProjects: boolean;           // 是否可以查看项目列表
  canCreateProject: boolean;          // 是否可以创建项目
  canEditProject: boolean;            // 是否可以编辑项目
  canDeleteProject: boolean;          // 是否可以删除项目
  canManageProjects: boolean;         // 是否可以管理项目（包含所有项目操作）
  
  // 其他功能权限
  canSaveCalculations: boolean;       // 是否可以保存计算结果
  canShareCalculations: boolean;      // 是否可以分享计算结果
  canExportReports: boolean;          // 是否可以导出报告
}

/**
 * 根据用户等级获取权限配置
 */
function getPermissionsByTier(tier: UserTier | null | undefined): Permissions {
  // 默认值：guest（非注册用户）
  if (!tier || tier === 'guest') {
    return {
      // 非注册用户：只能看到基本计算结果
      canCalculate: true,
      canViewSteps: false,
      canDownloadJSON: false,
      canDownloadPDF: false,
      canViewProjects: false,
      canCreateProject: false,
      canEditProject: false,
      canDeleteProject: false,
      canManageProjects: false,
      canSaveCalculations: false,
      canShareCalculations: false,
      canExportReports: false,
    };
  }

  // Tier 1 用户：可以看到计算步骤，但不能下载文件
  if (tier === 'tier1') {
    return {
      canCalculate: true,
      canViewSteps: true,
      canDownloadJSON: false,
      canDownloadPDF: false,
      canViewProjects: false,
      canCreateProject: false,
      canEditProject: false,
      canDeleteProject: false,
      canManageProjects: false,
      canSaveCalculations: true,
      canShareCalculations: false,
      canExportReports: false,
    };
  }

  // Tier 2 用户：可以下载JSON和PDF，但不能管理项目
  if (tier === 'tier2') {
    return {
      canCalculate: true,
      canViewSteps: true,
      canDownloadJSON: true,
      canDownloadPDF: true,
      canViewProjects: true,
      canCreateProject: false,
      canEditProject: false,
      canDeleteProject: false,
      canManageProjects: false,
      canSaveCalculations: true,
      canShareCalculations: true,
      canExportReports: true,
    };
  }

  // Tier 3 用户：所有权限
  if (tier === 'tier3') {
    return {
      canCalculate: true,
      canViewSteps: true,
      canDownloadJSON: true,
      canDownloadPDF: true,
      canViewProjects: true,
      canCreateProject: true,
      canEditProject: true,
      canDeleteProject: true,
      canManageProjects: true,
      canSaveCalculations: true,
      canShareCalculations: true,
      canExportReports: true,
    };
  }

  // 默认返回guest权限
  return getPermissionsByTier('guest');
}

/**
 * 权限检查 Composable
 */
export function usePermissions() {
  const userStore = useUserStore();
  
  // 获取当前用户等级
  const userTier = computed<UserTier | null>(() => {
    if (!userStore.isAuthenticated) {
      return 'guest';
    }
    return userStore.currentUser?.tier || 'tier1'; // 默认注册用户为tier1
  });

  // 计算权限
  const permissions = computed<Permissions>(() => {
    return getPermissionsByTier(userTier.value);
  });

  // 便捷的权限检查函数
  const can = (permission: keyof Permissions): boolean => {
    return permissions.value[permission];
  };

  // 检查是否为注册用户
  const isAuthenticated = computed(() => userStore.isAuthenticated);

  // 检查是否为特定等级
  const isTier = (tier: UserTier): boolean => {
    return userTier.value === tier;
  };

  // 检查是否至少为特定等级（等级顺序：guest < tier1 < tier2 < tier3）
  const isAtLeastTier = (minTier: UserTier): boolean => {
    const tierOrder: Record<UserTier, number> = {
      guest: 0,
      tier1: 1,
      tier2: 2,
      tier3: 3,
    };
    
    const currentTier = userTier.value || 'guest';
    return tierOrder[currentTier] >= tierOrder[minTier];
  };

  return {
    // State
    userTier,
    permissions,
    isAuthenticated,

    // Methods
    can,
    isTier,
    isAtLeastTier,
  };
}
