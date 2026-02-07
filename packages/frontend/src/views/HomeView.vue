<template>
  <div class="home">
    <header class="home-header">
      <h1>Knowledge Map</h1>
      <p>输入知识主题，生成思维导图，高效学习</p>
    </header>
    <div class="search-section">
      <input
        v-model="searchTopic"
        type="text"
        placeholder="输入知识主题，如：数据结构与算法"
        class="search-input"
        @keyup.enter="handleGenerate"
      />
      <button class="btn-primary" @click="handleGenerate">生成图谱</button>
    </div>
    <div class="hot-topics" v-if="hotTopics.length">
      <h3>热门主题</h3>
      <div class="topic-tags">
        <span
          v-for="topic in hotTopics"
          :key="topic.id"
          class="topic-tag"
          @click="searchTopic = topic.name; handleGenerate()"
        >
          {{ topic.name }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const searchTopic = ref('');
const hotTopics = ref<{ id: number; name: string }[]>([]);

function handleGenerate() {
  if (!searchTopic.value.trim()) return;
  router.push({ name: 'graph-chat', query: { topic: searchTopic.value.trim() } });
}

onMounted(async () => {
  // TODO: fetch hot topics from API
});
</script>
