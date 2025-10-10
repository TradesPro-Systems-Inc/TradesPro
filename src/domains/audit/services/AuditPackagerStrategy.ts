import { AuditPackagerConfig } from "@/config/AuditPackagerConfig";

type Strategy = typeof AuditPackagerConfig;

const strategies: Record<string, Strategy> = {
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

let currentStrategy: Strategy = strategies.craAudit;

export function getCurrentStrategy(): Strategy {
  return currentStrategy;
}

export function setStrategy(name: keyof typeof strategies): void {
  currentStrategy = strategies[name];
}

export function listAvailableStrategies(): string[] {
  return Object.keys(strategies);
}
