<template>
  <div class="login-view">
    <h2>登录</h2>
    <form @submit.prevent="handleLogin">
      <input v-model="email" type="email" placeholder="邮箱" required />
      <input v-model="password" type="password" placeholder="密码" required />
      <button type="submit">登录</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const email = ref('');
const password = ref('');

function handleLogin() {
  // TODO: implement login
}
</script>
