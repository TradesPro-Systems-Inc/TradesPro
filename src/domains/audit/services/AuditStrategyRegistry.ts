type Strategy = {
  name: string;
  config: any;
  version: string;
  region: string;
  timestamp: string;
};

const registry: Strategy[] = [];

export function registerStrategy(
  name: string,
  config: any,
  version = "v1.0.0",
  region = "CA"
): void {
  const existing = registry.find(s => s.name === name);
  const entry: Strategy = {
    name,
    config,
    version,
    region,
    timestamp: new Date().toISOString()
  };

  if (existing) {
    Object.assign(existing, entry);
  } else {
    registry.push(entry);
  }
}

export function getStrategy(name: string): Strategy | undefined {
  return registry.find(s => s.name === name);
}

export function listStrategies(): string[] {
  return registry.map(s => s.name);
}

export function exportStrategy(name: string): string {
  const strategy = getStrategy(name);
  if (!strategy) throw new Error(`Strategy "${name}" not found`);
  return JSON.stringify(strategy, null, 2);
}

export function exportAllStrategies(): string {
  return JSON.stringify(registry, null, 2);
}
