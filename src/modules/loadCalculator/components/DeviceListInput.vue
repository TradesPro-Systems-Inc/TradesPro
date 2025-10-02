<!-- src/modules/loadCalculator/components/DeviceListInput.vue -->
<template>
  <div>
    <!-- Add Device Buttons -->
    <div class="add-buttons q-mb-sm">
      <q-btn v-for="opt in DEVICE_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :color="opt.color" :icon="opt.icon"
        class="q-mr-sm q-mb-sm" @click="addDevice(opt.value)" />
    </div>

    <!-- 全局 EVEMS 开关 -->
    <q-toggle v-if="devices.some(d => d.type === 'ev')" v-model="evEmsModel" label="Has EV Energy Management System?"
      class="q-mt-md" />
    <!-- Device List -->
    <div v-for="(device, index) in devices" :key="device.id" class="q-mt-sm">
      <!-- Device Type -->
      <q-select v-model="device.type" :options="DEVICE_TYPE_OPTIONS" option-label="label" option-value="value"
        @update:model-value="onTypeChange(index)" />

      <!-- Heater Subtype -->
      <template v-if="device.type === 'heater'">
        <q-select :options="SUB_TYPE_MAP.heater" v-model="device.heaterType" label="Subtype" />
        <q-input v-model.number="device.kw" label="Value" type="number" />
      </template>

      <!-- AC Subtype -->
      <template v-if="device.type === 'ac'">
        <q-select :options="SUB_TYPE_MAP.ac.styles" v-model="device.style" label="Style"
          @update:model-value="device.voltage = (device.style === 'window' ? 120 : 240)" />
        <q-select :options="SUB_TYPE_MAP.ac.units" v-model="device.unit" label="Unit" />
        <q-input v-model.number="device.value" label="Value" type="number" />
        <q-input v-if="device.unit === 'current'" v-model.number="device.voltage" label="Voltage (V)" type="number" />
      </template>

      <!-- Water Heater Subtype -->
      <template v-if="device.type === 'waterHeater'">
        <q-select v-model="device.subType" :options="SUB_TYPE_MAP.waterHeater" label="Subtype" />
        <q-input v-model.number="device.kw" label="Water Heater Power (kW)" type="number" />
      </template>
      <!-- EV Auto Management -->
      <q-input v-if="device.type === 'ev'" v-model="device.kw" label="EV Charger Rating (kW)" />

      <!-- Range Input -->
      <q-input v-if="device.type === 'range'" v-model.number="device.kw" label="Range Rating (kW)" type="number"
        @update:model-value="organizeRanges" />

      <!-- Other Appliance Input -->
      <q-input v-if="device.type === 'appliance'" v-model.number="device.kw" label="Appliance Power > 1500 (W)"
        type="number" />

      <!-- Remove Device -->
      <q-btn flat icon="delete" color="negative" @click="removeDevice(index)" class="q-ml-sm" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { SUB_TYPE_MAP, type DeviceType, type Device, DEVICE_TYPE_OPTIONS } from '@/types/device'

const props = withDefaults(defineProps<{
  modelValue: Device[]
  hasEvEms: boolean // optional prop to bind EV EMS toggle
}>(), {
  hasEvEms: false
})

const emit = defineEmits<{
  (e: "update:modelValue", value: Device[]): void
  (e: "update:hasEvEms", value: boolean): void
}>()

// Local state
const devices = ref<Device[]>([...props.modelValue])
const evEmsModel = ref(props.hasEvEms)

// Sync local → parent
watch(devices, val => emit("update:modelValue", val), { deep: true })
watch(evEmsModel, val => emit("update:hasEvEms", val))

function addDevice(type: DeviceType) {
  const id = crypto.randomUUID()
  let newDevice: Device

  switch (type) {
    case 'ev':
      newDevice = { id, name: '', type, kw: 0, hasAutoManagement: evEmsModel.value }
      break
    case 'range':
      newDevice = { id, name: '', type, kw: 0 }
      break
    case 'waterHeater':
      newDevice = {
        id,
        name: '',
        type,
        kw: 0,
        subType: SUB_TYPE_MAP.waterHeater[0]
      }
      break
    case 'heater':
      newDevice = {
        id,
        name: '',
        type,
        kw: 0,
        heaterType: SUB_TYPE_MAP.heater[0]
      }
      break
    case 'ac':
      newDevice = {
        id,
        name: '',
        type,
        value: 0,
        unit: SUB_TYPE_MAP.ac.units[0],
        style: SUB_TYPE_MAP.ac.styles[0],
        voltage: 240
      }
      break

    case 'appliance':
      newDevice = { id, name: '', type, kw: 0 }
      break
    default:
      throw new Error(`Unsupported device type: ${String(type)}`)
  }

  devices.value = [...devices.value, newDevice]
}

function removeDevice(index: number) {
  const updated = [...devices.value]
  updated.splice(index, 1)
  devices.value = updated
  organizeRanges()
}

function onTypeChange(index: number) {
  const updated = [...devices.value]
  const device = updated[index]
  if (!device) return
  if (device.type === 'waterHeater' && !device.subType) {
    device.subType = SUB_TYPE_MAP.waterHeater[0]
  } else if (device.type === 'heater' && !device.heaterType) {
    device.heaterType = SUB_TYPE_MAP.heater[0]
  }

  devices.value = updated
  if (device.type === 'range') organizeRanges()
}

/**
 * Range 自动编号
 */
function organizeRanges() {
  const updated = [...devices.value]
  const ranges = updated.filter(d => d.type === 'range')
  if (!ranges.length) return

  let counter = 1
  ranges.forEach(d => {
    d.type = 'range'
    d.name = `Range ${counter} (range)`
    counter++
  })
  devices.value = updated
}
</script>

<style scoped>
.q-mt-sm {
  margin-top: 8px;
}

.q-ml-sm {
  margin-left: 8px;
}
</style>
