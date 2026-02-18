<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <!-- Logo -->
        <h1 class="text-2xl font-bold text-gray-900 text-center mb-2">Knowledge Map</h1>
        <p class="text-sm text-gray-500 text-center mb-8">知识图谱学习平台</p>

        <!-- Tab 切换 -->
        <div class="flex gap-6 border-b border-gray-200 mb-6">
          <button
            class="pb-3 text-sm font-medium transition-colors relative"
            :class="mode === 'login' ? 'text-blue-500' : 'text-gray-500 hover:text-gray-700'"
            @click="mode = 'login'; errorMsg = ''"
          >
            登录
            <span v-if="mode === 'login'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
          </button>
          <button
            class="pb-3 text-sm font-medium transition-colors relative"
            :class="mode === 'register' ? 'text-blue-500' : 'text-gray-500 hover:text-gray-700'"
            @click="mode = 'register'; errorMsg = ''"
          >
            注册
            <span v-if="mode === 'register'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
          </button>
        </div>

        <!-- 错误提示 -->
        <div v-if="errorMsg" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {{ errorMsg }}
        </div>

        <!-- 登录表单 -->
        <form v-if="mode === 'login'" @submit.prevent="handleLogin">
          <div class="mb-4">
            <label class="block text-sm text-gray-700 mb-1.5">邮箱</label>
            <input
              v-model="loginForm.email" type="email" required
              class="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              placeholder="请输入邮箱"
            />
          </div>
          <div class="mb-6">
            <label class="block text-sm text-gray-700 mb-1.5">密码</label>
            <input
              v-model="loginForm.password" type="password" required
              class="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              placeholder="请输入密码"
            />
          </div>
          <button
            type="submit" :disabled="submitting"
            class="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {{ submitting ? '登录中...' : '登录' }}
          </button>
        </form>

        <!-- 注册表单 -->
        <form v-else @submit.prevent="handleRegister">
          <div class="mb-4">
            <label class="block text-sm text-gray-700 mb-1.5">用户名</label>
            <input
              v-model="registerForm.username" type="text" required
              class="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              placeholder="请输入用户名"
            />
          </div>
          <div class="mb-4">
            <label class="block text-sm text-gray-700 mb-1.5">邮箱</label>
            <input
              v-model="registerForm.email" type="email" required
              class="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              placeholder="请输入邮箱"
            />
          </div>
          <div class="mb-4">
            <label class="block text-sm text-gray-700 mb-1.5">密码</label>
            <input
              v-model="registerForm.password" type="password" required minlength="6"
              class="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              placeholder="请输入密码（至少6位）"
            />
          </div>
          <div class="mb-6">
            <label class="block text-sm text-gray-700 mb-1.5">确认密码</label>
            <input
              v-model="registerForm.confirmPassword" type="password" required
              class="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              placeholder="请再次输入密码"
            />
          </div>
          <button
            type="submit" :disabled="submitting"
            class="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {{ submitting ? '注册中...' : '注册' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const mode = ref<'login' | 'register'>('login');
const submitting = ref(false);
const errorMsg = ref('');

const loginForm = reactive({ email: '', password: '' });
const registerForm = reactive({ username: '', email: '', password: '', confirmPassword: '' });

async function handleLogin() {
  errorMsg.value = '';
  submitting.value = true;
  try {
    await authStore.login(loginForm.email, loginForm.password);
    const redirect = (route.query.redirect as string) || '/';
    router.push(redirect);
  } catch (error: any) {
    errorMsg.value = error.response?.data?.message || error.message || '登录失败';
  } finally {
    submitting.value = false;
  }
}

async function handleRegister() {
  errorMsg.value = '';
  if (registerForm.password !== registerForm.confirmPassword) {
    errorMsg.value = '两次输入的密码不一致';
    return;
  }
  submitting.value = true;
  try {
    await authStore.register(registerForm.username, registerForm.email, registerForm.password);
    const redirect = (route.query.redirect as string) || '/';
    router.push(redirect);
  } catch (error: any) {
    errorMsg.value = error.response?.data?.message || error.message || '注册失败';
  } finally {
    submitting.value = false;
  }
}
</script>