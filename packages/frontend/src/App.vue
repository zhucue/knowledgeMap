<template>
  <div id="app">
    <!-- 全局导航栏 -->
    <nav v-if="showNav" class="app-nav">
      <div class="nav-inner">
        <router-link to="/" class="nav-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          </svg>
          Knowledge Map
        </router-link>

        <div class="nav-links">
          <router-link to="/" class="nav-link" exact-active-class="nav-link-active">首页</router-link>
          <router-link to="/resources" class="nav-link" active-class="nav-link-active">资源库</router-link>
          <router-link to="/knowledge-base" class="nav-link" active-class="nav-link-active">知识库</router-link>
          <router-link to="/history" class="nav-link" active-class="nav-link-active">历史</router-link>
        </div>

        <div class="nav-right">
          <template v-if="authStore.isAuthenticated">
            <span class="nav-user">{{ authStore.user?.username }}</span>
            <button class="nav-logout" @click="handleLogout">退出</button>
          </template>
          <router-link v-else to="/login" class="nav-login">登录</router-link>
        </div>
      </div>
    </nav>

    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// 在登录页和图谱页隐藏导航
const showNav = computed(() => {
  const name = route.name as string;
  return name !== 'login' && name !== 'graph-chat';
});

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.app-nav {
  height: 56px;
  background: white;
  border-bottom: 1px solid #E5E7EB;
  position: sticky;
  top: 0;
  z-index: 30;
}

.nav-inner {
  max-width: 1280px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 32px;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 4px;
  flex: 1;
}

.nav-link {
  padding: 6px 14px;
  font-size: 14px;
  color: #6B7280;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s;
}

.nav-link:hover {
  color: #111827;
  background: #F3F4F6;
}

.nav-link-active {
  color: #3B82F6;
  background: rgba(59, 130, 246, 0.08);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-user {
  font-size: 14px;
  color: #374151;
}

.nav-logout {
  padding: 6px 14px;
  font-size: 13px;
  color: #6B7280;
  border: 1px solid #E5E7EB;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-logout:hover {
  color: #EF4444;
  border-color: #EF4444;
}

.nav-login {
  padding: 6px 16px;
  font-size: 13px;
  color: white;
  background: #3B82F6;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.2s;
}

.nav-login:hover {
  background: #2563EB;
}

@media (max-width: 768px) {
  .nav-inner { padding: 0 16px; gap: 16px; }
  .nav-logo svg { display: none; }
  .nav-link { padding: 6px 10px; font-size: 13px; }
}
</style>