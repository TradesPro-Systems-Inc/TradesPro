type Strategy = {
  name: string;
  config: any;
  version: string;
  region: string;
  timestamp: string;
};

export function resolveConflicts(
  local: Strategy[],
  remote: Strategy[],
  mode: "preferLocal" | "preferRemote" = "preferRemote"
): Strategy[] {
  const merged: Strategy[] = [];

  for (const r of remote) {
    const match = local.find(l => l.name === r.name);
    if (!match) {
      merged.push(r); // remote-only strategy
    } else {
      const chosen = mode === "preferRemote" ? r : match;
      merged.push({
        ...chosen,
        config: {
          ...match.config,
          ...r.config // field-level merge
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  // Include local-only strategies
  for (const l of local) {
    if (!remote.find(r => r.name === l.name)) {
      merged.push(l);
    }
  }

  return merged;
}
