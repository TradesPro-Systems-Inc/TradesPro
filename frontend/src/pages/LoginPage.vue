<template>
  <div class="flex flex-center login-page-background" style="min-height: 100vh">
    <q-card class="login-card q-pa-md" style="min-width: 350px; max-width: 450px">
      <q-card-section class="text-center">
        <div class="text-h4 q-mb-sm text-primary">TradesPro</div>
        <div class="text-h6 q-mb-md">{{ $t('auth.login') || '登录' }}</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="onLogin" class="q-gutter-md">
          <q-input
            v-model="email"
            :label="$t('auth.email') || '邮箱'"
            type="email"
            filled
            :rules="[val => !!val || $t('auth.emailRequired') || '请输入邮箱', val => /.+@.+\..+/.test(val) || $t('auth.emailInvalid') || '邮箱格式不正确']"
            :error="!!loginError && loginError.includes('email')"
          >
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            :label="$t('auth.password') || '密码'"
            type="password"
            filled
            :rules="[val => !!val || $t('auth.passwordRequired') || '请输入密码']"
            :error="!!loginError && loginError.includes('password')"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
          </q-input>

          <div v-if="loginError" class="text-negative q-mt-sm">
            <q-icon name="error" class="q-mr-xs" />
            {{ loginError }}
          </div>

          <div class="row items-center justify-between">
            <q-checkbox
              v-model="rememberMe"
              :label="$t('auth.rememberMe') || '记住我'"
              dense
            />
            <q-btn
              flat
              dense
              no-caps
              :label="$t('auth.forgotPassword') || '忘记密码？'"
              color="primary"
              size="sm"
              @click="onForgotPassword"
            />
          </div>

          <q-btn
            type="submit"
            :label="$t('auth.login') || '登录'"
            color="primary"
            size="lg"
            class="full-width q-mt-md"
            :loading="loading"
            :disable="!email || !password"
          />

          <q-separator class="q-my-md" />

          <div class="text-center">
            <q-btn
              flat
              dense
              no-caps
              :label="$t('auth.noAccount') || '没有账号？'"
              color="primary"
              @click="$router.push('/register')"
            />
            <span class="text-grey-6 q-mx-sm">|</span>
            <q-btn
              flat
              dense
              no-caps
              :label="$t('auth.register') || '注册'"
              color="primary"
              @click="$router.push('/register')"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../pinia-stores/user';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();
const userStore = useUserStore();

const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const loading = ref(false);
const loginError = ref<string | null>(null);

// Redirect if already logged in
onMounted(() => {
  if (userStore.isAuthenticated) {
    router.push('/');
  }
});

async function onLogin() {
  loginError.value = null;
  loading.value = true;

  try {
    const success = await userStore.login(email.value, password.value);
    
    if (success) {
      // Save to localStorage if remember me is checked
      if (rememberMe.value) {
        localStorage.setItem('remember_email', email.value);
      } else {
        localStorage.removeItem('remember_email');
      }

      $q.notify({
        type: 'positive',
        message: t('auth.loginSuccess'),
        position: 'top'
      });

      // Redirect to the page user was trying to access, or home
      const redirect = router.currentRoute.value.query.redirect as string || '/';
      router.push(redirect);
    } else {
      // Use store error message - check if it's a translation key
      const storeError = userStore.error || '';
      if (storeError.startsWith('auth.')) {
        loginError.value = t(storeError) || storeError;
      } else if (storeError === 'invalidCredentials' || storeError === 'accountDisabled' || storeError === 'loginFailed') {
        loginError.value = t(`auth.${storeError}`) || storeError;
      } else {
        loginError.value = storeError || t('auth.loginFailed') || '登录失败，请检查邮箱和密码';
      }
    }
  } catch (error: any) {
    // Extract error message from error object
    let errorMessage = '';
    
    if (error?.response?.data?.detail) {
      // Use backend error message directly (it's already user-friendly)
      errorMessage = error.response.data.detail;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (error?.response?.status === 401) {
      errorMessage = t('auth.invalidCredentials') || '邮箱或密码错误';
    } else {
      errorMessage = t('auth.loginFailed') || '登录失败，请稍后重试';
    }
    
    loginError.value = errorMessage;
  } finally {
    loading.value = false;
  }
}

function onForgotPassword() {
  $q.dialog({
    title: t('auth.forgotPassword'),
    message: t('auth.forgotPasswordMessage') || 'Please contact administrator to reset password, or use the backend API to reset.',
    ok: {
      label: t('common.ok') || 'OK',
      color: 'primary'
    },
    cancel: {
      label: t('common.cancel') || 'Cancel',
      color: 'grey',
      flat: true
    }
  });
}

// Load remembered email
onMounted(() => {
  const rememberedEmail = localStorage.getItem('remember_email');
  if (rememberedEmail) {
    email.value = rememberedEmail;
    rememberMe.value = true;
  }
});
</script>

<style scoped>
/* Login page background - different from main background for better hierarchy */
.login-page-background {
  background-color: #f5f5f5; /* Light mode: light gray */
}

/* Dark mode: Use a slightly different dark color to create hierarchy */
.body--dark .login-page-background,
.dark .login-page-background {
  background-color: #1a1a1a; /* Darker than main background (#121212) for contrast */
  background-image: linear-gradient(135deg, #1a1a1a 0%, #252525 100%);
}

.login-card {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Dark mode: Enhance card appearance */
.body--dark .login-card,
.dark .login-card {
  background-color: #2d2d2d; /* Slightly lighter than page background for depth */
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1); /* Subtle border for definition */
}
</style>

