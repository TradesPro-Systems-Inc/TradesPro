<template>
  <div>
    <q-btn label="添加设备" @click="addDevice" icon="add" color="primary" />
    <div v-for="(device, index) in devices" :key="index" class="q-mt-sm">
      <q-input v-model="device.name" label="设备名称" />
      <q-input v-model.number="device.watts" label="功率 (W)" type="number" />
      <q-select v-model="device.type" :options="deviceTypes" label="设备类型" />
      <q-btn icon="delete" @click="removeDevice(index)" flat round color="negative" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const devices = ref<{ name: string; watts: number; type: string }[]>([])

const deviceTypes = [
  '热水器 (Rule 8-200(v))',
  '蒸汽器',
  '泳池加热器',
  '热水浴缸',
  '其他'
]

function addDevice() {
  devices.value.push({ name: '', watts: 0, type: '其他' })
}

function removeDevice(index: number) {
  devices.value.splice(index, 1)
}
</script>
