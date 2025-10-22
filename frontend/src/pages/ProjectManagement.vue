<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h5">{{ $t('projects.title') }}</div>
      <q-space />
      <q-btn
        color="primary"
        :label="$t('projects.newProject')"
        icon="add"
        @click="showCreateDialog = true"
      />
    </div>

    <!-- 项目列表 -->
    <q-card>
      <q-card-section>
        <div class="text-h6">{{ $t('projects.myProjects') }}</div>
        <div class="text-caption text-grey-6">
          {{ $t('projects.description') }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <!-- 搜索和筛选 -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model="searchQuery"
              :label="$t('projects.searchProjects')"
              filled
              clearable
              @input="filterProjects"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="sortBy"
              :options="sortOptions"
              :label="$t('projects.sortBy')"
              filled
              @update:model-value="sortProjects"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="statusFilter"
              :options="statusOptions"
              :label="$t('projects.statusFilter')"
              filled
              clearable
              @update:model-value="filterProjects"
            />
          </div>
        </div>

        <!-- 项目网格 -->
        <div class="row q-col-gutter-md">
          <div
            v-for="project in filteredProjects"
            :key="project.id"
            class="col-12 col-md-6 col-lg-4"
          >
            <q-card class="project-card" @click="openProject(project)">
              <q-card-section>
                <div class="row items-center">
                  <div class="text-h6">{{ project.name }}</div>
                  <q-space />
                  <q-chip
                    :color="getStatusColor(project.status)"
                    text-color="white"
                    size="sm"
                  >
                    {{ getStatusLabel(project.status) }}
                  </q-chip>
                </div>
                <div class="text-caption text-grey-6 q-mt-xs">
                  {{ project.description || $t('projects.noDescription') }}
                </div>
              </q-card-section>

              <q-card-section class="q-pt-none">
                <div class="row q-col-gutter-sm">
                  <div class="col-6">
                    <div class="text-caption text-grey-6">{{ $t('projects.location') }}</div>
                    <div class="text-body2">{{ project.location || $t('projects.notSet') }}</div>
                  </div>
                  <div class="col-6">
                    <div class="text-caption text-grey-6">{{ $t('projects.client') }}</div>
                    <div class="text-body2">{{ project.client_name || $t('projects.notSet') }}</div>
                  </div>
                </div>
              </q-card-section>

              <q-card-section class="q-pt-none">
                <div class="row items-center">
                  <div class="text-caption text-grey-6">
                    {{ $t('projects.createdAt') }} {{ formatDate(project.created_at) }}
                  </div>
                  <q-space />
                  <div class="text-caption text-grey-6">
                    {{ project.calculations_count || 0 }} {{ $t('projects.calculations') }}
                  </div>
                </div>
              </q-card-section>

              <q-card-actions>
                <q-btn
                  flat
                  color="primary"
                  :label="$t('projects.view')"
                  icon="visibility"
                  @click.stop="openProject(project)"
                />
                <q-btn
                  flat
                  color="grey"
                  :label="$t('projects.edit')"
                  icon="edit"
                  @click.stop="editProject(project)"
                />
                <q-space />
                <q-btn
                  flat
                  round
                  color="negative"
                  icon="delete"
                  @click.stop="deleteProject(project)"
                />
              </q-card-actions>
            </q-card>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredProjects.length === 0" class="text-center q-py-xl">
          <q-icon name="folder_open" size="64px" color="grey-4" />
          <div class="text-h6 text-grey-6 q-mt-md">{{ $t('projects.noProjects') }}</div>
          <div class="text-caption text-grey-5 q-mb-md">
            {{ searchQuery ? $t('projects.noProjectsFound') : $t('projects.createFirstProject') }}
          </div>
          <q-btn
            v-if="!searchQuery"
            color="primary"
            :label="$t('projects.createProject')"
            icon="add"
            @click="showCreateDialog = true"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- 创建项目对话框 -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ $t('projects.createNewProject') }}</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="onCreateProject" class="q-gutter-md">
            <q-input
              v-model="newProject.name"
              :label="$t('projects.projectName')"
              filled
              :rules="[(val) => !!val || $t('projects.enterProjectName')]"
            />

            <q-input
              v-model="newProject.description"
              :label="$t('projects.projectDescription')"
              type="textarea"
              filled
              rows="3"
            />

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input
                  v-model="newProject.location"
                  :label="$t('projects.projectLocation')"
                  filled
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="newProject.client_name"
                  :label="$t('projects.clientName')"
                  filled
                />
              </div>
            </div>
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            :label="$t('projects.cancel')"
            @click="showCreateDialog = false"
          />
          <q-btn
            color="primary"
            :label="$t('projects.create')"
            @click="onCreateProject"
            :loading="creating"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

