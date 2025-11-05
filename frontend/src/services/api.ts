
// frontend/src/services/api.ts
import axios from 'axios';

// Determine API base URL
// Priority: 1. Environment variable, 2. Auto-detect from window location, 3. Default localhost
function getApiBaseURL(): string {
  // 1. Check environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 2. Auto-detect from current window location
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Check if this is a local IP address (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    const isLocalIP = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(hostname) || 
                      hostname === 'localhost' || 
                      hostname === '127.0.0.1';
    
    // If it's a local IP address, use the same IP with port 8000 for backend
    if (isLocalIP) {
      const backendURL = `${protocol}//${hostname}:8000/api`;
      console.log('🌐 Local network detected - Using same IP for backend:', backendURL);
      return backendURL;
    }
    
    // If not localhost/IP, check if it's a tunnel/proxy service
    const isTunnel = hostname.includes('ngrok') || 
                     hostname.includes('cloudflare') || 
                     hostname.includes('tunnel') ||
                     hostname.includes('localhost.run');
    
    if (isTunnel) {
      // For tunnel services, use same hostname with port 8000
      const backendURL = `${protocol}//${hostname}:8000/api`;
      console.log('🌐 Tunnel detected - Backend URL:', backendURL);
      return backendURL;
    }
    
    // For other domains (production, etc.), use same hostname with port 8000
    const backendURL = `${protocol}//${hostname}:8000/api`;
    console.log('🌐 Auto-detected API base URL:', backendURL);
    return backendURL;
  }
  
  // 3. Default to localhost for local development
  return 'http://localhost:8000/api';
}

// 1. 创建 Axios 实例
const api = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 30000, // 30 seconds timeout for network requests
});

// Log API configuration for debugging
console.log('📡 API Configuration:', {
  baseURL: api.defaults.baseURL,
  env: import.meta.env.MODE,
  viteApiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  note: api.defaults.baseURL.includes('your-backend-ngrok-url') 
    ? '⚠️ WARNING: Using placeholder URL! Please set VITE_API_BASE_URL in .env.local'
    : '✅ API URL configured'
});

// 2. 添加请求拦截器 (Request Interceptor)
api.interceptors.request.use(
  async (config) => {
    // 通过动态导入打破循环依赖
    const { useUserStore } = await import('../pinia-stores/user');
    const userStore = useUserStore();
    const token = userStore.token;

    // 如果存在 token，则在每个请求的 Header 中添加 Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Debug logging for internet access troubleshooting
      if (config.url && !config.url.includes('/auth/token')) {
        console.log('🔐 Request with auth:', {
          url: config.url,
          baseURL: config.baseURL,
          hasToken: !!token,
          tokenPrefix: token.substring(0, 20) + '...'
        });
      }
    } else {
      // Log when token is missing (for debugging)
      // Only warn for protected endpoints (not auth endpoints)
      if (config.url && 
          !config.url.includes('/auth/token') && 
          !config.url.includes('/auth/register') &&
          !config.url.includes('/auth/me')) {
        console.warn('⚠️ Request without token:', {
          url: config.url,
          baseURL: config.baseURL,
          fullURL: `${config.baseURL}${config.url}`
        });
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. 添加响应拦截器 (Response Interceptor) - 可选
api.interceptors.response.use(
  (response) => {
    // 直接返回响应数据
    return response;
  },
  async (error) => {
    // 处理全局错误，例如 401 未授权
    // 但不要在登录端点(/auth/token)时自动登出，因为登录失败是正常的
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || '';
      // 如果是登录端点，不要自动登出（让登录页面自己处理错误）
      if (!requestUrl.includes('/auth/token')) {
        const { useUserStore } = await import('../pinia-stores/user');
        const userStore = useUserStore();
        userStore.logout(); // Token 无效或过期，自动登出
      }
    }
    return Promise.reject(error);
  }
);

export default api;
