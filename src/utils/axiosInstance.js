import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://dynamic-dashboard-backend.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Request with token:', {
        url: config.url,
        method: config.method,
        hasToken: !!token,
        tokenLength: token.length,
        tokenPreview: token.substring(0, 20) + '...',
      });
    } else {
      console.warn('Request without token:', {
        url: config.url,
        method: config.method,
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    
    // Log error for debugging
    console.log('API Error:', {
      status,
      url,
      message: error.message,
      responseData: error.response?.data,
      headers: error.config?.headers,
    });
    
    // Only handle 401 Unauthorized errors
    if (status === 401) {
      const isAuthEndpoint = url.includes('/auth/');
      
      // Don't clear session for auth endpoints (login/register)
      // Also don't clear for 404 errors (endpoint doesn't exist)
      if (!isAuthEndpoint && status === 401) {
        const token = localStorage.getItem('token');
        if (token) {
          // Check if this is a real auth error or just a missing endpoint
          // Some backends return 401 for missing endpoints, so we need to be careful
          console.warn('401 error detected, but checking if it\'s a real auth error...');
          
          // Only clear session if we're sure it's an auth error
          // For now, we'll be more lenient and only clear on repeated 401s
          // or if the error message indicates authentication failure
          const errorMessage = error.response?.data?.message || '';
          const isRealAuthError = errorMessage.toLowerCase().includes('unauthorized') ||
                                  errorMessage.toLowerCase().includes('token') ||
                                  errorMessage.toLowerCase().includes('authentication');
          
          if (isRealAuthError) {
            console.warn('Real authentication error detected, clearing session');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Only redirect if we're not already on login/register page
            if (window.location.pathname !== '/' && window.location.pathname !== '/register') {
              setTimeout(() => {
                window.location.href = '/';
              }, 100);
            }
          } else {
            console.log('401 error but not a real auth error, keeping session');
          }
        }
      }
    }
    
    // For 404 errors, just reject without clearing session
    // This allows the app to continue working even if some endpoints don't exist yet
    return Promise.reject(error);
  }
);

export default axiosInstance;

