import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/graph/:id?',
      name: 'graph-chat',
      component: () => import('@/views/GraphChatView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/resources',
      name: 'resources',
      component: () => import('@/views/ResourcesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/views/HistoryView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
  ],
});

// 路由守卫
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token');

  if (to.meta.requiresAuth && !token) {
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else if (to.name === 'login' && token) {
    next({ name: 'home' });
  } else {
    next();
  }
});

export default router;
