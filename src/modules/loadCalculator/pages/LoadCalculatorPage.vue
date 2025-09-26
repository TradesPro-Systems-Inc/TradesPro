<template>
  <div class="results">
    <h2>Load Calculation Results</h2>
    <p>Total Load (VA): {{ result.totalVA }}</p>
    <p>Total Load (A): {{ result.totalAmps }}</p>

    <h3>Service / Panel Sizing</h3>
    <p>Recommended Panel Size: {{ result.panelSize }} A</p>
    <p>Recommended Breaker Size: {{ result.breakerSize }} A</p>
    <p>Feeder Cable: {{ result.feederCable }}</p>
  </div>
</template>

<script setup lang="ts">
import { useLoadStore } from '../stores/useLoadStore'
import { computed } from 'vue'

const store = useLoadStore()

// Wrap results into computed
const result = computed(() => {
  const totalVA = store.result?.finalLoad || 0
  const volts = 240
  const totalAmps = totalVA / volts

  // --- Panel Size Selection ---
  const standardPanels = [100, 125, 150, 200, 225, 400]
  const panelSize = standardPanels.find(size => size >= totalAmps) || 400

  // --- Breaker Size Selection (simplified per CEC 8-104) ---
  const standardBreakers = [15, 20, 30, 40, 60, 100, 125, 150, 200, 225, 400]
  const breakerSize = standardBreakers.find(size => size >= totalAmps * 1.25) || 400
  // (1.25 factor = continuous load margin)

  // --- Feeder Cable Lookup (Table 2 + Table 4) ---
  // NOTE: Replace with actual JSON lookups
  function lookupCable(amps: number): string {
    const candidates = [
      { size: 'AWG #3 Cu', ampacity: 100 },
      { size: 'AWG #1 Cu', ampacity: 130 },
      { size: '2/0 Cu', ampacity: 195 },
      { size: '3/0 Cu', ampacity: 225 },
      { size: '250 kcmil Cu', ampacity: 255 },
      { size: '350 kcmil Cu', ampacity: 310 }
    ]
    const match = candidates.find(c => c.ampacity >= amps)
    return match ? `${match.size} (ampacity ${match.ampacity}A)` : 'Size > 350 kcmil'
  }

  const feederCable = lookupCable(totalAmps)

  return {
    totalVA,
    totalAmps: totalAmps.toFixed(1),
    panelSize,
    breakerSize,
    feederCable
  }
})
</script>
<style scoped>
.results {
  border: 1px solid #ccc;
  padding: 16px;
  border-radius: 8px;
  background-color: #f9f9f9;
}

h2 {
  margin-bottom: 12px;
}

h3 {
  margin-top: 16px;
  margin-bottom: 8px;
}
</style>
