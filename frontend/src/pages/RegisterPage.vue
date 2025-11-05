<template>
  <div class="flex flex-center register-page-background" style="min-height: 100vh">
    <q-card class="register-card q-pa-md" style="min-width: 400px; max-width: 500px">
      <q-card-section class="text-center">
        <div class="text-h4 q-mb-sm text-primary">TradesPro</div>
        <div class="text-h6 q-mb-md">{{ $t('auth.register') || '注册' }}</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="onRegister" class="q-gutter-md">
          <q-input
            v-model="fullName"
            :label="$t('auth.fullName') || '姓名'"
            filled
            :rules="[val => !!val || $t('auth.fullNameRequired') || '请输入姓名']"
          >
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <q-input
            v-model="email"
            :label="$t('auth.email') || '邮箱'"
            type="email"
            filled
            :rules="[
              val => !!val || $t('auth.emailRequired') || '请输入邮箱',
              val => /.+@.+\..+/.test(val) || $t('auth.emailInvalid') || '邮箱格式不正确'
            ]"
            :error="!!registerError && registerError.includes('email')"
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
            :rules="[
              val => !!val || $t('auth.passwordRequired') || '请输入密码',
              val => val.length >= 8 || $t('auth.passwordMinLength') || '密码至少8位'
            ]"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
          </q-input>

          <q-input
            v-model="confirmPassword"
            :label="$t('auth.confirmPassword') || '确认密码'"
            type="password"
            filled
            :rules="[
              val => !!val || $t('auth.confirmPasswordRequired') || '请确认密码',
              val => val === password || $t('auth.passwordMismatch') || '两次密码不一致'
            ]"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
          </q-input>

          <div v-if="registerError" class="text-negative q-mt-sm">
            <q-icon name="error" class="q-mr-xs" />
            {{ registerError }}
          </div>

          <q-btn
            type="submit"
            :label="$t('auth.register') || '注册'"
            color="primary"
            size="lg"
            class="full-width q-mt-md"
            :loading="loading"
            :disable="!email || !password || !confirmPassword || !fullName"
          />

          <q-separator class="q-my-md" />

          <div class="text-center">
            <q-btn
              flat
              dense
              no-caps
              :label="$t('auth.haveAccount') || '已有账号？'"
              color="primary"
              @click="$router.push('/login')"
            />
            <span class="text-grey-6 q-mx-sm">|</span>
            <q-btn
              flat
              dense
              no-caps
              :label="$t('auth.login') || '登录'"
              color="primary"
              @click="$router.push('/login')"
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

const router = useRouter();
const $q = useQuasar();
const userStore = useUserStore();

const fullName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const registerError = ref<string | null>(null);

// Redirect if already logged in
onMounted(() => {
  if (userStore.isAuthenticated) {
    router.push('/');
  }
});

async function onRegister() {
  registerError.value = null;
  
  if (password.value !== confirmPassword.value) {
    registerError.value = '两次密码不一致';
    return;
  }

  loading.value = true;

  try {
    const success = await userStore.register(email.value, password.value, fullName.value);
    
    if (success) {
      $q.notify({
        type: 'positive',
        message: $q.lang.auth?.registerSuccess || '注册成功！',
        position: 'top'
      });

      // Redirect to home after registration
      router.push('/');
    } else {
      registerError.value = userStore.error || '注册失败，请稍后重试';
    }
  } catch (error: any) {
    registerError.value = error.message || '注册失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* Register page background - different from main background for better hierarchy */
.register-page-background {
  background-color: #f5f5f5; /* Light mode: light gray */
}

/* Dark mode: Use a slightly different dark color to create hierarchy */
.body--dark .register-page-background,
.dark .register-page-background {
  background-color: #1a1a1a; /* Darker than main background (#121212) for contrast */
  background-image: linear-gradient(135deg, #1a1a1a 0%, #252525 100%);
}

.register-card {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Dark mode: Enhance card appearance */
.body--dark .register-card,
.dark .register-card {
  background-color: #2d2d2d; /* Slightly lighter than page background for depth */
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1); /* Subtle border for definition */
}
</style>

