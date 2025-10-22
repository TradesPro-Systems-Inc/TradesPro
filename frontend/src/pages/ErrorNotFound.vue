<template>
  <div class="fullscreen bg-blue text-white text-center q-pa-md flex flex-center">
    <div>
      <div style="font-size: 30vh">
        404
      </div>

      <div class="text-h2" style="opacity:.4">
        {{ $t('error.pageNotFound') }}
      </div>

      <q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        unelevated
        :label="$t('error.goHome')"
        no-caps
        @click="$router.push('/')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// 404 Error page
</script>


