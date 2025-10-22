<template>
  <q-page class="row items-center justify-evenly">
    <p style="font-size: 2rem; text-align: center;">
      Welcome to your Quasar App!
      <br>
      <img
        alt="Quasar logo"
        src="~assets/quasar-logo-vertical.svg"
        style="width: 200px; height: 200px"
      >
    </p>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'IndexPage'
})
</script>