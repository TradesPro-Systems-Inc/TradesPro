import { defineStore } from "pinia";
import { ref } from "vue";
import type { AuditLog } from "../domains/calculation/services/engines/modules/auditLogger";
// import { useStorage } from "@vueuse/core"; // Removed due to error

export const useAuditStore = defineStore("audit", () => {
  // Use localStorage for persistence
  // const audit = useStorage<AuditLog | null>("audit-log", null); // Commented out due to error
  const audit = ref<AuditLog | null>(null); // Reverted to ref for now

  function setAudit(log: AuditLog) {
    audit.value = log;
  }

  function clearAudit() {
    audit.value = null;
  }

  function updateAudit(partial: Partial<AuditLog>) {
    if (audit.value) {
      audit.value = { ...audit.value, ...partial };
    }
  }

  return { audit, setAudit, clearAudit, updateAudit };
});
