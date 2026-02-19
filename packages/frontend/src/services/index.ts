import apiClient from './api.client';

export const graphService = {
  generate: (data: { topic: string; depth?: number; provider?: string }) =>
    apiClient.post('/graph/generate', data),

  getById: (id: number) =>
    apiClient.get(`/graph/${id}`),

  expandNode: (graphId: number, nodeId: number, depth = 2) =>
    apiClient.post(`/graph/${graphId}/expand/${nodeId}`, { depth }),

  getHistory: (page = 1, pageSize = 20) =>
    apiClient.get('/graph/history', { params: { page, pageSize } }),
};

export const topicService = {
  search: (keyword: string) =>
    apiClient.get('/topics/search', { params: { keyword } }),

  getHot: (limit = 10) =>
    apiClient.get('/topics/hot', { params: { limit } }),
};

export const chatService = {
  createSession: (graphId?: number) =>
    apiClient.post('/chat/sessions', { graphId }),

  getSessions: (page = 1, pageSize = 20) =>
    apiClient.get('/chat/sessions', { params: { page, pageSize } }),

  getMessages: (sessionId: number, page = 1, pageSize = 20) =>
    apiClient.get(`/chat/sessions/${sessionId}/messages`, { params: { page, pageSize } }),

  sendMessage: (sessionId: number, content: string, contextNodeId?: number) =>
    apiClient.post(`/chat/sessions/${sessionId}/messages`, { content, contextNodeId }),
};

export const resourceService = {
  getAll: (params: { page?: number; pageSize?: number; domain?: string; resourceType?: string }) =>
    apiClient.get('/resources', { params }),

  search: (keyword: string, domain?: string) =>
    apiClient.get('/resources/search', { params: { keyword, domain } }),

  recordBrowse: (resourceId: number, graphNodeId?: number) =>
    apiClient.post(`/resources/${resourceId}/browse`, { graphNodeId }),

  getBrowseHistory: (page = 1, pageSize = 20) =>
    apiClient.get('/resources/history', { params: { page, pageSize } }),
};

export const authService = {
  register: (data: { username: string; email: string; password: string }) =>
    apiClient.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
};

/** 知识库相关接口 */
export const kbService = {
  /** 创建知识库 */
  create: (data: { name: string; description?: string; visibility?: string }) =>
    apiClient.post('/knowledge-bases', data),

  /** 获取知识库列表（分页） */
  list: (params: { page?: number; pageSize?: number }) =>
    apiClient.get('/knowledge-bases', { params }),

  /** 获取单个知识库详情 */
  getById: (id: number) =>
    apiClient.get(`/knowledge-bases/${id}`),

  /** 更新知识库 */
  update: (id: number, data: { name?: string; description?: string; visibility?: string }) =>
    apiClient.put(`/knowledge-bases/${id}`, data),

  /** 删除知识库 */
  remove: (id: number) =>
    apiClient.delete(`/knowledge-bases/${id}`),

  /** 添加协作者（通过邮箱） */
  addCollaborator: (kbId: number, email: string, role: string = 'viewer') =>
    apiClient.post(`/knowledge-bases/${kbId}/collaborators`, { email, role }),

  /** 移除协作者 */
  removeCollaborator: (kbId: number, targetUserId: number) =>
    apiClient.delete(`/knowledge-bases/${kbId}/collaborators/${targetUserId}`),

  /** 上传文档（FormData） */
  uploadDocument: (kbId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/knowledge-bases/${kbId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** 获取文档列表 */
  listDocuments: (kbId: number) =>
    apiClient.get(`/knowledge-bases/${kbId}/documents`),

  /** 删除文档 */
  removeDocument: (kbId: number, docId: number) =>
    apiClient.delete(`/knowledge-bases/${kbId}/documents/${docId}`),

  /** 语义检索 */
  retrieve: (query: string, topK: number = 5) =>
    apiClient.post('/knowledge-bases/retrieve', { query, topK }),
};
