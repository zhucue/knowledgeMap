import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '@/services/api.client';

interface User {
  id: number;
  username: string;
  email: string;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const user = ref<User | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  // 初始化时从 localStorage 恢复用户信息
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try { user.value = JSON.parse(savedUser); } catch { /* 忽略 */ }
  }

  /** 登录 */
  async function login(email: string, password: string) {
    const result: any = await apiClient.post('/auth/login', { email, password });
    token.value = result.accessToken;
    user.value = result.user;
    localStorage.setItem('token', result.accessToken);
    localStorage.setItem('user', JSON.stringify(result.user));
  }

  /** 注册（注册后自动登录） */
  async function register(username: string, email: string, password: string) {
    await apiClient.post('/auth/register', { username, email, password });
    // 注册成功后自动登录
    await login(email, password);
  }

  /** 退出登录 */
  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  return { token, user, isAuthenticated, login, register, logout };
});