// Access i18n in legacy mode
const instance = getCurrentInstance();
const i18n = instance?.proxy?.$i18n;

// Helper function to get translation
function $t(key: string, params?: any): string {
  return instance?.proxy?.$t(key, params) || key;
}

// 项目数据
const projects = ref([
  {
    id: 1,
    name: '住宅电气设计',
    description: '单户住宅电气负载计算',
    location: '多伦多',
    client_name: '张三',
    status: 'inProgress',
    created_at: '2024-01-15T10:30:00Z',
    calculations_count: 3
  },
  {
    id: 2,
    name: '商业建筑电气',
    description: '办公楼电气系统设计',
    location: '温哥华',
    client_name: 'ABC建筑公司',
    status: 'completed',
    created_at: '2024-01-10T14:20:00Z',
    calculations_count: 8
  }
]);

// 搜索和筛选
const searchQuery = ref('');
const sortBy = ref('created_at');
const statusFilter = ref('');

// 新建项目
const showCreateDialog = ref(false);
const creating = ref(false);
const newProject = reactive({
  name: '',
  description: '',
  location: '',
  client_name: ''
});

// 选项数据 - 使用computed使其响应i18n变化
const sortOptions = computed(() => [
  { label: $t('projects.sort.createdAt'), value: 'created_at' },
  { label: $t('projects.sort.name'), value: 'name' },
  { label: $t('projects.sort.status'), value: 'status' }
]);

const statusOptions = computed(() => [
  { label: $t('projects.status.inProgress'), value: 'inProgress' },
  { label: $t('projects.status.completed'), value: 'completed' },
  { label: $t('projects.status.onHold'), value: 'onHold' }
]);

// 计算属性
const filteredProjects = computed(() => {
  let filtered = projects.value;

  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(project =>
      project.name.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query) ||
      project.location?.toLowerCase().includes(query) ||
      project.client_name?.toLowerCase().includes(query)
    );
  }

  // 状态筛选
  if (statusFilter.value) {
    filtered = filtered.filter(project => project.status === statusFilter.value);
  }

  // 排序
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'status':
        return a.status.localeCompare(b.status);
      case 'created_at':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return filtered;
});

// 方法
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'inProgress': 'primary',
    'completed': 'positive',
    'onHold': 'warning'
  };
  return colors[status] || 'grey';
}

function getStatusLabel(status: string): string {
  return $t(`projects.status.${status}`);
}

function formatDate(dateString: string): string {
  const locale = i18n?.locale || 'en-CA';
  return new Date(dateString).toLocaleDateString(locale);
}

function openProject(project: any) {
  // TODO: 导航到项目详情页面
  console.log('打开项目:', project);
}

function editProject(project: any) {
  // TODO: 打开编辑对话框
  console.log('编辑项目:', project);
}

function deleteProject(project: any) {
  $q.dialog({
    title: $t('projects.deleteConfirm'),
    message: $t('projects.deleteMessage', { name: project.name }),
    cancel: true,
    persistent: true
  }).onOk(() => {
    const index = projects.value.findIndex(p => p.id === project.id);
    if (index > -1) {
      projects.value.splice(index, 1);
      $q.notify({
        type: 'positive',
        message: $t('projects.projectDeleted'),
        position: 'top'
      });
    }
  });
}

async function onCreateProject() {
  creating.value = true;
  try {
    // TODO: 调用API创建项目
    await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
    
    const newId = Math.max(...projects.value.map(p => p.id)) + 1;
    projects.value.unshift({
      id: newId,
      name: newProject.name,
      description: newProject.description,
      location: newProject.location,
      client_name: newProject.client_name,
      status: 'inProgress',
      created_at: new Date().toISOString(),
      calculations_count: 0
    });

    $q.notify({
      type: 'positive',
      message: $t('projects.projectCreated'),
      position: 'top'
    });

    // 重置表单
    newProject.name = '';
    newProject.description = '';
    newProject.location = '';
    newProject.client_name = '';
    showCreateDialog.value = false;
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: $t('projects.createFailed'),
      position: 'top'
    });
  } finally {
    creating.value = false;
  }
}

function filterProjects() {
  // 触发计算属性更新
}

function sortProjects() {
  // 触发计算属性更新
}

// 初始化
onMounted(() => {
  // TODO: 从API加载项目列表
});
</script>

<style scoped>
.project-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
