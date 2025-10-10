import { exportAllStrategies } from "./AuditStrategyRegistry";

const remoteEndpoint = "https://your-platform.com/api/audit-strategy-sync";

export async function pushStrategiesToRemote(): Promise<void> {
  const payload = exportAllStrategies();

  try {
    const res = await fetch(remoteEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload
    });

    if (!res.ok) throw new Error(`Push failed: ${res.status}`);
    console.info("✅ Strategies pushed to remote successfully");
  } catch (err) {
    console.error("❌ Strategy push error:", err);
  }
}

export async function fetchStrategiesFromRemote(): Promise<any> {
  try {
    const res = await fetch(remoteEndpoint);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const data = await res.json();
    console.info("✅ Strategies fetched from remote:", data);
    return data;
  } catch (err) {
    console.error("❌ Strategy fetch error:", err);
    return null;
  }
}

export function compareStrategies(local: any[], remote: any[]): string[] {
  const diffs: string[] = [];

  for (const r of remote) {
    const match = local.find(l => l.name === r.name);
    if (!match) {
      diffs.push(`🆕 Remote strategy "${r.name}" not found locally`);
    } else if (match.version !== r.version) {
      diffs.push(
        `🔄 Strategy "${r.name}" version mismatch: local=${match.version}, remote=${r.version}`
      );
    }
  }

  return diffs;
}
