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
          :color="$q.dark.isActive ? 'white' : 'dark'"
          class="q-mr-sm lt-md"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <!-- Title - responsive sizing -->
        <q-toolbar-title class="ellipsis" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">
          <span class="gt-xs">{{ $t('app.title') }}</span>
          <span class="lt-sm">TradesPro</span>
        </q-toolbar-title>

        <q-space />

        <!-- Desktop navigation (hidden on mobile) -->
        <div class="gt-sm row q-gutter-sm items-center">
          <!-- Theme switcher -->
          <ThemeSwitcher />

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
              :color="$route.path === '/' ? 'yellow' : ($q.dark.isActive ? 'white' : 'dark')"
              :text-color="$route.path === '/' ? 'blue-10' : undefined"
              @click="$router.push('/')"
            />
            <q-btn
              flat
              :label="$t('nav.tables') || 'Tables'"
              icon="table_chart"
              :color="$route.path === '/tables' ? 'yellow' : ($q.dark.isActive ? 'white' : 'dark')"
              :text-color="$route.path === '/tables' ? 'blue-10' : undefined"
              @click="$router.push('/tables')"
            />
            <q-btn
              flat
              :label="$t('nav.projects')"
              icon="folder"
              :color="$route.path === '/projects' ? 'yellow' : ($q.dark.isActive ? 'white' : 'dark')"
              :text-color="$route.path === '/projects' ? 'blue-10' : undefined"
              @click="$router.push('/projects')"
            />
            <q-btn
              flat
              :label="$t('nav.feedback') || 'Feedback'"
              icon="forum"
              :color="$route.path === '/feedback' ? 'yellow' : ($q.dark.isActive ? 'white' : 'dark')"
              :text-color="$route.path === '/feedback' ? 'blue-10' : undefined"
              @click="$router.push('/feedback')"
            />
          </q-btn-group>

          <!-- User menu / Login button -->
          <q-btn-dropdown
            v-if="isAuthenticated"
            flat
            :icon="userInitials ? undefined : 'account_circle'"
            :label="userInitials"
            :color="$q.dark.isActive ? 'white' : 'dark'"
            class="q-ml-sm"
          >
          <q-list>
            <q-item>
              <q-item-section avatar>
                <q-icon name="person" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ userFullName }}</q-item-label>
                <q-item-label caption>{{ userEmail }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable v-close-popup @click="$router.push('/user-settings')">
              <q-item-section avatar>
                <q-icon name="settings" />
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
            <q-item clickable v-close-popup @click="onLogout">
              <q-item-section avatar>
                <q-icon name="logout" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ $t('auth.logout') || '登出' }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>

        <!-- Login button (when not authenticated) -->
        <q-btn
          v-else
          flat
          icon="login"
          :label="$t('auth.login') || '登录'"
          :color="$q.dark.isActive ? 'white' : 'dark'"
          class="q-ml-sm"
          @click="$router.push('/login')"
        />
        </div>

        <!-- Mobile: Show theme, language, font size and user menu (icon only) -->
        <div class="lt-md row items-center" style="gap: 4px;">
          <ThemeSwitcher icon-only />
          <FontSizeControl icon-only />
          <LanguageSwitcher icon-only />
          
          <!-- User menu / Login button (mobile) -->
          <q-btn-dropdown
            v-if="isAuthenticated"
            flat
            dense
            round
            :icon="userInitials ? undefined : 'account_circle'"
            :color="$q.dark.isActive ? 'white' : 'dark'"
            size="sm"
          >
            <q-list>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="person" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ userFullName }}</q-item-label>
                  <q-item-label caption>{{ userEmail }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="$router.push('/user-settings')">
                <q-item-section avatar>
                  <q-icon name="settings" />
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
              <q-item clickable v-close-popup @click="onLogout">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ $t('auth.logout') || '登出' }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <!-- Login button (mobile, when not authenticated) -->
          <q-btn
            v-else
            flat
            dense
            round
            icon="login"
            :color="$q.dark.isActive ? 'white' : 'dark'"
            size="sm"
            @click="$router.push('/login')"
          >
            <q-tooltip>{{ $t('auth.login') || '登录' }}</q-tooltip>
          </q-btn>
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

          <!-- Tables -->
          <q-item
            clickable
            v-ripple
            :active="$route.path === '/tables'"
            active-class="bg-primary text-white"
            @click="$router.push('/tables')"
          >
            <q-item-section avatar>
              <q-icon name="table_chart" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('nav.tables') || 'CEC Tables' }}</q-item-label>
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

          <!-- Feedback -->
          <q-item
            clickable
            v-ripple
            :active="$route.path === '/feedback'"
            active-class="bg-primary text-white"
            @click="$router.push('/feedback')"
          >
            <q-item-section avatar>
              <q-icon name="forum" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('nav.feedback') || 'Feedback' }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator class="q-my-md" />

          <!-- User Authentication Section -->
          <template v-if="isAuthenticated">
            <!-- User Info -->
            <q-item>
              <q-item-section avatar>
                <q-icon name="person" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ userFullName }}</q-item-label>
                <q-item-label caption>{{ userEmail }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-separator class="q-my-sm" />

            <!-- User Settings -->
            <q-item
              clickable
              v-ripple
              @click="$router.push('/user-settings')"
            >
              <q-item-section avatar>
                <q-icon name="settings" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ $t('nav.userSettings') }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-separator class="q-my-sm" />

            <!-- Logout -->
            <q-item
              clickable
              v-ripple
              @click="onLogout"
            >
              <q-item-section avatar>
                <q-icon name="logout" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ $t('auth.logout') || '登出' }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>

          <template v-else>
            <!-- Login -->
            <q-item
              clickable
              v-ripple
              @click="$router.push('/login')"
            >
              <q-item-section avatar>
                <q-icon name="login" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ $t('auth.login') || '登录' }}</q-item-label>
              </q-item-section>
            </q-item>

            <!-- Register -->
            <q-item
              clickable
              v-ripple
              @click="$router.push('/register')"
            >
              <q-item-section avatar>
                <q-icon name="person_add" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ $t('auth.register') || '注册' }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>

          <q-separator class="q-my-md" />

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
          <q-item-label caption class="q-px-md" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
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
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useUIStore, useUserStore } from '../pinia-stores';
import FontSizeControl from '../components/common/FontSizeControl.vue';
import LanguageSwitcher from '../components/common/LanguageSwitcher.vue';
import ThemeSwitcher from '../components/common/ThemeSwitcher.vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();

// Use UI store for sidebar state
const uiStore = useUIStore();
const { sidebarOpen } = storeToRefs(uiStore);

// Use User store for authentication
const userStore = useUserStore();
const { isAuthenticated, userFullName, userEmail, userInitials } = storeToRefs(userStore);

// Create computed property for drawer to work with Quasar
const leftDrawerOpen = computed({
  get: () => sidebarOpen.value,
  set: (val) => val ? uiStore.openSidebar() : uiStore.closeSidebar()
});

// Logout handler
function onLogout() {
  $q.dialog({
    title: t('auth.logout'),
    message: t('auth.confirmLogout'),
    cancel: {
      label: t('common.cancel'),
      color: 'grey'
    },
    ok: {
      label: t('auth.logout'),
      color: 'primary'
    },
    persistent: true
  }).onOk(() => {
    userStore.logout();
    router.push('/login');
    $q.notify({
      type: 'info',
      message: t('auth.logoutSuccess'),
      position: 'top'
    });
  });
}
</script>