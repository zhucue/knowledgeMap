import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Resource, BrowseRecord } from '@knowledge-map/shared';

export const useResourceStore = defineStore('resource', () => {
  // 资源列表数据（当前页的资源项）
  const resources = ref<Resource[]>([]);

  // 用户浏览历史记录
  const browseHistory = ref<BrowseRecord[]>([]);

  // 资源筛选条件：领域、类型、关键词
  const filters = ref<{ domain?: string; type?: string; keyword?: string }>({});

  // 分页信息：当前页码、每页大小、总条数
  const pagination = ref({ page: 1, pageSize: 20, total: 0 });

  return {
    resources,
    browseHistory,
    filters,
    pagination,
  };
});
