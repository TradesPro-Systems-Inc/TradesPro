<script setup lang="ts">
import { computed } from 'vue'
import DeviceListInput from '../components/DeviceListInput.vue'
import { useLoadStore } from '../stores/useLoadStore'

const load = useLoadStore()

// 合并所有设备用于 DeviceListInput
const allDevices = computed({
  get: () => [
    ...load.input.ranges,
    ...load.input.waterHeaters,
    ...load.input.evChargers,
    ...load.input.otherAppliances
  ],
  set: (val) => {
    load.input.ranges = val.filter(d => d.type === "range")
    load.input.waterHeaters = val.filter(d => d.type === "waterHeater")
    load.input.evChargers = val.filter(d => d.type === "ev")
    load.input.otherAppliances = val.filter(d => d.type === "appliance")
  }
})

function computeLoad() {
  return load.total
}
</script>

<template>
  <q-page class="q-pa-md">
    <h4>🏠 Residential Load Calculator (CEC 2024)</h4>

    <q-form @submit.prevent="computeLoad">
      <!-- Building Areas -->
      <div class="row q-col-gutter-md">
        <div class="col-12 text-h6">Building Areas</div>
        <div class="col-12 col-md-4">
          <q-input v-model.number="load.input.groundFloorArea" label="Ground Floor Area (m²)" type="number" />
        </div>
        <div class="col-12 col-md-4">
          <q-input v-model.number="load.input.upperFloorArea" label="Upper Floor Area (m²)" type="number" />
        </div>
        <div class="col-12 col-md-4">
          <q-input v-model.number="load.input.basementArea" label="Basement Area (m²)" type="number" />
        </div>
      </div>

      <!-- Heating & Cooling -->
      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-12 text-h6">Heating and Cooling</div>
        <div class="col-12 col-md-6">
          <q-input v-model.number="load.heatingLoad" label="Space Heating Load (W)" type="number" />
        </div>
      </div>

      <!-- Device List -->
      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-12 text-h6">Electrical Devices</div>
        <div class="col-12">
          <DeviceListInput v-model="allDevices" v-model:hasEvEms="load.input.hasEVEMS" />

        </div>
      </div>

      <!-- Result -->
      <div class="row q-col-gutter-md q-mt-md" v-if="load">
        <div class="col-12">
          <q-card>
            <q-card-section>
              <div class="text-h6">Load Summary</div>
              <div><strong>Base Load:</strong> {{ load.baseLoad }} W</div>
              <div><strong>Heating/AC:</strong> {{ load.heatingLoad }} W</div>
              <div><strong>Ranges:</strong> {{ load.rangeLoad }} W</div>
              <div><strong>Water Heaters:</strong> {{ load.waterHeaterLoad }} W</div>
              <div><strong>EVs:</strong> {{ load.evLoad }} W</div>
              <div><strong>Other Appliances:</strong> {{ load.otherAppLoad }} W</div>
              <div><strong>Total Load:</strong> {{ load.total }} W</div>
              <div><strong>Final Load:</strong> {{ load.total.finalLoad }} W</div>
              <div><strong>Current:</strong> {{ load.total.current }} A</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div class="row q-mt-md">
        <div class="col-12">
          <q-btn label="Calculate" type="submit" color="primary" />
        </div>
      </div>
    </q-form>
  </q-page>
</template>
