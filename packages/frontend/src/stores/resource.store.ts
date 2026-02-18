import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '@/services/api.client';

/** 资源接口 */
interface Resource {
  id: number;
  title: string;
  url: string;
  resourceType: string;
  domain: string;
  tags: string[];
  description: string | null;
  qualityScore: number;
  createdAt: string;
}

/** 浏览记录接口 */
interface BrowseRecord {
  id: number;
  resourceId: number;
  resourceTitle: string;
  resourceUrl: string;
  resourceType: string;
  createdAt: string;
}

export const useResourceStore = defineStore('resource', () => {
  const resources = ref<Resource[]>([]);
  const browseHistory = ref<BrowseRecord[]>([]);
  const filters = ref<{ domain?: string; type?: string; keyword?: string }>({});
  const pagination = ref({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const historyPagination = ref({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const loading = ref(false);

  /** 获取资源列表（分页） */
  async function fetchResources(page = 1) {
    loading.value = true;
    try {
      const params: any = { page, pageSize: pagination.value.pageSize };
      if (filters.value.domain) params.domain = filters.value.domain;
      if (filters.value.type) params.resourceType = filters.value.type;
      const result = await apiClient.get('/resources', { params });
      resources.value = (result as any).items;
      pagination.value = {
        page: (result as any).page,
        pageSize: (result as any).pageSize,
        total: (result as any).total,
        totalPages: (result as any).totalPages,
      };
    } finally {
      loading.value = false;
    }
  }

  /** 搜索资源 */
  async function searchResources(keyword: string) {
    loading.value = true;
    try {
      const params: any = { keyword };
      if (filters.value.domain) params.domain = filters.value.domain;
      const result = await apiClient.get('/resources/search', { params });
      resources.value = result as any;
      pagination.value = { page: 1, pageSize: 20, total: (result as any).length, totalPages: 1 };
    } finally {
      loading.value = false;
    }
  }

  /** 记录浏览并打开资源 */
  async function browseResource(resource: Resource) {
    try {
      await apiClient.post(`/resources/${resource.id}/browse`);
    } catch { /* 静默失败 */ }
    window.open(resource.url, '_blank');
  }

  /** 获取浏览历史 */
  async function fetchBrowseHistory(page = 1) {
    loading.value = true;
    try {
      const result = await apiClient.get('/resources/history', { params: { page, pageSize: 20 } });
      browseHistory.value = (result as any).items;
      historyPagination.value = {
        page: (result as any).page,
        pageSize: (result as any).pageSize,
        total: (result as any).total,
        totalPages: (result as any).totalPages,
      };
    } finally {
      loading.value = false;
    }
  }

  /** 设置筛选条件 */
  function setFilters(newFilters: { domain?: string; type?: string; keyword?: string }) {
    filters.value = { ...filters.value, ...newFilters };
  }

  /** 创建资源 */
  async function createResource(data: {
    title: string;
    url: string;
    resourceType: string;
    domain: string;
    tags?: string[];
    description?: string;
  }) {
    await apiClient.post('/resources', data);
  }

  return {
    resources,
    browseHistory,
    filters,
    pagination,
    historyPagination,
    loading,
    fetchResources,
    searchResources,
    browseResource,
    fetchBrowseHistory,
    setFilters,
    createResource,
  };
});
