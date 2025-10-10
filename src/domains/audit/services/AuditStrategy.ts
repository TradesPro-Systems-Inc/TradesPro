import { AuditPackagerConfig } from "@/config/AuditPackagerConfig";

type Strategy = typeof AuditPackagerConfig;
type StrategyName = "craAudit" | "consultantLite" | "devDebug";

export class AuditStrategyManager {
  private static strategies: Record<StrategyName, Strategy> = {
    craAudit: {
      ...AuditPackagerConfig,
      zipName: "cra-audit-package.zip",
      versionTag: "CRA-Audit-v1.0",
      include: {
        platformDimensions: true,
        reportTypes: true,
        syncLog: true,
        fieldMapping: true,
        permissions: true,
        aiModels: false
      }
    },
    consultantLite: {
      ...AuditPackagerConfig,
      zipName: "consultant-lite-package.zip",
      versionTag: "Consultant-v1.0",
      include: {
        platformDimensions: true,
        reportTypes: true,
        syncLog: false,
        fieldMapping: false,
        permissions: false,
        aiModels: false
      }
    },
    devDebug: {
      ...AuditPackagerConfig,
      zipName: "dev-debug-package.zip",
      versionTag: "Dev-Debug-v1.0",
      include: {
        platformDimensions: true,
        reportTypes: true,
        syncLog: true,
        fieldMapping: true,
        permissions: true,
        aiModels: true
      }
    }
  };

  private currentStrategyName: StrategyName = "craAudit";

  public getCurrentStrategy(): Strategy {
    return AuditStrategyManager.strategies[this.currentStrategyName];
  }

  public setStrategy(name: StrategyName): void {
    this.currentStrategyName = name;
  }

  public listAvailableStrategies(): StrategyName[] {
    return Object.keys(AuditStrategyManager.strategies) as StrategyName[];
  }
}
