// src/modules/loadCalculator/compotents/DeviceListInput.vue

<template>
  <div>
    <q-btn label="Add appliance" @click="addDevice" icon="add" color="primary" />
    <div v-for="(device, index) in devices" :key="index" class="q-mt-sm">
      <q-input v-model="device.name" label="Appliance Name" />
      <q-input v-model.number="device.watts" label="Power (W)" type="number" />
      <q-select v-model="device.type" :options="deviceTypes" label="Appliance Type" />
      <q-btn icon="delete" @click="removeDevice(index)" flat round color="negative" />
    </div>
  </div>
</template>

<script setup lang="ts">
//import { ref } from 'vue'
import { defineProps, defineEmits } from 'vue';
const props = defineProps<{
  modelValue: { name: string; watts: number; type: string }[]
}>();
const emit = defineEmits(['update:modelValue']);

const deviceTypes = [
  'water heaters', //(Rule 8-200(v))
  // 'electric water heaters for steamers',
  // 'electric water heaters for swimming pools',
  // 'electric water heaters for hot tubs',
  // 'electric water heaters for spas',
  'other appliances > 1500W',
]

function addDevice() {
  emit('update:modelValue', [...props.modelValue, { name: '', watts: 0, type: 'other' }])
}

function removeDevice(index: number) {
  const updated = [...props.modelValue]
  updated.splice(index, 1)
  emit('update:modelValue', updated)
}

</script>
