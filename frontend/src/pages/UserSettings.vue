<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h5">{{ $t('nav.userSettings') }}</div>
      <q-space />
      <q-chip color="primary" text-color="white" icon="person">
        {{ $t('settings.userManagement') || 'User Management' }}
      </q-chip>
    </div>

    <q-card>
      <q-card-section>
        <div class="text-h6">{{ $t('settings.personalInfo') || 'Personal Information' }}</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form @submit="onSaveProfile" class="q-gutter-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="editProfile.fullName"
                :label="$t('settings.fullName')"
                filled
                :rules="[(val) => !!val || $t('settings.fullNameRequired')]"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="editProfile.email"
                :label="$t('settings.email')"
                type="email"
                filled
                readonly
                :hint="$t('settings.emailCannotChange')"
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="editProfile.licenseNumber"
                :label="$t('settings.licenseNumber')"
                filled
                :hint="$t('settings.optional')"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="editProfile.company"
                :label="$t('settings.company')"
                filled
                :hint="$t('settings.optional')"
              />
            </div>
          </div>

          <q-input
            v-model="editProfile.bio"
            :label="$t('settings.bio')"
            type="textarea"
            filled
            rows="3"
            :hint="$t('settings.optional')"
          />

          <div class="row q-gutter-sm">
            <q-btn
              type="submit"
              color="primary"
              :label="$t('settings.saveSettings')"
              icon="save"
              :loading="saving"
            />
            <q-btn
              flat
              color="grey"
              :label="$t('settings.reset')"
              icon="refresh"
              @click="resetProfile"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <q-card class="q-mt-md">
      <q-card-section>
        <div class="text-h6">{{ $t('settings.accountSecurity') }}</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form ref="passwordFormRef" @submit="onChangePassword" class="q-gutter-md">
          <q-input
            v-model="passwordForm.currentPassword"
            :label="$t('settings.currentPassword')"
            type="password"
            filled
            :rules="[(val) => !!val || $t('settings.currentPasswordRequired')]"
          />

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="passwordForm.newPassword"
                :label="$t('settings.newPassword')"
                type="password"
                filled
                :rules="[
                  (val) => !!val || $t('settings.newPasswordRequired'),
                  (val) => val.length >= 8 || $t('auth.passwordMinLength')
                ]"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="passwordForm.confirmPassword"
                :label="$t('settings.confirmNewPassword')"
                type="password"
                filled
                :rules="[
                  (val) => !!val || $t('settings.confirmNewPasswordRequired'),
                  (val) => val === passwordForm.newPassword || $t('settings.passwordMismatch')
                ]"
              />
            </div>
          </div>

          <q-btn
            type="submit"
            color="warning"
            :label="$t('settings.changePassword')"
            icon="lock"
            :loading="changingPassword"
          />
        </q-form>
      </q-card-section>
    </q-card>

    <q-card class="q-mt-md">
      <q-card-section>
        <div class="text-h6">{{ $t('settings.preferences') }}</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="q-gutter-md">
          <div class="row items-center">
            <div class="col-6">
              <div class="text-subtitle2">{{ $t('settings.fontSize') }}</div>
              <div class="text-caption text-grey-6">{{ $t('settings.fontSizeHint') }}</div>
            </div>
            <div class="col-6">
              <FontSizeControl />
            </div>
          </div>

          <q-separator />

          <div class="row items-center">
            <div class="col-6">
              <div class="text-subtitle2">{{ $t('settings.themeMode') }}</div>
              <div class="text-caption text-grey-6">{{ $t('settings.themeModeHint') }}</div>
            </div>
            <div class="col-6">
              <q-btn-toggle
                v-model="themeMode"
                :options="themeOptions"
                color="primary"
                @update:model-value="onThemeChange"
              />
            </div>
          </div>

          <q-separator />

          <div class="row items-center">
            <div class="col-6">
              <div class="text-subtitle2">{{ $t('settings.languageSettings') }}</div>
              <div class="text-caption text-grey-6">{{ $t('settings.languageSettingsHint') }}</div>
            </div>
            <div class="col-6">
              <q-select
                v-model="language"
                :options="languageOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                filled
                dense
                @update:model-value="onLanguageChange"
              />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Jurisdiction Configuration Card -->
    <q-card class="q-mt-md">
      <q-card-section>
        <div class="row items-center">
          <div class="text-h6">{{ $t('settings.jurisdictionConfig') || 'Jurisdiction Configuration' }}</div>
          <q-space />
          <q-btn
            color="primary"
            :label="$t('settings.addProfile') || 'Add Profile'"
            icon="add"
            @click="showProfileDialog = true; editingProfile = null"
          />
        </div>
        <div class="text-caption text-grey-6 q-mt-xs">
          {{ $t('settings.jurisdictionConfigHint') || 'Customize calculation rules based on your jurisdiction or utility company' }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <!-- Active Profile Display -->
        <div v-if="activeProfile" class="q-mb-md">
          <q-banner rounded class="bg-primary text-white">
            <template v-slot:avatar>
              <q-icon name="location_city" size="sm" />
            </template>
            <div class="text-subtitle2">{{ $t('settings.activeProfile') || 'Active Profile' }}</div>
            <div class="text-body2">{{ activeProfile.name }}</div>
            <div v-if="activeProfile.jurisdiction" class="text-caption opacity-80">
              {{ activeProfile.jurisdiction }}
            </div>
            <div v-if="activeProfile.utility" class="text-caption opacity-80">
              {{ activeProfile.utility }}
            </div>
          </q-banner>
        </div>

        <!-- Profiles List -->
        <div v-if="profiles.length > 0" class="q-gutter-sm">
          <q-list bordered separator>
            <q-item
              v-for="profile in profiles"
              :key="profile.id"
              clickable
              v-ripple
            >
              <q-item-section avatar>
                <q-icon
                  :name="profile.isDefault ? 'star' : 'star_border'"
                  :color="profile.isDefault ? 'amber' : 'grey'"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  {{ profile.name }}
                  <q-chip
                    v-if="profile.isDefault"
                    size="sm"
                    color="amber"
                    text-color="white"
                    dense
                  >
                    {{ $t('settings.default') || 'Default' }}
                  </q-chip>
                </q-item-label>
                <q-item-label caption>
                  <span v-if="profile.jurisdiction">{{ profile.jurisdiction }}</span>
                  <span v-if="profile.jurisdiction && profile.utility"> • </span>
                  <span v-if="profile.utility">{{ profile.utility }}</span>
                </q-item-label>
                <q-item-label caption v-if="profile.calculationRules.panelBreakerSizes?.enabled">
                  <span class="text-grey-6">
                    {{ $t('settings.breakerSizes') || 'Breaker Sizes' }}: 
                    {{ profile.calculationRules.panelBreakerSizes.enabled.join(', ') }}A
                  </span>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn
                    v-if="!profile.isDefault"
                    flat
                    dense
                    round
                    icon="star"
                    color="grey"
                    @click.stop="setAsDefault(profile.id)"
                    :title="$t('settings.setAsDefault') || 'Set as Default'"
                  />
                  <q-btn
                    flat
                    dense
                    round
                    icon="edit"
                    color="primary"
                    @click.stop="openEditProfile(profile)"
                    :title="$t('settings.edit') || 'Edit'"
                  />
                  <q-btn
                    flat
                    dense
                    round
                    icon="delete"
                    color="negative"
                    @click.stop="confirmDeleteProfile(profile)"
                    :title="$t('settings.delete') || 'Delete'"
                  />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
        <div v-else class="text-center q-pa-md text-grey-6">
          <q-icon name="info" size="md" class="q-mb-sm" />
          <div>{{ $t('settings.noProfiles') || 'No jurisdiction profiles configured. Use default standard breaker sizes.' }}</div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Profile Dialog -->
    <q-dialog v-model="showProfileDialog" persistent>
      <q-card style="min-width: 500px; max-width: 600px">
        <q-card-section>
          <div class="text-h6">
            {{ editingProfile ? ($t('settings.editProfile') || 'Edit Profile') : ($t('settings.createProfile') || 'Create Profile') }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-none">
          <q-form @submit="saveProfile" class="q-gutter-md">
            <q-input
              v-model="profileForm.name"
              :label="$t('settings.profileName') || 'Profile Name'"
              filled
              :rules="[(val) => !!val || $t('settings.profileNameRequired') || 'Profile name is required']"
              :hint="$t('settings.profileNameHint') || 'e.g., EPCOR - Edmonton'"
            />

            <q-input
              v-model="profileForm.jurisdiction"
              :label="$t('settings.jurisdiction') || 'Jurisdiction'"
              filled
              :hint="$t('settings.jurisdictionHint') || 'e.g., Edmonton, AB'"
            />

            <q-input
              v-model="profileForm.utility"
              :label="$t('settings.utility') || 'Utility Company'"
              filled
              :hint="$t('settings.utilityHint') || 'e.g., EPCOR'"
            />

            <q-separator />

            <div class="text-subtitle2">{{ $t('settings.panelBreakerSizes') || 'Panel Breaker Sizes' }}</div>
            <div class="text-caption text-grey-6 q-mb-sm">
              {{ $t('settings.breakerSizesHint') || 'Select which breaker sizes are available in your jurisdiction' }}
            </div>

            <div class="row q-col-gutter-sm">
              <div
                v-for="size in standardBreakerSizes"
                :key="size"
                class="col-auto"
              >
                <q-checkbox
                  v-model="selectedBreakerSizes"
                  :val="size"
                  :label="`${size}A`"
                  color="primary"
                />
              </div>
            </div>

            <q-checkbox
              v-model="profileForm.isDefault"
              :label="$t('settings.setAsDefault') || 'Set as Default Profile'"
              color="primary"
            />

            <div class="row q-gutter-sm justify-end q-mt-md">
              <q-btn
                flat
                :label="$t('settings.cancel') || 'Cancel'"
                color="grey"
                @click="showProfileDialog = false"
              />
              <q-btn
                type="submit"
                color="primary"
                :label="$t('settings.save') || 'Save'"
                icon="save"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { i18n } from '../boot/i18n';
import FontSizeControl from '../components/common/FontSizeControl.vue';
// Pinia Stores Integration
import { useUserStore, useSettingsStore } from '../pinia-stores';
import { storeToRefs } from 'pinia';
import type { JurisdictionProfile } from '../pinia-stores/types';

const $q = useQuasar();
// Get i18n instance and locale at setup top level (required by Vue i18n)
const { t, locale } = useI18n();

// Initialize Pinia Stores
const userStore = useUserStore();
const settingsStore = useSettingsStore();

const { currentUser, isAuthenticated } = storeToRefs(userStore);
const { theme, language: storedLanguage, jurisdictionConfig, activeProfile } = storeToRefs(settingsStore);

// User profile computed from store (read-only)
const userProfile = computed({
  get: () => ({
    fullName: currentUser.value?.fullName || '',
    email: currentUser.value?.email || '',
    licenseNumber: currentUser.value?.licenseNumber || '',
    company: currentUser.value?.company || '',
    bio: currentUser.value?.bio || ''
  }),
  set: (value) => {
    // This allows v-model to work, actual save happens in onSaveProfile
  }
});

// Local edit state (required for v-model reactivity)
const editProfile = reactive({
  fullName: '',
  email: '',
  licenseNumber: '',
  company: '',
  bio: ''
});

// 密码修改表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// Form ref for clearing validation
const passwordFormRef = ref<any>(null);

// Preference settings from store
const themeMode = computed({
  get: () => theme.value || 'auto',
  set: (val) => settingsStore.setTheme(val as 'light' | 'dark' | 'auto')
});

const language = computed({
  get: () => storedLanguage.value || 'en-CA', // Use same default as settings store
  set: (val: any) => settingsStore.setLanguage(val.value || val)
});

// Theme options for q-btn-toggle
const themeOptions = computed(() => [
  { label: t('settings.light'), value: 'light' },
  { label: t('settings.dark'), value: 'dark' },
  { label: t('settings.auto'), value: 'auto' }
]);

// Language options for q-select - always show native names
const languageOptions = [
  { label: '中文 (简体)', value: 'zh-CN' },
  { label: 'English', value: 'en-CA' },
  { label: 'Français', value: 'fr-CA' }
];

// 加载状态
const saving = ref(false);
const changingPassword = ref(false);

// Jurisdiction Configuration
const showProfileDialog = ref(false);
const editingProfile = ref<JurisdictionProfile | null>(null);
const standardBreakerSizes = [60, 100, 125, 150, 200, 225, 250, 300, 400];
const selectedBreakerSizes = ref<number[]>([]);

const profileForm = reactive({
  name: '',
  jurisdiction: '',
  utility: '',
  isDefault: false
});

const profiles = computed(() => jurisdictionConfig.value?.profiles || []);

// Profile Management Functions
function openEditProfile(profile: JurisdictionProfile) {
  editingProfile.value = profile;
  profileForm.name = profile.name;
  profileForm.jurisdiction = profile.jurisdiction || '';
  profileForm.utility = profile.utility || '';
  profileForm.isDefault = profile.isDefault || false;
  selectedBreakerSizes.value = profile.calculationRules.panelBreakerSizes?.enabled || [];
  showProfileDialog.value = true;
}

function saveProfile() {
  if (!profileForm.name || selectedBreakerSizes.value.length === 0) {
    $q.notify({
      type: 'negative',
      message: t('settings.profileValidationError') || 'Please provide a profile name and select at least one breaker size',
      position: 'top'
    });
    return;
  }

  if (editingProfile.value) {
    // Update existing profile
    settingsStore.updateJurisdictionProfile(editingProfile.value.id, {
      name: profileForm.name,
      jurisdiction: profileForm.jurisdiction || undefined,
      utility: profileForm.utility || undefined,
      calculationRules: {
        panelBreakerSizes: {
          enabled: selectedBreakerSizes.value.sort((a, b) => a - b)
        }
      },
      isDefault: profileForm.isDefault
    });
    
    $q.notify({
      type: 'positive',
      message: t('settings.profileUpdated') || 'Profile updated successfully',
      position: 'top',
      icon: 'check_circle'
    });
  } else {
    // Create new profile
    settingsStore.createJurisdictionProfile({
      name: profileForm.name,
      jurisdiction: profileForm.jurisdiction || undefined,
      utility: profileForm.utility || undefined,
      calculationRules: {
        panelBreakerSizes: {
          enabled: selectedBreakerSizes.value.sort((a, b) => a - b)
        }
      },
      isDefault: profileForm.isDefault
    });
    
    $q.notify({
      type: 'positive',
      message: t('settings.profileCreated') || 'Profile created successfully',
      position: 'top',
      icon: 'check_circle'
    });
  }

  // Configuration is automatically saved and will be used immediately in next calculation
  // No need to reload or refresh - the computed properties will reactively update

  // Reset form
  showProfileDialog.value = false;
  editingProfile.value = null;
  profileForm.name = '';
  profileForm.jurisdiction = '';
  profileForm.utility = '';
  profileForm.isDefault = false;
  selectedBreakerSizes.value = [];
}

function setAsDefault(profileId: string) {
  settingsStore.setDefaultJurisdictionProfile(profileId);
  $q.notify({
    type: 'positive',
    message: t('settings.defaultProfileSet') || 'Default profile updated',
    position: 'top'
  });
}

function confirmDeleteProfile(profile: JurisdictionProfile) {
  $q.dialog({
    title: t('settings.confirmDelete') || 'Confirm Delete',
    message: t('settings.deleteProfileConfirm', { name: profile.name }) || `Are you sure you want to delete "${profile.name}"?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    settingsStore.deleteJurisdictionProfile(profile.id);
    $q.notify({
      type: 'positive',
      message: t('settings.profileDeleted') || 'Profile deleted successfully',
      position: 'top'
    });
  });
}

// Watch dialog to reset form when closed
watch(showProfileDialog, (isOpen) => {
  if (!isOpen) {
    editingProfile.value = null;
    profileForm.name = '';
    profileForm.jurisdiction = '';
    profileForm.utility = '';
    profileForm.isDefault = false;
    selectedBreakerSizes.value = [];
  }
});

// Load user data on mount
onMounted(async () => {
  try {
    // Apply theme on mount (in case it was changed elsewhere)
    settingsStore.applyTheme();
    
    // Load from store to local edit state
    if (currentUser.value) {
      editProfile.fullName = currentUser.value.fullName || '';
      editProfile.email = currentUser.value.email || '';
      editProfile.licenseNumber = currentUser.value.licenseNumber || '';
      editProfile.company = currentUser.value.company || '';
      editProfile.bio = currentUser.value.bio || '';
    } else {
      // Initialize default user if none exists
      userStore.initialize();
      if (currentUser.value) {
        editProfile.fullName = currentUser.value.fullName;
        editProfile.email = currentUser.value.email;
        editProfile.licenseNumber = currentUser.value.licenseNumber || '';
        editProfile.company = currentUser.value.company || '';
        editProfile.bio = currentUser.value.bio || '';
      }
    }
  } catch (error) {
    console.error(t('settings.loadUserDataFailed'), error);
    $q.notify({
      type: 'negative',
      message: t('settings.loadUserDataFailed'),
      position: 'top'
    });
  }
});

// Save user profile to store
async function onSaveProfile() {
  saving.value = true;
  try {
    // Update user info in store
    await userStore.updateProfile({
      fullName: editProfile.fullName,
      email: editProfile.email,
      licenseNumber: editProfile.licenseNumber,
      company: editProfile.company,
      bio: editProfile.bio
    });
    
    $q.notify({
      type: 'positive',
      message: t('settings.saveProfileSuccess'),
      position: 'top',
      icon: 'check_circle'
    });
    
    console.log('Profile updated:', currentUser.value);
  } catch (error) {
    console.error('Save failed:', error);
    $q.notify({
      type: 'negative',
      message: t('settings.saveProfileFailed'),
      position: 'top'
    });
  } finally {
    saving.value = false;
  }
}

// 修改密码
async function onChangePassword() {
  changingPassword.value = true;
  try {
    // TODO: Implement API call to change password
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    $q.notify({
      type: 'positive',
      message: t('settings.changePasswordSuccess'),
      position: 'top'
    });
    
    // Reset form and clear validation
    passwordForm.currentPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
    
    // Clear form validation state
    if (passwordFormRef.value) {
      passwordFormRef.value.resetValidation();
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('settings.changePasswordFailed'),
      position: 'top'
    });
  } finally {
    changingPassword.value = false;
  }
}

// Reset profile to saved data from store
function resetProfile() {
  if (currentUser.value) {
    editProfile.fullName = currentUser.value.fullName;
    editProfile.email = currentUser.value.email;
    editProfile.licenseNumber = currentUser.value.licenseNumber || '';
    editProfile.company = currentUser.value.company || '';
    editProfile.bio = currentUser.value.bio || '';
    
    $q.notify({
      type: 'info',
      message: t('settings.resetToSavedData') || 'Reset to saved data',
      position: 'top'
    });
  }
}

// Theme switching
function onThemeChange(mode: string) {
  // Determine if should be dark
  const shouldBeDark = mode === 'dark' || 
    (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Update Quasar dark mode FIRST (before applying theme)
  $q.dark.set(shouldBeDark);
  
  // Update store (which calls applyTheme internally)
  settingsStore.setTheme(mode as 'light' | 'dark' | 'auto');
  
  // Force remove all dark classes for light mode
  if (mode === 'light') {
    // Remove all dark-related classes and attributes
    document.body.classList.remove('dark', 'body--dark', 'quasar-dark');
    document.documentElement.classList.remove('dark');
    document.body.classList.add('body--light', 'quasar-light');
    document.body.setAttribute('data-theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.style.backgroundColor = '#ffffff';
    document.documentElement.style.backgroundColor = '#ffffff';
  }
  
  // Apply theme again to ensure everything is synced
  settingsStore.applyTheme();
  
  const modeLabel = mode === 'light' ? t('settings.light') : mode === 'dark' ? t('settings.dark') : t('settings.auto');
  $q.notify({
    type: 'positive',
    message: t('settings.themeChanged', { mode: modeLabel }),
    position: 'top'
  });
}

// Language switching
function onLanguageChange(langValue: string) {
  // langValue is already the string value because of emit-value and map-options
  settingsStore.setLanguage(langValue as 'en-CA' | 'fr-CA' | 'zh-CN');
  
  // Update i18n locale - use the locale ref obtained at setup top level
  if (locale) {
    locale.value = langValue;
  }
  
  // Also update the i18n instance directly (from boot file)
  if (i18n && i18n.global) {
    i18n.global.locale.value = langValue;
  }
  
  // Force Vue to re-render by triggering a reactive update
  nextTick(() => {
    $q.notify({
      type: 'positive',
      message: t('settings.languageChanged'),
      position: 'top'
    });
    
    console.log('Language changed to:', langValue);
    console.log('Current i18n locale:', locale?.value || i18n?.global?.locale?.value);
  });
}
</script>
