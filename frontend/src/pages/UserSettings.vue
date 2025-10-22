<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h5">用户设置</div>
      <q-space />
      <q-chip color="primary" text-color="white" icon="person">
        用户管理
      </q-chip>
    </div>

    <q-card>
      <q-card-section>
        <div class="text-h6">个人信息</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form @submit="onSaveProfile" class="q-gutter-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="userProfile.fullName"
                label="姓名"
                filled
                :rules="[(val) => !!val || '请输入姓名']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="userProfile.email"
                label="邮箱"
                type="email"
                filled
                readonly
                hint="邮箱不可修改"
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="userProfile.licenseNumber"
                label="工程师执照号"
                filled
                hint="可选"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="userProfile.company"
                label="公司/机构"
                filled
                hint="可选"
              />
            </div>
          </div>

          <q-input
            v-model="userProfile.bio"
            label="个人简介"
            type="textarea"
            filled
            rows="3"
            hint="可选"
          />

          <div class="row q-gutter-sm">
            <q-btn
              type="submit"
              color="primary"
              label="保存设置"
              icon="save"
              :loading="saving"
            />
            <q-btn
              flat
              color="grey"
              label="重置"
              icon="refresh"
              @click="resetProfile"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <q-card class="q-mt-md">
      <q-card-section>
        <div class="text-h6">账户安全</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form @submit="onChangePassword" class="q-gutter-md">
          <q-input
            v-model="passwordForm.currentPassword"
            label="当前密码"
            type="password"
            filled
            :rules="[(val) => !!val || '请输入当前密码']"
          />

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="passwordForm.newPassword"
                label="新密码"
                type="password"
                filled
                :rules="[
                  (val) => !!val || '请输入新密码',
                  (val) => val.length >= 8 || '密码至少8位'
                ]"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="passwordForm.confirmPassword"
                label="确认新密码"
                type="password"
                filled
                :rules="[
                  (val) => !!val || '请确认新密码',
                  (val) => val === passwordForm.newPassword || '密码不匹配'
                ]"
              />
            </div>
          </div>

          <q-btn
            type="submit"
            color="warning"
            label="修改密码"
            icon="lock"
            :loading="changingPassword"
          />
        </q-form>
      </q-card-section>
    </q-card>

    <q-card class="q-mt-md">
      <q-card-section>
        <div class="text-h6">偏好设置</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="q-gutter-md">
          <div class="row items-center">
            <div class="col-6">
              <div class="text-subtitle2">字体大小</div>
              <div class="text-caption text-grey-6">调整界面字体大小</div>
            </div>
            <div class="col-6">
              <FontSizeControl />
            </div>
          </div>

          <q-separator />

          <div class="row items-center">
            <div class="col-6">
              <div class="text-subtitle2">主题模式</div>
              <div class="text-caption text-grey-6">选择界面主题</div>
            </div>
            <div class="col-6">
              <q-btn-toggle
                v-model="themeMode"
                :options="[
                  { label: '浅色', value: 'light' },
                  { label: '深色', value: 'dark' },
                  { label: '自动', value: 'auto' }
                ]"
                color="primary"
                @update:model-value="onThemeChange"
              />
            </div>
          </div>

          <q-separator />

          <div class="row items-center">
            <div class="col-6">
              <div class="text-subtitle2">语言设置</div>
              <div class="text-caption text-grey-6">选择界面语言</div>
            </div>
            <div class="col-6">
              <q-select
                v-model="language"
                :options="[
                  { label: '中文', value: 'zh-CN' },
                  { label: 'English', value: 'en-US' }
                ]"
                filled
                dense
                @update:model-value="onLanguageChange"
              />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import FontSizeControl from '../components/common/FontSizeControl.vue';

const $q = useQuasar();

// 用户资料
const userProfile = reactive({
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

// 偏好设置
const themeMode = ref('auto');
const language = ref('zh-CN');

// 加载状态
const saving = ref(false);
const changingPassword = ref(false);

// 加载用户数据
onMounted(async () => {
  try {
    // TODO: 从API加载用户数据
    userProfile.fullName = '测试用户';
    userProfile.email = 'user@example.com';
    userProfile.licenseNumber = 'P.Eng-12345';
    userProfile.company = '示例工程公司';
    userProfile.bio = '电气工程师，专注于CEC标准计算';
  } catch (error) {
    console.error('加载用户数据失败:', error);
  }
});

// 保存用户资料
async function onSaveProfile() {
  saving.value = true;
  try {
    // TODO: 调用API保存用户资料
    await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
    
    $q.notify({
      type: 'positive',
      message: '用户资料已保存',
      position: 'top'
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '保存失败',
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
    // TODO: 调用API修改密码
    await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
    
    $q.notify({
      type: 'positive',
      message: '密码修改成功',
      position: 'top'
    });
    
    // 重置表单
    passwordForm.currentPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '密码修改失败',
      position: 'top'
    });
  } finally {
    changingPassword.value = false;
  }
}

// 重置用户资料
function resetProfile() {
  userProfile.fullName = '测试用户';
  userProfile.email = 'user@example.com';
  userProfile.licenseNumber = 'P.Eng-12345';
  userProfile.company = '示例工程公司';
  userProfile.bio = '电气工程师，专注于CEC标准计算';
}

// 主题切换
function onThemeChange(mode: string) {
  $q.dark.set(mode === 'dark' ? true : mode === 'light' ? false : null);
}

// 语言切换
function onLanguageChange(lang: string) {
  // TODO: 实现语言切换
  console.log('切换语言:', lang);
}
</script>
