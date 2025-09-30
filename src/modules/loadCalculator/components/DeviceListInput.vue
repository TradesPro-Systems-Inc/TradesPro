<!-- src/modules/loadCalculator/components/DeviceListInput.vue -->
<template>
  <div>
    <!-- Add Device Buttons -->
    <q-btn label="Add Water Heater" @click="addDevice('waterHeater')" color="primary" icon="add" class="q-mb-sm" />
    <q-btn label="Add Range" @click="addDevice('range')" color="secondary" icon="add" class="q-ml-sm q-mb-sm" />
    <q-btn label="Add EV" @click="addDevice('ev')" color="teal" icon="add" class="q-ml-sm q-mb-sm" />
    <q-btn label="Add Appliance >1500W" @click="addDevice('appliance')" color="orange" icon="add"
      class="q-ml-sm q-mb-sm" />
    <!-- 全局 EVEMS 开关 -->
    <q-toggle v-if="devices.some(d => d.type === 'ev')" v-model="evEmsModel" label="Has EV Energy Management System?"
      class="q-mt-md" />
    <!-- Device List -->
    <div v-for="(device, index) in devices" :key="device.id" class="q-mt-sm">
      <!-- Device Type -->
      <q-select v-model="device.type" :options="deviceTypes" option-label="label" option-value="value"
        @blur="onTypeChange(index)" />

      <!-- Water Heater Subtype -->
      <q-select v-if="device.type === 'waterHeater'" v-model="device.subType" :options="SUB_TYPES.waterHeater"
        label="Subtype" />

      <!-- EV Auto Management -->
      <q-input v-if="device.type === 'ev'" v-model="device.kw" label="EV Charger Rating (kW)" />

      <!-- Range Input -->
      <q-input v-if="device.type === 'range'" v-model.number="device.kw" label="Range Rating (kW)" type="number"
        @blur="organizeRanges" />

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
import type { Device, DeviceType } from '../../../types/device'
// import { loadESLint } from 'eslint';

const SUB_TYPES = {
  waterHeater: [
    'electric tankless water heaters',
    'electric water heaters for steamers',
    'electric water heaters for swimming pools',
    'electric water heaters for hot tubs',
    'electric water heaters for spas'
  ]
}
const deviceTypes: { label: string; value: DeviceType }[] = [
  { label: 'Water Heater', value: 'waterHeater' },
  { label: 'Appliance >1500W', value: 'appliance' },
  { label: 'EV Charger', value: 'ev' },
  { label: 'Range', value: 'range' }
]
const props = defineProps<{
  modelValue: Device[]
  hasEvEms: boolean // optional prop to bind EV EMS toggle
}>()

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

// const evEmsModel = computed({
//   get: () => props.hasEvEms,
//   set: (val: boolean) => emit('update:hasEvEms', val)
// })

// watch(
//   () => props.hasEvEms,
//   (val) => {
//     if (val !== undefined) {
//       const updated = devices.value.map(d =>
//         d.type === "EV" ? { ...d, hasAutoManagement: val } : d
//       )
//       devices.value = updated
//       emit("update:modelValue", updated)
//     }
//   }
// )
// const devices = computed({
//   get: () => props.modelValue,
//   set: (val) => emit('update:modelValue', val)
// })

function addDevice(type: DeviceType) {
  const id = crypto.randomUUID()
  let newDevice: Device

  switch (type) {
    case 'ev':
      newDevice = { id, name: '', type, kw: 7.2, hasAutoManagement: evEmsModel.value }
      break
    case 'range':
      newDevice = { id, name: '', type, kw: 12 }
      break
    case 'waterHeater':
      newDevice = {
        id,
        name: '',
        type,
        kw: 4.5,
        subType: SUB_TYPES.waterHeater[0]
      }
      break
    case 'appliance':
      newDevice = { id, name: '', type, kw: 2 }
      break
    default:
      throw new Error(`Unsupported device type: ${type}`)
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
    device.subType = SUB_TYPES.waterHeater[0] as string
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
