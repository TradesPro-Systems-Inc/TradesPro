<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <!-- Mobile menu button (only on small screens) -->
        <q-btn
          flat
          dense
          round
          icon="menu"
          color="white"
          class="q-mr-sm lt-md"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <!-- Title - responsive sizing -->
        <q-toolbar-title class="ellipsis">
          <span class="gt-xs">{{ $t('app.title') }}</span>
          <span class="lt-sm">TradesPro</span>
        </q-toolbar-title>

        <q-space />

        <!-- Desktop navigation (hidden on mobile) -->
        <div class="gt-sm row q-gutter-sm items-center">
          <!-- Font size control -->
          <FontSizeControl />

          <!-- Language switcher -->
          <LanguageSwitcher />

          <!-- Navigation menu -->
          <q-btn-group flat>
            <q-btn
              flat
              :label="$t('nav.calculator')"
              icon="calculate"
              :color="$route.path === '/' ? 'yellow' : 'white'"
              :text-color="$route.path === '/' ? 'blue-10' : 'white'"
              @click="$router.push('/')"
            />
            <q-btn
              flat
              :label="$t('nav.projects')"
              icon="folder"
              :color="$route.path === '/projects' ? 'yellow' : 'white'"
              :text-color="$route.path === '/projects' ? 'blue-10' : 'white'"
              @click="$router.push('/projects')"
            />
          </q-btn-group>

          <!-- User menu -->
          <q-btn-dropdown
            flat
            icon="account_circle"
            color="white"
            text-color="white"
            class="q-ml-sm"
          >
          <q-list>
            <q-item clickable v-close-popup @click="$router.push('/user-settings')">
              <q-item-section avatar>
                <q-icon name="person" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ $t('nav.userSettings') }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="$router.push('/projects')">
              <q-item-section avatar>
                <q-icon name="folder" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ $t('nav.projects') }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable v-close-popup>
              <q-item-section avatar>
                <q-icon name="help" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ $t('nav.help') }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        </div>

        <!-- Mobile: Only show language and font size (icon only) -->
        <div class="lt-md row items-center" style="gap: 4px;">
          <FontSizeControl icon-only />
          <LanguageSwitcher icon-only />
        </div>
      </q-toolbar>
    </q-header>

    <!-- Mobile drawer menu -->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="280"
      :breakpoint="1024"
      bordered
      class="bg-grey-1"
    >
      <q-scroll-area class="fit">
        <q-list padding>
          <!-- App Title in drawer -->
          <q-item-label header class="text-h6 text-primary">
            {{ $t('app.title') }}
          </q-item-label>

          <q-separator class="q-mb-md" />

          <!-- Calculator -->
          <q-item
            clickable
            v-ripple
            :active="$route.path === '/'"
            active-class="bg-primary text-white"
            @click="$router.push('/')"
          >
            <q-item-section avatar>
              <q-icon name="calculate" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('nav.calculator') }}</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Projects -->
          <q-item
            clickable
            v-ripple
            :active="$route.path === '/projects'"
            active-class="bg-primary text-white"
            @click="$router.push('/projects')"
          >
            <q-item-section avatar>
              <q-icon name="folder" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('nav.projects') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator class="q-my-md" />

          <!-- User Settings -->
          <q-item
            clickable
            v-ripple
            @click="$router.push('/user-settings')"
          >
            <q-item-section avatar>
              <q-icon name="person" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('nav.userSettings') }}</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Help -->
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="help" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('nav.help') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator class="q-my-md" />

          <!-- Version info -->
          <q-item-label caption class="q-px-md text-grey-6">
            Quasar v{{ $q.version }}
          </q-item-label>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FontSizeControl from '../components/common/FontSizeControl.vue';
import LanguageSwitcher from '../components/common/LanguageSwitcher.vue';

// Mobile drawer state
const leftDrawerOpen = ref(false);
</script>