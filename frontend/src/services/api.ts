/**
 * API Services 统一入口
 * 封装所有后端接口调用
 */

import http from '@/utils/http'

// ==================== Auth ====================
export const authApi = {
  login: (data: { username: string; password: string }) =>
    http.post<any, { token: string; user: any }>('/auth/login', data),

  getProfile: () =>
    http.get<any, any>('/auth/profile'),
}

// ==================== 线索 ====================
export const leadsApi = {
  getList: (params?: Record<string, any>) =>
    http.get<any, { data: any[]; total: number; page: number; pageSize: number; totalPages: number }>('/leads', { params }),

  getById: (id: string) =>
    http.get<any, any>(`/leads/${id}`),

  create: (data: any) =>
    http.post<any, any>('/leads', data),

  update: (id: string, data: any) =>
    http.patch<any, any>(`/leads/${id}`, data),

  updateStatus: (id: string, status: string) =>
    http.patch<any, any>(`/leads/${id}/status`, { status }),

  analyzeIntent: (id: string) =>
    http.post<any, any>(`/leads/${id}/analyze-intent`),

  getStats: () =>
    http.get<any, { total: number; todayLeads: number; highIntent: number }>('/leads/stats'),

  batchImport: (items: any[]) =>
    http.post<any, any>('/leads/batch-import', { items }),
}

// ==================== 话术模板 ====================
export const templatesApi = {
  getList: (params?: Record<string, any>) =>
    http.get<any, { data: any[]; total: number }>('/templates', { params }),

  getById: (id: string) =>
    http.get<any, any>(`/templates/${id}`),

  create: (data: any) =>
    http.post<any, any>('/templates', data),

  update: (id: string, data: any) =>
    http.patch<any, any>(`/templates/${id}`, data),

  delete: (id: string) =>
    http.delete<any, any>(`/templates/${id}`),

  aiGenerate: (params: { industry: string; scene: string; productDesc: string; save?: boolean }) =>
    http.post<any, { content: string; variables: string[]; passed: boolean; sensitiveWords: string[]; saved?: boolean; templateId?: string }>('/templates/ai-generate', params),

  checkContent: (content: string) =>
    http.post<any, { passed: boolean; sensitiveWords: string[] }>('/templates/check-content', { content }),
}

// ==================== 触达任务 ====================
export const outreachApi = {
  getList: (params?: Record<string, any>) =>
    http.get<any, { data: any[]; total: number }>('/outreach', { params }),

  getById: (id: string) =>
    http.get<any, any>(`/outreach/${id}`),

  create: (data: any) =>
    http.post<any, any>('/outreach', data),

  update: (id: string, data: any) =>
    http.patch<any, any>(`/outreach/${id}`, data),

  toggle: (id: string) =>
    http.post<any, any>(`/outreach/${id}/toggle`),

  delete: (id: string) =>
    http.delete<any, any>(`/outreach/${id}`),

  getLogs: (taskId: string, params?: Record<string, any>) =>
    http.get<any, any>(`/outreach/${taskId}/logs`, { params }),
}

// ==================== 私域 CRM ====================
export const crmApi = {
  getList: (params?: Record<string, any>) =>
    http.get<any, { data: any[]; total: number }>('/crm', { params }),

  getById: (id: string) =>
    http.get<any, any>(`/crm/${id}`),

  create: (data: any) =>
    http.post<any, any>('/crm', data),

  update: (id: string, data: any) =>
    http.patch<any, any>(`/crm/${id}`, data),

  delete: (id: string) =>
    http.delete<any, any>(`/crm/${id}`),
}

// ==================== 数据分析 ====================
export const analyticsApi = {
  getOverview: (params?: { days?: number }) =>
    http.get<any, any[]>('/analytics/overview', { params }),

  getPlatformComparison: (params?: { days?: number }) =>
    http.get<any, any[]>('/analytics/platform-comparison', { params }),

  getAiSuggestions: () =>
    http.get<any, Array<{ title: string; desc: string; priority: string; action?: string }>>('/analytics/ai-suggestions'),
}

// ==================== 风控管理 ====================
export const riskApi = {
  getEvents: (params?: Record<string, any>) =>
    http.get<any, { data: any[]; total: number }>('/risk/events', { params }),

  resolveEvent: (id: string) =>
    http.post<any, any>(`/risk/events/${id}/resolve`),

  getRules: () =>
    http.get<any, any[]>('/risk/rules'),

  updateRule: (id: string, data: any) =>
    http.patch<any, any>(`/risk/rules/${id}`, data),

  getStats: () =>
    http.get<any, { unresolvedCount: number; todayEvents: number; resolvedCount: number; accountHealthScore: number }>('/risk/stats'),
}

// ==================== 账号管理 ====================
export const accountsApi = {
  getList: (params?: Record<string, any>) =>
    http.get<any, { data: any[]; total: number }>('/accounts', { params }),

  getById: (id: string) =>
    http.get<any, any>(`/accounts/${id}`),

  create: (data: any) =>
    http.post<any, any>('/accounts', data),

  update: (id: string, data: any) =>
    http.patch<any, any>(`/accounts/${id}`, data),

  toggle: (id: string) =>
    http.post<any, any>(`/accounts/${id}/toggle`),

  delete: (id: string) =>
    http.delete<any, any>(`/accounts/${id}`),
}

// ==================== 数据看板 ====================
export const dashboardApi = {
  getStats: () =>
    http.get<any, any>('/dashboard/stats'),

  getTrend: (params?: { days?: number }) =>
    http.get<any, any[]>('/dashboard/trend', { params }),

  getFunnel: () =>
    http.get<any, any[]>('/dashboard/funnel'),

  getPlatformDistribution: () =>
    http.get<any, any[]>('/dashboard/platform-distribution'),

  getAlerts: () =>
    http.get<any, any[]>('/dashboard/alerts'),
}

// ==================== 采集引擎 ====================
export const collectorApi = {
  runCollect: (data: { platform: string; keywords: string[]; maxPerKeyword?: number; autoAnalyzeIntent?: boolean }) =>
    http.post<any, any>('/collector/run', data),

  getStatus: () =>
    http.get<any, { isRunning: boolean }>('/collector/status'),
}
