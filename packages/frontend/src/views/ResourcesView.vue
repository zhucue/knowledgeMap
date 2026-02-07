<template>
  <div class="resources-view">
    <h2>知识资源库</h2>
    <div class="resources-toolbar">
      <input type="text" placeholder="搜索资源..." v-model="keyword" />
      <select v-model="selectedDomain">
        <option value="">全部领域</option>
      </select>
      <select v-model="selectedType">
        <option value="">全部类型</option>
        <option value="article">文章</option>
        <option value="video">视频</option>
        <option value="tutorial">教程</option>
        <option value="book">书籍</option>
        <option value="document">文档</option>
      </select>
    </div>
    <div class="resources-list">
      <p class="placeholder">资源列表将在 Phase 6 实现</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const keyword = ref('');
const selectedDomain = ref('');
const selectedType = ref('');
</script>
