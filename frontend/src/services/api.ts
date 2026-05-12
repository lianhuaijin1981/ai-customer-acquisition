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

// ==================== 企业微信 SCRM ====================
export const weworkApi = {
  // 配置
  getConfigs: () =>
    http.get<any, any[]>('/wework/configs'),
  createConfig: (data: { corpId: string; corpName?: string; agentId: string; secret: string }) =>
    http.post<any, any>('/wework/configs', data),
  deleteConfig: (id: string) =>
    http.delete<any, any>(`/wework/configs/${id}`),
  testConnection: (id: string) =>
    http.post<any, { success: boolean; corpName?: string; error?: string }>(`/wework/configs/${id}/test`),

  // 好友
  addFriend: (data: { configId: string; leadId?: string; wechatId?: string; remark?: string }) =>
    http.post<any, { success: boolean; requestId: string; message: string }>('/wework/friend/add', data),
  getFriendRequests: (params?: Record<string, any>) =>
    http.get<any, { data: any[]; total: number }>('/wework/friend/requests', { params }),

  // 消息
  sendMessage: (data: { configId: string; toUserId: string; content: string; templateId?: string }) =>
    http.post<any, { success: boolean; messageId: string; message: string }>('/wework/message/send', data),
  batchSend: (data: { configId: string; userIds: string[]; content: string; templateId?: string }) =>
    http.post<any, { success: number; failed: number; total: number }>('/wework/message/batch-send', data),
  getMessages: (params?: Record<string, any>) =>
    http.get<any, { data: any[]; total: number }>('/wework/messages', { params }),

  // 统计
  getStats: () =>
    http.get<any, any>('/wework/stats'),
}

// ==================== A/B 话术测试 ====================
export const abTestApi = {
  getList: (params?: Record<string, any>) =>
    http.get<any, { data: any[]; total: number }>('/abtest', { params }),
  getById: (id: string) =>
    http.get<any, any>(`/abtest/${id}`),
  getAnalysis: (id: string) =>
    http.get<any, any>(`/abtest/${id}/analysis`),
  getContent: (id: string, userId: string) =>
    http.get<any, { variant: 'A' | 'B'; content: string; variantId: string } | null>(`/abtest/${id}/content`, { params: { userId } }),
  getStats: () =>
    http.get<any, { total: number; running: number; completed: number; draft: number }>('/abtest/stats'),
  create: (data: any) =>
    http.post<any, any>('/abtest', data),
  update: (id: string, data: any) =>
    http.patch<any, any>(`/abtest/${id}`, data),
  updateStatus: (id: string, status: string) =>
    http.patch<any, any>(`/abtest/${id}/status`, { status }),
  delete: (id: string) =>
    http.delete<any, any>(`/abtest/${id}`),
  recordSend: (id: string, variant: 'A' | 'B') =>
    http.post<any, any>(`/abtest/${id}/record/send`, { variant }),
  recordReply: (id: string, variant: 'A' | 'B') =>
    http.post<any, any>(`/abtest/${id}/record/reply`, { variant }),
  recordConvert: (id: string, variant: 'A' | 'B') =>
    http.post<any, any>(`/abtest/${id}/record/convert`, { variant }),
}

// ==================== 数据导出 ====================
export const exportApi = {
  /**
   * 导出数据——直接触发浏览器下载
   */
  download: (params: {
    type: 'leads' | 'outreach_tasks' | 'outreach_logs' | 'customers' | 'analytics' | 'templates'
    format?: 'excel' | 'csv'
    startDate?: string
    endDate?: string
    platform?: string
    status?: string
  }) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v) })
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
    window.open(`${baseUrl}/export?${query.toString()}`, '_blank')
  },
}
