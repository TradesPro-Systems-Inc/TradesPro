import { ref, readonly } from "vue";
import { useQuasar } from "quasar";
import { useAuditStore } from "@/domains/audit/stores/auditStore";

// ✅ 统一从 domain/calculation/services 和 domain/audit/services 导入
import { estimateDwellingLoad } from "@/domains/calculation/services/load";
import { resolveVoltageProfile } from "@/domains/calculation/services/voltage";
import { calculateCurrent } from "@/domains/calculation/services/current";
import { selectPanel } from "@/domains/calculation/services/panel";
import { generateBreakerLayout } from "@/domains/calculation/services/breakerLayout";
import { correctAmpacity } from "@/domains/calculation/services/ampacity";
import { generateAuditLog } from "@/domains/audit/services/auditLogger";

import type { DwellingParams } from "@/types/power";
import type { AuditLog } from "@/domains/audit/types";

export function useLoadCalculator() {
  const auditStore = useAuditStore();
  const $q = useQuasar();

  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  const runCalculation = async (
    form: DwellingParams
  ): Promise<AuditLog | null> => {
    isLoading.value = true;
    error.value = null;

    try {
      // 1. Unify input units
      const processedForm = {
        ...form,
        rangeLoadW: form.rangeKw * 1000,
        evLoadW: form.hasEV ? form.evLoad : 0,
        acLoadW: form.hasAC ? form.acLoad : 0,
        heatingLoadW: form.hasHeating ? form.heatingLoad : 0
      };

      // 2. Call core calculation services
      const voltageProfile = resolveVoltageProfile(form.dwellingType);
      const loadResult = estimateDwellingLoad(processedForm);
      const feederCurrentResult = calculateCurrent(
        loadResult.finalLoad / 1000,
        voltageProfile
      );

      // 3. Correct and select
      // Use the dynamic ampacity engine
      const correctedAmpacityResult = correctAmpacity({
        baseAmpacity: feederCurrentResult.feederCurrent,
        factors: {
          temperature: 0.88,
          conductorCount: 0.85,
          cableContact: 1.0,
          cableCount: 1.0
        }
      });

      const wireSize = "2 AWG";
      const wireMaterial = "copper";

      const panel = selectPanel(loadResult.finalLoad, form.dwellingType);
      const breakers = generateBreakerLayout([
        {
          name: "Range",
          load: processedForm.rangeLoadW,
          type: "double" as const
        },
        ...(form.hasEV
          ? [{ name: "EV Charger", load: form.evLoad, type: "double" as const }]
          : []),
        ...(form.hasAC
          ? [{ name: "AC Unit", load: form.acLoad, type: "double" as const }]
          : [])
      ]);

      // 4. Generate audit log
      const audit = generateAuditLog(
        {
          dwellingParams: form,
          voltageProfile,
          loadResult,
          feederCurrent: {
            value: feederCurrentResult.feederCurrent,
            formula: feederCurrentResult.formula
          },
          correctedAmpacity: {
            value: correctedAmpacityResult.correctedAmpacity,
            correctionFactors: correctedAmpacityResult.appliedFactors,
            formula: correctedAmpacityResult.formula
          }
        },
        {
          wireSize,
          wireMaterial,
          panelRating: panel.panelRating,
          breakerLayout: panel.breakerLayout,
          breakerDistribution: breakers
        }
      );

      auditStore.setAudit(audit);
      $q.notify({ type: "positive", message: "Calculation successful!" });
      return audit;
    } catch (e) {
      error.value = e as Error;
      console.error("Calculation failed:", e);
      $q.notify({
        type: "negative",
        message: `Calculation failed: ${(e as Error).message || "Unknown error"}`
      });
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    runCalculation
  };
}
