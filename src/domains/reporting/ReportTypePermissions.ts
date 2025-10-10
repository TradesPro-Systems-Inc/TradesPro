export type Role = "admin" | "consultant" | "auditor" | "client";

export type ReportTypePermission = {
  reportTypeId: string;
  allowedRoles: Role[];
  region?: "CA" | "US" | "HK" | "CN";
  enabled?: boolean;
};

const permissions: ReportTypePermission[] = [
  {
    reportTypeId: "electrical",
    allowedRoles: ["admin", "consultant"],
    region: "CA",
    enabled: true
  },
  {
    reportTypeId: "cra",
    allowedRoles: ["admin", "auditor"],
    region: "CA",
    enabled: true
  },
  {
    reportTypeId: "plumbing",
    allowedRoles: ["admin", "consultant"],
    region: "US",
    enabled: true
  },
  {
    reportTypeId: "landscape",
    allowedRoles: ["admin", "consultant"],
    region: "CA",
    enabled: false
  },
  {
    reportTypeId: "roofing",
    allowedRoles: ["admin", "consultant"],
    region: "US",
    enabled: true
  }
];

export function isReportTypeAllowed(
  reportTypeId: string,
  role: Role,
  region?: string
): boolean {
  const perm = permissions.find(p => p.reportTypeId === reportTypeId);
  if (!perm || !perm.enabled) return false;
  if (region && perm.region && perm.region !== region) return false;
  return perm.allowedRoles.includes(role);
}

export function listAllowedReportTypes(role: Role, region?: string): string[] {
  return permissions
    .filter(
      p =>
        p.enabled &&
        p.allowedRoles.includes(role) &&
        (!region || !p.region || p.region === region)
    )
    .map(p => p.reportTypeId);
}
