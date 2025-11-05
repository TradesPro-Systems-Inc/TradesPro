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

    <!-- Projects list -->
    <q-card>
      <q-card-section>
        <div class="text-h6">{{ $t('projects.myProjects') }}</div>
        <div class="text-caption text-grey-6">
          {{ $t('projects.description') }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <!-- Search and filters -->
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

        <!-- Projects grid -->
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

        <!-- Empty state -->
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

    <!-- View project details dialog -->
    <q-dialog v-model="showViewDialog">
      <q-card style="min-width: 500px; max-width: 700px">
        <q-card-section>
          <div class="text-h6">{{ $t('projects.projectDetails') }}</div>
        </q-card-section>

        <q-card-section v-if="selectedProject" class="q-pt-none">
          <div class="q-gutter-md">
            <div>
              <div class="text-caption text-grey-6">{{ $t('projects.projectName') }}</div>
              <div class="text-body1">{{ selectedProject.name }}</div>
            </div>
            
            <div>
              <div class="text-caption text-grey-6">{{ $t('projects.projectDescription') }}</div>
              <div class="text-body2">{{ selectedProject.description || $t('projects.noDescription') }}</div>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <div class="text-caption text-grey-6">{{ $t('projects.projectLocation') }}</div>
                <div class="text-body2">{{ selectedProject.location || $t('projects.notSet') }}</div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey-6">{{ $t('projects.clientName') }}</div>
                <div class="text-body2">{{ selectedProject.client_name || $t('projects.notSet') }}</div>
              </div>
            </div>

            <q-separator />

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <div class="text-caption text-grey-6">{{ $t('projects.status') }}</div>
                <q-chip
                  :color="getStatusColor(selectedProject.status)"
                  text-color="white"
                  size="sm"
                >
                  {{ getStatusLabel(selectedProject.status) }}
                </q-chip>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey-6">{{ $t('projects.calculations') }}</div>
                <div class="text-body2">{{ selectedProject.calculations_count || 0 }}</div>
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <div class="text-caption text-grey-6">{{ $t('projects.createdAt') }}</div>
                <div class="text-body2">{{ formatDate(selectedProject.created_at) }}</div>
              </div>
              <div class="col-6" v-if="selectedProject.updated_at">
                <div class="text-caption text-grey-6">{{ $t('projects.updatedAt') }}</div>
                <div class="text-body2">{{ formatDate(selectedProject.updated_at) }}</div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            :label="$t('common.close')"
            @click="showViewDialog = false"
          />
          <q-btn
            color="primary"
            :label="$t('projects.edit')"
            icon="edit"
            @click="openEditDialogFromView"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Edit project dialog -->
    <q-dialog v-model="showEditDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ $t('projects.editProject') }}</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="onUpdateProject" class="q-gutter-md">
            <q-input
              v-model="editProjectForm.name"
              :label="$t('projects.projectName')"
              filled
              :rules="[(val) => !!val || $t('projects.enterProjectName')]"
            />

            <q-input
              v-model="editProjectForm.description"
              :label="$t('projects.projectDescription')"
              type="textarea"
              filled
              rows="3"
            />

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input
                  v-model="editProjectForm.location"
                  :label="$t('projects.projectLocation')"
                  filled
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="editProjectForm.client_name"
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
            @click="showEditDialog = false"
          />
          <q-btn
            color="primary"
            :label="$t('projects.save')"
            icon="save"
            @click="onUpdateProject"
            :loading="updating"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Create project dialog -->
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
// Pinia Stores Integration
import { useProjectsStore, useUserStore } from '../pinia-stores';
import { storeToRefs } from 'pinia';

const $q = useQuasar();

// Access i18n in legacy mode
const instance = getCurrentInstance();
const i18n = instance?.proxy?.$i18n;

// Helper function to get translation
function $t(key: string, params?: any): string {
  return instance?.proxy?.$t(key, params) || key;
}

// Initialize Pinia Stores
const projectsStore = useProjectsStore();
const userStore = useUserStore();
const { projects, searchQuery, sortBy, statusFilter, filteredProjects} = storeToRefs(projectsStore);
const { isAuthenticated } = storeToRefs(userStore);

// Dialog states
const showCreateDialog = ref(false);
const showViewDialog = ref(false);
const showEditDialog = ref(false);

// Operation states
const creating = ref(false);
const updating = ref(false);

// Selected project for view/edit
const selectedProject = ref<any>(null);
const editProjectId = ref<string | null>(null);

// New project form
const newProject = reactive({
  name: '',
  description: '',
  location: '',
  client_name: ''
});

// Edit project form
const editProjectForm = reactive({
  name: '',
  description: '',
  location: '',
  client_name: ''
});

// Options data - use computed to make it reactive to i18n changes
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

// filteredProjects is computed in the store and accessed via storeToRefs

// Methods
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

// View project details
function openProject(project: any) {
  selectedProject.value = project;
  showViewDialog.value = true;
}

// Open edit dialog from view dialog
function openEditDialogFromView() {
  if (selectedProject.value) {
    showViewDialog.value = false;
    editProject(selectedProject.value);
  }
}

// Edit project - open edit dialog
function editProject(project: any) {
  // Check if user is authenticated
  if (!isAuthenticated.value) {
    $q.dialog({
      title: $t('projects.authenticationRequired'),
      message: $t('projects.loginRequired'),
      ok: true,
      persistent: true
    }).onOk(() => {
      $q.notify({
        type: 'info',
        message: $t('projects.pleaseLogin'),
        position: 'top',
        timeout: 3000,
        icon: 'login'
      });
    });
    return;
  }

  selectedProject.value = project;
  editProjectId.value = project.id;
  
  // Populate edit form with current project data
  editProjectForm.name = project.name || '';
  editProjectForm.description = project.description || '';
  editProjectForm.location = project.location || '';
  editProjectForm.client_name = project.client_name || '';
  
  showEditDialog.value = true;
}

// Update project
async function onUpdateProject() {
  // Check if user is authenticated
  if (!isAuthenticated.value) {
    $q.dialog({
      title: $t('projects.authenticationRequired'),
      message: $t('projects.loginRequired'),
      ok: true,
      persistent: true
    }).onOk(() => {
      $q.notify({
        type: 'info',
        message: $t('projects.pleaseLogin'),
        position: 'top',
        timeout: 3000,
        icon: 'login'
      });
    });
    return;
  }

  if (!editProjectId.value) {
    return;
  }

  updating.value = true;
  try {
    const updated = await projectsStore.updateProject(editProjectId.value, {
      name: editProjectForm.name,
      description: editProjectForm.description,
      location: editProjectForm.location,
      client_name: editProjectForm.client_name
    });

    if (updated) {
      $q.notify({
        type: 'positive',
        message: $t('projects.projectUpdated'),
        position: 'top',
        icon: 'check_circle'
      });

      // Refresh projects list
      await projectsStore.fetchProjects();
      
      // Close dialog and reset form
      showEditDialog.value = false;
      editProjectId.value = null;
      selectedProject.value = null;
    } else {
      // Update failed - show error from store
      const errorMsg = projectsStore.error || $t('projects.updateFailed') || 'Failed to update project';
      $q.notify({
        type: 'negative',
        message: errorMsg,
        position: 'top',
        timeout: 5000,
        icon: 'error'
      });
    }
  } catch (error) {
    console.error('Update project failed:', error);
    $q.notify({
      type: 'negative',
      message: $t('projects.updateFailed') || 'Failed to update project',
      position: 'top'
    });
  } finally {
    updating.value = false;
  }
}

// Delete project using store action
async function deleteProject(project: any) {
  $q.dialog({
    title: $t('projects.deleteConfirm'),
    message: $t('projects.deleteMessage', { name: project.name }),
    cancel: true,
    persistent: true
  }).onOk(async () => {
    const deleted = await projectsStore.deleteProject(project.id);
    if (deleted) {
      $q.notify({
        type: 'positive',
        message: $t('projects.projectDeleted'),
        position: 'top',
        icon: 'check_circle'
      });
      // Refresh projects list
      await projectsStore.fetchProjects();
    } else {
      $q.notify({
        type: 'negative',
        message: projectsStore.error || $t('projects.deleteFailed') || 'Failed to delete project',
        position: 'top',
        timeout: 5000,
        icon: 'error'
      });
    }
  });
}

// Create project using store action
async function onCreateProject() {
  // Check if user is authenticated
  if (!isAuthenticated.value) {
    $q.dialog({
      title: $t('projects.authenticationRequired'),
      message: $t('projects.loginRequired'),
      ok: true,
      persistent: true
    }).onOk(() => {
      $q.notify({
        type: 'info',
        message: $t('projects.pleaseLogin'),
        position: 'top',
        timeout: 3000,
        icon: 'login'
      });
    });
    return;
  }

  creating.value = true;
  try {
    // Create project via store
    // Backend expects client_name (with underscore), not clientName
    const created = await projectsStore.createProject({
      name: newProject.name,
      description: newProject.description,
      location: newProject.location,
      client_name: newProject.client_name  // Use client_name to match backend schema
    });

    if (created) {
      $q.notify({
        type: 'positive',
        message: $t('projects.projectCreated'),
        position: 'top',
        icon: 'check_circle'
      });

      // Reset form
      newProject.name = '';
      newProject.description = '';
      newProject.location = '';
      newProject.client_name = '';
      showCreateDialog.value = false;
      
      // Refresh projects list to ensure sync (though new project is already added locally)
      // This ensures we have the latest data from server
      await projectsStore.fetchProjects();
      
      console.log('✅ Project created. Total:', projectsStore.projectsCount);
    } else {
      // Create failed - show error from store
      const errorMsg = projectsStore.error || $t('projects.createFailed');
      $q.notify({
        type: 'negative',
        message: errorMsg,
        position: 'top',
        timeout: 5000,
        icon: 'error'
      });
      console.error('❌ Create project failed:', projectsStore.error);
    }
  } catch (error) {
    console.error('Create project failed:', error);
    $q.notify({
      type: 'negative',
      message: $t('projects.createFailed'),
      position: 'top'
    });
  } finally {
    creating.value = false;
  }
}

// These functions trigger reactivity - store handles filtering/sorting
function filterProjects() {
  // Reactive computed in store handles this automatically
}

function sortProjects() {
  // Reactive computed in store handles this automatically
}

// Initialize - fetch projects from backend
onMounted(async () => {
  // Fetch projects from backend on mount
  if (projects.value.length === 0) {
    await projectsStore.fetchProjects();
  }
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
