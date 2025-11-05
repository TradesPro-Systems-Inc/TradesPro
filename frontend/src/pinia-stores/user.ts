// TradesPro - User Management Store
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, UserProfile } from './types';
import api from '../services/api';

export const useUserStore = defineStore('user', () => {
  // State - Load token from localStorage on initialization
  // Try multiple storage keys for compatibility
  const getStoredToken = (): string | null => {
    // Try standard key first
    const token1 = localStorage.getItem('access_token');
    if (token1) return token1;
    
    // Try alternative key (for compatibility)
    const token2 = localStorage.getItem('tradespro-access-token');
    if (token2) return token2;
    
    return null;
  };
  
  const token = ref<string | null>(getStoredToken());
  const currentUser = ref<User | null>(null);
  const isAuthenticated = computed(() => !!token.value);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const userEmail = computed(() => currentUser.value?.email || '');
  const userFullName = computed(() => currentUser.value?.fullName || '未登录');
  const userTier = computed(() => currentUser.value?.tier || (isAuthenticated.value ? 'tier1' : 'guest'));
  const userInitials = computed(() => {
    if (!currentUser.value?.fullName) return undefined;
    const names = currentUser.value.fullName.split(' ');
    return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
  });

  // Actions
  async function login(email: string, password: string) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post('/v1/auth/token', { email, password });
      
      if (response.data.access_token) {
        token.value = response.data.access_token;
        
        // Save token to localStorage (multiple keys for compatibility)
        localStorage.setItem('access_token', token.value);
        localStorage.setItem('tradespro-access-token', token.value);  // Backup key
        
        console.log('✅ Token saved:', {
          hasToken: !!token.value,
          tokenLength: token.value.length,
          baseURL: api.defaults.baseURL
        });
        
        await fetchCurrentUser(); // 获取用户信息
        return true;
      }
      return false;
    } catch (err: any) {
      // Extract error message from various possible formats
      // Default message will be translated in the component
      let errorMessage = '';
      
      if (err.response) {
        // FastAPI error format: { detail: "..." }
        if (err.response.data?.detail) {
          const detail = err.response.data.detail;
          // Map common backend error messages to translation keys
          if (detail.toLowerCase().includes('incorrect') || 
              detail.toLowerCase().includes('invalid') ||
              detail.toLowerCase().includes('email or password') ||
              detail.toLowerCase().includes('credentials')) {
            errorMessage = 'invalidCredentials'; // Use translation key
          } else if (detail.toLowerCase().includes('disabled') || 
                     detail.toLowerCase().includes('inactive')) {
            errorMessage = 'accountDisabled'; // Use translation key
          } else {
            // Use backend message directly if it's user-friendly
            errorMessage = detail;
          }
        }
        // Alternative format: { error: { message: "..." } }
        else if (err.response.data?.error?.message) {
          errorMessage = err.response.data.error.message;
        }
        // Plain string
        else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        }
        // Status code based messages
        else if (err.response.status === 401) {
          errorMessage = 'invalidCredentials'; // Translation key
        } else if (err.response.status === 403) {
          errorMessage = 'accountDisabled'; // Translation key
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // If no error message extracted, use default translation key
      if (!errorMessage) {
        errorMessage = 'loginFailed'; // Translation key
      }
      
      error.value = errorMessage;
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function register(email: string, password: string, fullName: string) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post('/v1/auth/register', {
        email,
        password,
        full_name: fullName
      });
      
      if (response.data.access_token) {
        token.value = response.data.access_token;
        
        // Save token to localStorage
        localStorage.setItem('access_token', token.value);
        
        await fetchCurrentUser(); // 获取用户信息
        return true;
      }
      return false;
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.message || '注册失败';
      return false;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    currentUser.value = null;
    token.value = null;
    error.value = null;
    
    // Remove token from localStorage (all keys)
    localStorage.removeItem('access_token');
    localStorage.removeItem('tradespro-access-token');  // Backup key
  }

  async function updateProfile(profile: Partial<UserProfile>) {
    loading.value = true;
    error.value = null;
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (currentUser.value) {
        currentUser.value = {
          ...currentUser.value,
          ...profile,
          updatedAt: new Date().toISOString(),
        };
      }
      
      return true;
    } catch (err: any) {
      error.value = err.message || '更新失败';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    loading.value = true;
    error.value = null;
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (err: any) {
      error.value = err.message || '密码修改失败';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCurrentUser() {
    if (!token.value) return;
    
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/v1/auth/me');
      // Map backend response to frontend User type
      const userData = response.data;
      currentUser.value = {
        id: userData.id.toString(),
        email: userData.email,
        fullName: userData.full_name || '',
        tier: userData.tier || 'tier1', // 从后端获取用户等级，默认为tier1
        company: userData.company || '',
        licenseNumber: userData.license_number || '',
        phone: userData.phone || '',
        bio: userData.bio || '',
        createdAt: userData.created_at,
        updatedAt: userData.updated_at || userData.created_at,
      };
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.message || '获取用户信息失败';
      // If token is invalid, logout (handled by interceptor)
    } finally {
      loading.value = false;
    }
  }

  // Initialize - check if user is already logged in
  async function initialize() {
    // Token is already loaded from localStorage in the ref initialization
    // Fetch user info if we have a token
    if (token.value && !currentUser.value) {
      try {
        await fetchCurrentUser();
      } catch (err: any) {
        // If token is invalid (401), clear it
        if (err.response?.status === 401) {
          console.warn('⚠️ Token invalid, clearing...');
          token.value = null;
          localStorage.removeItem('access_token');
          localStorage.removeItem('tradespro-access-token');
        }
      }
    }
  }

  return {
    // State
    currentUser,
    isAuthenticated,
    token,
    loading,
    error,
    
    // Getters
    userEmail,
    userFullName,
    userTier,
    userInitials,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    fetchCurrentUser,
    initialize,
  };
}, {
  persist: true,
});

