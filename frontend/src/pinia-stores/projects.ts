// TradesPro - Project Management Store
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Project, ProjectCreateInput, ProjectUpdateInput, ProjectStatus } from './types';
import api from '../services/api';

export const useProjectsStore = defineStore('projects', () => {
  // State
  const projects = ref<Project[]>([]);
  const currentProject = ref<Project | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const searchQuery = ref('');
  const statusFilter = ref<ProjectStatus | ''>('');
  const sortBy = ref<'created_at' | 'updated_at' | 'name' | 'status'>('created_at');
  const sortOrder = ref<'asc' | 'desc'>('desc');

  // Getters
  const filteredProjects = computed(() => {
    let filtered = [...projects.value];

    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.location?.toLowerCase().includes(query) ||
        project.client_name?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter.value) {
      filtered = filtered.filter(project => project.status === statusFilter.value);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[sortBy.value];
      let bVal: any = b[sortBy.value];

      if (sortBy.value === 'created_at' || sortBy.value === 'updated_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal?.toLowerCase() || '';
      }

      if (sortOrder.value === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  });

  const projectsCount = computed(() => projects.value.length);
  
  const projectsByStatus = computed(() => {
    return {
      inProgress: projects.value.filter(p => p.status === 'inProgress').length,
      completed: projects.value.filter(p => p.status === 'completed').length,
      onHold: projects.value.filter(p => p.status === 'onHold').length,
      archived: projects.value.filter(p => p.status === 'archived').length,
    };
  });

  // Actions
  async function fetchProjects() {
    loading.value = true;
    error.value = null;
    try {
      // Call backend API to fetch projects
      const response = await api.get('/v1/projects');
      const items = response.data.items || [];
      
      // Convert backend response to frontend Project format
      projects.value = items.map((item: any) => ({
        id: String(item.id), // Backend returns integer ID, convert to string for frontend
        name: item.name,
        description: item.description || '',
        location: item.location || '',
        client_name: item.client_name || '',
        status: 'inProgress', // Backend doesn't have status field, use default
        created_at: item.created_at,
        updated_at: item.updated_at || item.created_at,
        calculations_count: 0, // This would need to be fetched separately or included in response
      }));
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.message || 'Failed to fetch projects';
      // On error, keep existing projects or use empty array
      if (projects.value.length === 0) {
        projects.value = [];
      }
    } finally {
      loading.value = false;
    }
  }

  async function fetchProject(id: string) {
    loading.value = true;
    error.value = null;
    try {
      // Call backend API to fetch project by ID
      const projectId = parseInt(id, 10);
      if (isNaN(projectId) || projectId <= 0) {
        throw new Error('Invalid project ID');
      }
      
      const response = await api.get(`/v1/projects/${projectId}`);
      const item = response.data;
      
      // Convert backend response to frontend Project format
      const project: Project = {
        id: String(item.id),
        name: item.name,
        description: item.description || '',
        location: item.location || '',
        client_name: item.client_name || '',
        status: 'inProgress', // Backend doesn't have status field, use default
        created_at: item.created_at,
        updated_at: item.updated_at || item.created_at,
        calculations_count: item.calculation_count || 0,
      };
      
      // Update or add to local projects list
      const index = projects.value.findIndex(p => p.id === id);
      if (index !== -1) {
        projects.value[index] = project;
      } else {
        projects.value.push(project);
      }
      
      currentProject.value = project;
      return project;
    } catch (err: any) {
      console.error('❌ Fetch project error:', err);
      error.value = err.response?.data?.detail || err.message || 'Failed to fetch project';
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function createProject(input: ProjectCreateInput) {
    loading.value = true;
    error.value = null;
    try {
      console.log('📤 Creating project:', input);
      // Call backend API to create project
      const response = await api.post('/v1/projects', input);
      console.log('✅ Project created successfully:', response.data);
      const newProject: Project = {
        id: String(response.data.id), // Backend returns integer ID, convert to string for frontend
        name: response.data.name,
        description: response.data.description || '',
        location: response.data.location || '',
        client_name: response.data.client_name || '',
        status: 'inProgress', // Backend doesn't return status, use default
        created_at: response.data.created_at,
        updated_at: response.data.updated_at || response.data.created_at,
        calculations_count: 0,
      };
      
      projects.value.unshift(newProject);
      currentProject.value = newProject;
      
      return newProject;
    } catch (err: any) {
      console.error('❌ Create project error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          baseURL: err.config?.baseURL,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      
      // Provide user-friendly error messages
      let errorMsg = 'Failed to create project';
      if (err.response) {
        const status = err.response.status;
        if (status === 401) {
          errorMsg = 'Authentication required. Please login first.';
        } else if (status === 403) {
          errorMsg = 'Insufficient permissions to create project.';
        } else {
          errorMsg = err.response?.data?.detail || err.message || 'Failed to create project';
        }
      } else {
        errorMsg = err.message || 'Failed to create project';
      }
      
      error.value = errorMsg;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function updateProject(id: string, input: ProjectUpdateInput) {
    loading.value = true;
    error.value = null;
    try {
      // Call backend API to update project
      const projectId = parseInt(id, 10);
      if (isNaN(projectId) || projectId <= 0) {
        throw new Error('Invalid project ID');
      }
      
      // Prepare update payload - only include provided fields
      const updatePayload: any = {};
      if (input.name !== undefined) updatePayload.name = input.name;
      if (input.description !== undefined) updatePayload.description = input.description;
      if (input.location !== undefined) updatePayload.location = input.location;
      if (input.client_name !== undefined) updatePayload.client_name = input.client_name;
      
      const response = await api.put(`/v1/projects/${projectId}`, updatePayload);
      const item = response.data;
      
      // Convert backend response to frontend Project format
      const updatedProject: Project = {
        id: String(item.id),
        name: item.name,
        description: item.description || '',
        location: item.location || '',
        client_name: item.client_name || '',
        status: 'inProgress', // Backend doesn't have status field, use default
        created_at: item.created_at,
        updated_at: item.updated_at || item.created_at,
        calculations_count: item.calculation_count || 0,
      };
      
      // Update local projects list
      const index = projects.value.findIndex(p => p.id === id);
      if (index !== -1) {
        projects.value[index] = updatedProject;
      } else {
        projects.value.push(updatedProject);
      }
      
      // Update current project if it's the one being updated
      if (currentProject.value?.id === id) {
        currentProject.value = updatedProject;
      }
      
      return updatedProject;
    } catch (err: any) {
      console.error('❌ Update project error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          baseURL: err.config?.baseURL,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      
      // Provide user-friendly error messages
      let errorMsg = 'Failed to update project';
      if (err.response) {
        const status = err.response.status;
        if (status === 401) {
          errorMsg = 'Authentication required. Please login first.';
        } else if (status === 403) {
          errorMsg = 'Insufficient permissions to update project.';
        } else {
          errorMsg = err.response?.data?.detail || err.message || 'Failed to update project';
        }
      } else {
        errorMsg = err.message || 'Failed to update project';
      }
      
      error.value = errorMsg;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function deleteProject(id: string) {
    loading.value = true;
    error.value = null;
    try {
      // Call backend API to delete project
      const projectId = parseInt(id, 10);
      if (isNaN(projectId) || projectId <= 0) {
        throw new Error('Invalid project ID');
      }
      
      await api.delete(`/v1/projects/${projectId}`);
      
      // Remove from local projects list
      const index = projects.value.findIndex(p => p.id === id);
      if (index !== -1) {
        projects.value.splice(index, 1);
      }
      
      // Clear current project if it's the one being deleted
      if (currentProject.value?.id === id) {
        currentProject.value = null;
      }
      
      return true;
    } catch (err: any) {
      console.error('❌ Delete project error:', err);
      error.value = err.response?.data?.detail || err.message || 'Failed to delete project';
      return false;
    } finally {
      loading.value = false;
    }
  }

  function setCurrentProject(project: Project | null) {
    currentProject.value = project;
  }

  function clearCurrentProject() {
    currentProject.value = null;
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query;
  }

  function setStatusFilter(status: ProjectStatus | '') {
    statusFilter.value = status;
  }

  function setSortBy(field: 'created_at' | 'updated_at' | 'name' | 'status') {
    if (sortBy.value === field) {
      // Toggle sort order
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy.value = field;
      sortOrder.value = 'desc';
    }
  }

  function clearFilters() {
    searchQuery.value = '';
    statusFilter.value = '';
    sortBy.value = 'created_at';
    sortOrder.value = 'desc';
  }

  return {
    // State
    projects,
    currentProject,
    loading,
    error,
    searchQuery,
    statusFilter,
    sortBy,
    sortOrder,
    
    // Getters
    filteredProjects,
    projectsCount,
    projectsByStatus,
    
    // Actions
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    clearCurrentProject,
    setSearchQuery,
    setStatusFilter,
    setSortBy,
    clearFilters,
  };
}, {
  persist: true,
});

