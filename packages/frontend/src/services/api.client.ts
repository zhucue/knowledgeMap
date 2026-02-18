import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const body = response.data;
    // 解包 TransformInterceptor 包装的响应
    if (body && typeof body === 'object' && 'code' in body && 'data' in body) {
      return body.data;
    }
    return body;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // 避免在登录页循环重定向
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
