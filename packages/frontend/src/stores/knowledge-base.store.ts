import { defineStore } from 'pinia';
import { ref } from 'vue';
import { kbService } from '@/services';

/** 知识库接口 */
export interface KnowledgeBase {
  id: number;
  ownerId: number;
  name: string;
  description: string | null;
  visibility: 'private' | 'shared' | 'public';
  documentCount: number;
  createdAt: string;
  updatedAt: string;
  collaborators?: Collaborator[];
}

/** 协作者接口 */
export interface Collaborator {
  id: number;
  kbId: number;
  userId: number;
  role: 'viewer' | 'editor';
  user: { username: string; email: string };
}

/** 文档接口 */
export interface KbDocument {
  id: number;
  kbId: number;
  title: string;
  fileType: 'pdf' | 'docx' | 'md' | 'txt';
  fileSize: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  tokenCount: number;
  errorMessage: string | null;
  createdAt: string;
}

/** 检索结果接口 */
export interface RetrievalResult {
  content: string;
  source: string;
  headingPath: string | null;
  score: number;
  documentId: number;
  chunkId: number;
}

export const useKnowledgeBaseStore = defineStore('knowledge-base', () => {
  // 列表状态
  const knowledgeBases = ref<KnowledgeBase[]>([]);
  const loading = ref(false);
  const pagination = ref({ page: 1, pageSize: 10, total: 0, totalPages: 0 });

  // 详情状态
  const currentKb = ref<KnowledgeBase | null>(null);
  const documents = ref<KbDocument[]>([]);
  const documentsLoading = ref(false);
  const detailLoading = ref(false);

  // 检索状态
  const retrievalResults = ref<RetrievalResult[]>([]);
  const retrievalLoading = ref(false);

  /** 获取知识库列表 */
  async function fetchList(page = 1) {
    loading.value = true;
    try {
      const result: any = await kbService.list({ page, pageSize: pagination.value.pageSize });
      knowledgeBases.value = result.items;
      pagination.value = {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      };
    } finally {
      loading.value = false;
    }
  }

  /** 创建知识库 */
  async function create(data: { name: string; description?: string; visibility?: string }) {
    await kbService.create(data);
    await fetchList(1);
  }

  /** 更新知识库 */
  async function update(id: number, data: { name?: string; description?: string; visibility?: string }) {
    await kbService.update(id, data);
    // 如果在详情页，刷新当前知识库
    if (currentKb.value?.id === id) {
      await fetchDetail(id);
    }
    await fetchList(pagination.value.page);
  }

  /** 删除知识库 */
  async function remove(id: number) {
    await kbService.remove(id);
    await fetchList(pagination.value.page);
  }

  /** 获取知识库详情 */
  async function fetchDetail(id: number) {
    detailLoading.value = true;
    try {
      const result: any = await kbService.getById(id);
      currentKb.value = result;
    } finally {
      detailLoading.value = false;
    }
  }

  /** 获取文档列表 */
  async function fetchDocuments(kbId: number) {
    documentsLoading.value = true;
    try {
      const result: any = await kbService.listDocuments(kbId);
      documents.value = Array.isArray(result) ? result : result.items || [];
    } finally {
      documentsLoading.value = false;
    }
  }

  /** 上传文档 */
  async function uploadDocument(kbId: number, file: File) {
    await kbService.uploadDocument(kbId, file);
    await fetchDocuments(kbId);
  }

  /** 删除文档 */
  async function removeDocument(kbId: number, docId: number) {
    await kbService.removeDocument(kbId, docId);
    await fetchDocuments(kbId);
  }

  /** 添加协作者（通过邮箱） */
  async function addCollaborator(kbId: number, email: string, role: string) {
    await kbService.addCollaborator(kbId, email, role);
    await fetchDetail(kbId);
  }

  /** 移除协作者 */
  async function removeCollaborator(kbId: number, targetUserId: number) {
    await kbService.removeCollaborator(kbId, targetUserId);
    await fetchDetail(kbId);
  }

  /** 语义检索 */
  async function retrieve(query: string, topK: number = 5) {
    retrievalLoading.value = true;
    try {
      const result: any = await kbService.retrieve(query, topK);
      retrievalResults.value = Array.isArray(result) ? result : result.items || [];
    } finally {
      retrievalLoading.value = false;
    }
  }

  return {
    knowledgeBases,
    loading,
    pagination,
    currentKb,
    documents,
    documentsLoading,
    detailLoading,
    retrievalResults,
    retrievalLoading,
    fetchList,
    create,
    update,
    remove,
    fetchDetail,
    fetchDocuments,
    uploadDocument,
    removeDocument,
    addCollaborator,
    removeCollaborator,
    retrieve,
  };
});
