<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 400px; max-width: 500px">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ $t('auth.login') || 'Login' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form @submit="onLogin" class="q-gutter-md">
          <q-input
            v-model="email"
            :label="$t('auth.email') || 'Email'"
            type="email"
            filled
            :rules="[
              val => !!val || $t('auth.emailRequired') || 'Email is required',
              val => /.+@.+\..+/.test(val) || $t('auth.emailInvalid') || 'Invalid email format'
            ]"
            :error="!!loginError && loginError.includes('email')"
          >
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            :label="$t('auth.password') || 'Password'"
            type="password"
            filled
            :rules="[val => !!val || $t('auth.passwordRequired') || 'Password is required']"
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
              :label="$t('auth.rememberMe') || 'Remember Me'"
              dense
            />
            <q-btn
              flat
              dense
              no-caps
              :label="$t('auth.forgotPassword') || 'Forgot Password?'"
              color="primary"
              size="sm"
              @click="onForgotPassword"
            />
          </div>

          <q-btn
            type="submit"
            :label="$t('auth.login') || 'Login'"
            color="primary"
            size="lg"
            class="full-width q-mt-md"
            :loading="loading"
            :disable="!email || !password"
          />

          <q-separator class="q-my-md" />

          <div class="text-center">
            <span class="text-grey-7">{{ $t('auth.noAccount') || "Don't have an account?" }}</span>
            <q-btn
              flat
              dense
              no-caps
              :label="$t('auth.register') || 'Register'"
              color="primary"
              @click="onRegister"
              class="q-ml-sm"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '../../pinia-stores/user';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'login-success'): void;
}>();

const $q = useQuasar();
const router = useRouter();
const { t } = useI18n();
const userStore = useUserStore();

const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const loading = ref(false);
const loginError = ref<string | null>(null);

const showDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Load remembered email if available
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    const rememberedEmail = localStorage.getItem('remember_email');
    if (rememberedEmail) {
      email.value = rememberedEmail;
      rememberMe.value = true;
    }
    loginError.value = null;
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
        position: 'top',
        icon: 'check_circle'
      });

      // Close dialog and emit success event
      showDialog.value = false;
      emit('login-success');
    } else {
      // Use store error message
      const storeError = userStore.error || '';
      if (storeError.startsWith('auth.')) {
        loginError.value = t(storeError) || storeError;
      } else if (storeError === 'invalidCredentials' || storeError === 'accountDisabled' || storeError === 'loginFailed') {
        loginError.value = t(`auth.${storeError}`) || storeError;
      } else {
        loginError.value = storeError || t('auth.loginFailed') || 'Login failed';
      }
    }
  } catch (error: any) {
    let errorMessage = '';
    
    if (error?.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (error?.response?.status === 401) {
      errorMessage = t('auth.invalidCredentials') || 'Invalid email or password';
    } else {
      errorMessage = t('auth.loginFailed') || 'Login failed, please try again';
    }
    
    loginError.value = errorMessage;
  } finally {
    loading.value = false;
  }
}

function onForgotPassword() {
  $q.dialog({
    title: t('auth.forgotPassword') || 'Forgot Password',
    message: t('auth.forgotPasswordMessage') || 'Please contact administrator to reset password, or use the backend API to reset.',
    ok: true,
    persistent: true
  });
}

function onRegister() {
  showDialog.value = false;
  router.push('/register');
}
</script>

<script lang="ts">
import { computed } from 'vue';
export default {
  name: 'LoginDialog'
};
</script>

