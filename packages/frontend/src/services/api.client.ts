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

// 响应拦截器已将 { code, data } 解包为 data，覆盖默认返回类型
interface UnwrappedAxios {
  get<T = any>(url: string, config?: import('axios').AxiosRequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: import('axios').AxiosRequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: import('axios').AxiosRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: import('axios').AxiosRequestConfig): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: import('axios').AxiosRequestConfig): Promise<T>;
}

export default apiClient as unknown as UnwrappedAxios;
