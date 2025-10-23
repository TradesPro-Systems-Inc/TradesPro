<template>
  <q-page class="tables-page">
    <div class="q-pa-md">
      <div class="row justify-center q-mb-md">
        <div class="col-12 col-md-10">
          <h3 class="text-h3 text-center q-mb-md">
            {{ $t('nav.tables') || 'CEC Tables' }}
          </h3>
          
          <!-- Table Selection Tabs -->
          <q-tabs
            v-model="selectedTable"
            dense
            class="text-grey"
            active-color="primary"
            indicator-color="primary"
            align="justify"
            narrow-indicator
          >
            <q-tab name="table2" :label="$t('cecTables.table2.title')" />
            <q-tab name="table4" label="Table 4" disable />
            <q-tab name="table5a" label="Table 5A" disable />
            <q-tab name="table5c" label="Table 5C" disable />
          </q-tabs>

          <q-separator />

          <!-- Table Content -->
          <q-tab-panels v-model="selectedTable" animated>
            <q-tab-panel name="table2">
              <CecTableViewer />
            </q-tab-panel>

            <q-tab-panel name="table4">
              <q-banner class="bg-grey-3">
                <template v-slot:avatar>
                  <q-icon name="construction" color="orange" />
                </template>
                Table 4 coming soon...
              </q-banner>
            </q-tab-panel>

            <q-tab-panel name="table5a">
              <q-banner class="bg-grey-3">
                <template v-slot:avatar>
                  <q-icon name="construction" color="orange" />
                </template>
                Table 5A coming soon...
              </q-banner>
            </q-tab-panel>

            <q-tab-panel name="table5c">
              <q-banner class="bg-grey-3">
                <template v-slot:avatar>
                  <q-icon name="construction" color="orange" />
                </template>
                Table 5C coming soon...
              </q-banner>
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import CecTableViewer from '../components/tools/CecTableViewer.vue';

const selectedTable = ref('table2');
</script>

<style scoped lang="scss">
.tables-page {
  background-color: #f5f5f5;
  min-height: 100vh;
}
</style>

