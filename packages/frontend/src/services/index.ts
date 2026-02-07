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
