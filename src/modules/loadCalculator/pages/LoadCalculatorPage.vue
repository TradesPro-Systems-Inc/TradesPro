<template>
  <q-page class="q-pa-md">
    <h4>🏠 Residential Load Calculator (CEC 2024)</h4>

    <q-form @submit.prevent="load.compute">
      <div class="row q-col-gutter-md">
        <!-- Building Areas Section -->
        <div class="col-12">
          <div class="text-h6">Building Areas (Rule 8-110)</div>
        </div>
        <div class="col-12 col-md-4">
          <q-input 
            v-model.number="load.input.groundFloorArea" 
            label="Ground Floor Area (m²)" 
            type="number"
            hint="Base area for calculation"
          />
        </div>
        <div class="col-12 col-md-4">
          <q-input 
            v-model.number="load.input.upperFloorArea" 
            label="Upper Floor Area (m²)" 
            type="number"
            hint="100% counted"
          />
        </div>
        <div class="col-12 col-md-4">
          <q-input 
            v-model.number="load.input.basementArea" 
            label="Basement Area (m²)" 
            type="number"
            hint="75% counted if height > 1.8m"
          />
        </div>
        <div class="col-12 col-md-4">
          <q-input 
            v-model.number="load.input.basementHeight" 
            label="Basement Height (m)" 
            type="number"
            hint="For basement area calculation"
          />
        </div>

        <!-- Electrical System Parameters -->
        <div class="col-12">
          <div class="text-h6">Electrical System (Rule 8-100)</div>
        </div>
        <div class="col-12 col-md-4">
          <q-select
            v-model="load.input.voltage"
            :options="[120, 208, 240, 277, 347, 416, 480, 600]"
            label="System Voltage"
            hint="Standard voltages per Rule 8-100"
          />
        </div>
        <div class="col-12 col-md-4">
          <q-select
            v-model="load.input.circuitType"
            :options="[
              { label: 'Feeder', value: 'feeder' },
              { label: 'Branch Circuit', value: 'branch' }
            ]"
            label="Circuit Type"
          />
        </div>
        <div class="col-12 col-md-4">
          <q-input
            v-model.number="load.input.voltageDropPercent"
            label="Voltage Drop %"
            type="number"
            hint="Max 3% for feeders (Rule 8-102)"
          />
        </div>

        <!-- Heating and Cooling -->
        <div class="col-12">
          <div class="text-h6">Heating and Cooling (Rule 62-118)</div>
        </div>
        <div class="col-12 col-md-6">
          <q-input 
            v-model.number="load.input.spaceHeatingWatts" 
            label="Space Heating Load (W)" 
            type="number"
          />
        </div>
        <div class="col-12 col-md-6">
          <q-input 
            v-model.number="load.input.acWatts" 
            label="Air Conditioning Load (W)" 
            type="number"
          />
        </div>
        <div class="col-12">
          <q-toggle
            v-model="load.input.interlockedHeatAC"
            label="Heat and AC are interlocked (Rule 8-106 3)"
          />
          <q-toggle
            v-model="load.input.hasThermostatControl"
            label="Automatic thermostatic control in each room (Rule 62-118 3)"
          />
        </div>

        <!-- Electric Range -->
        <div class="col-12">
          <div class="text-h6">Electric Range (Rule 8-200 1.a.iv)</div>
        </div>
        <div class="col-12">
          <q-btn
            color="primary"
            label="Add Range"
            @click="addRange"
            class="q-mb-md"
          />
          <div v-for="(range, index) in load.input.electricRanges" :key="index" class="q-mb-sm">
            <q-input
              v-model.number="range.ratingKW"
              label="Range Rating (kW)"
              type="number"
              class="q-mr-md"
              style="display: inline-block; width: 200px"
            />
            <q-btn
              flat
              color="negative"
              icon="delete"
              @click="removeRange(index)"
            />
          </div>
        </div>

        <!-- Water Heating -->
        <div class="col-12">
          <div class="text-h6">Water Heating (Rule 8-200 1.a.v)</div>
        </div>
        <div class="col-12 col-md-6">
          <q-input
            v-model.number="load.input.waterHeaterWatts"
            label="Water Heater Load (W)"
            type="number"
            hint="100% demand factor for tankless"
          />
        </div>

        <!-- EV Charging -->
        <div class="col-12">
          <div class="text-h6">EV Charging (Rule 8-200 1.a.vi)</div>
        </div>
        <div class="col-12 col-md-6">
          <q-input
            v-model.number="load.input.evChargerWatts"
            label="EV Charger Load (W)"
            type="number"
          />
        </div>
        <div class="col-12">
          <q-toggle
            v-model="load.input.hasEVEMS"
            label="EV Energy Management System installed (Rule 8-106 10)"
          />
        </div>

        <!-- Other Loads -->
        <div class="col-12">
          <div class="text-h6">Other Loads >1500W (Rule 8-200 1.a.vii)</div>
        </div>
        <div class="col-12">
          <q-btn
            color="primary"
            label="Add Load"
            @click="addOtherLoad"
            class="q-mb-md"
          />
          <div v-for="(load, index) in load.input.otherLoads" :key="index" class="q-mb-sm">
            <q-input
              v-model="load.name"
              label="Load Name"
              class="q-mr-md"
              style="display: inline-block; width: 200px"
            />
            <q-input
              v-model.number="load.watts"
              label="Watts"
              type="number"
              class="q-mr-md"
              style="display: inline-block; width: 200px"
            />
            <q-btn
              flat
              color="negative"
              icon="delete"
              @click="removeOtherLoad(index)"
            />
          </div>
        </div>

        <!-- Submit Button -->
        <div class="col-12">
          <q-btn
            label="Calculate"
            type="submit"
            color="primary"
            class="q-mt-lg"
          />
        </div>
      </div>
    </q-form>

    <!-- Results Display -->
    <div v-if="load.result" class="q-mt-lg">
      <q-card>
        <q-card-section>
          <div class="text-h6">Results</div>
          <div><strong>Living Area:</strong> {{ load.result.livingArea.toFixed(1) }} m²</div>
          <div><strong>Base Load:</strong> {{ load.result.baseLoad.toFixed(0) }} W</div>
          <div><strong>Heat Load:</strong> {{ load.result.heatLoad.toFixed(0) }} W</div>
          <div><strong>AC Load:</strong> {{ load.result.acLoad.toFixed(0) }} W</div>
          <div><strong>Range Load:</strong> {{ load.result.rangeLoad.toFixed(0) }} W</div>
          <div><strong>Water Heater Load:</strong> {{ load.result.waterHeaterLoad.toFixed(0) }} W</div>
          <div><strong>EV Load:</strong> {{ load.result.evLoad.toFixed(0) }} W</div>
          <div><strong>Other Loads:</strong> {{ load.result.otherLoad.toFixed(0) }} W</div>
          <div><strong>Total Load:</strong> {{ load.result.totalWatts.toFixed(0) }} W</div>
          <div><strong>Service Size:</strong> {{ load.result.serviceAmps }} A</div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Error Display -->
    <div v-if="load.error" class="q-mt-md text-negative">
      {{ load.error }}
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useLoadStore } from '../stores/useLoadStore'
//import type { LoadInput } from '../utils/loadCalc'  

const load = useLoadStore()

function addRange() {
  load.input.electricRanges.push({ ratingKW: 12 })
}

function removeRange(index: number) {
  load.input.electricRanges.splice(index, 1)
}

function addOtherLoad() {
  load.input.otherLoads.push({ name: '', watts: 0 })
}

function removeOtherLoad(index: number) {
  load.input.otherLoads.splice(index, 1)
}
</script>

<style scoped>
.row > div {
  margin-bottom: 8px;
}
.text-h6 {
  margin-top: 16px;
  margin-bottom: 8px;
  color: #1976d2;
}
</style>