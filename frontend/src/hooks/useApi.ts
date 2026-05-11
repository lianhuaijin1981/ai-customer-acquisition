/**
 * React Query Hooks - 数据层封装
 * 所有业务数据查询/变更统一通过这里管理
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  leadsApi, templatesApi, outreachApi, crmApi,
  analyticsApi, riskApi, accountsApi, dashboardApi, collectorApi
} from '@/services/api'
import toast from 'react-hot-toast'

// ========== 数据看板 ==========
export function useDashboardStats() {
  return useQuery({ queryKey: ['dashboard', 'stats'], queryFn: () => dashboardApi.getStats(), staleTime: 30000 })
}

export function useDashboardTrend(days = 7) {
  return useQuery({ queryKey: ['dashboard', 'trend', days], queryFn: () => dashboardApi.getTrend({ days }), staleTime: 60000 })
}

export function useDashboardFunnel() {
  return useQuery({ queryKey: ['dashboard', 'funnel'], queryFn: () => dashboardApi.getFunnel(), staleTime: 60000 })
}

export function usePlatformDistribution() {
  return useQuery({ queryKey: ['dashboard', 'platform'], queryFn: () => dashboardApi.getPlatformDistribution(), staleTime: 60000 })
}

export function useDashboardAlerts() {
  return useQuery({ queryKey: ['dashboard', 'alerts'], queryFn: () => dashboardApi.getAlerts(), staleTime: 30000 })
}

// ========== 线索管理 ==========
export function useLeads(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['leads', params],
    queryFn: () => leadsApi.getList(params),
    staleTime: 30000,
  })
}

export function useLeadStats() {
  return useQuery({ queryKey: ['leads', 'stats'], queryFn: () => leadsApi.getStats(), staleTime: 30000 })
}

export function useUpdateLeadStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => leadsApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      toast.success('线索状态已更新')
    },
  })
}

export function useAnalyzeIntent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => leadsApi.analyzeIntent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      toast.success('意图分析完成')
    },
    onError: () => toast.error('意图分析失败'),
  })
}

// ========== 话术模板 ==========
export function useTemplates(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['templates', params],
    queryFn: () => templatesApi.getList(params),
    staleTime: 60000,
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => templatesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] })
      toast.success('模板创建成功')
    },
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => templatesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] })
      toast.success('模板更新成功')
    },
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => templatesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] })
      toast.success('模板已删除')
    },
  })
}

export function useAiGenerateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { industry: string; scene: string; productDesc: string; save?: boolean }) =>
      templatesApi.aiGenerate(params),
    onSuccess: (data) => {
      if (data.saved) {
        qc.invalidateQueries({ queryKey: ['templates'] })
        toast.success('AI 话术生成并保存成功')
      } else {
        toast.success('AI 话术生成成功')
      }
    },
    onError: () => toast.error('AI 话术生成失败'),
  })
}

// ========== 触达任务 ==========
export function useOutreachTasks(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['outreach', 'tasks', params],
    queryFn: () => outreachApi.getList(params),
    staleTime: 15000,
    refetchInterval: 30000, // 30秒轮询（任务状态实时更新）
  })
}

export function useCreateOutreachTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => outreachApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outreach'] })
      toast.success('触达任务创建成功')
    },
  })
}

export function useToggleOutreachTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => outreachApi.toggle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outreach'] })
    },
  })
}

export function useDeleteOutreachTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => outreachApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outreach'] })
      toast.success('任务已删除')
    },
  })
}

// ========== 私域 CRM ==========
export function useCrmCustomers(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['crm', params],
    queryFn: () => crmApi.getList(params),
    staleTime: 30000,
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => crmApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm'] })
      toast.success('客户信息已更新')
    },
  })
}

// ========== 数据分析 ==========
export function useAnalyticsOverview(days = 7) {
  return useQuery({
    queryKey: ['analytics', 'overview', days],
    queryFn: () => analyticsApi.getOverview({ days }),
    staleTime: 60000,
  })
}

export function usePlatformComparison(days = 30) {
  return useQuery({
    queryKey: ['analytics', 'platform', days],
    queryFn: () => analyticsApi.getPlatformComparison({ days }),
    staleTime: 60000,
  })
}

export function useAiSuggestions() {
  return useQuery({
    queryKey: ['analytics', 'ai-suggestions'],
    queryFn: () => analyticsApi.getAiSuggestions(),
    staleTime: 300000, // 5分钟缓存
  })
}

// ========== 风控管理 ==========
export function useRiskEvents(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['risk', 'events', params],
    queryFn: () => riskApi.getEvents(params),
    staleTime: 15000,
    refetchInterval: 30000,
  })
}

export function useRiskStats() {
  return useQuery({
    queryKey: ['risk', 'stats'],
    queryFn: () => riskApi.getStats(),
    staleTime: 30000,
    refetchInterval: 60000,
  })
}

export function useRiskRules() {
  return useQuery({
    queryKey: ['risk', 'rules'],
    queryFn: () => riskApi.getRules(),
    staleTime: 60000,
  })
}

export function useResolveRiskEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => riskApi.resolveEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['risk'] })
      toast.success('事件已标记为已处理')
    },
  })
}

export function useUpdateRiskRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => riskApi.updateRule(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['risk', 'rules'] })
      toast.success('风控规则已更新')
    },
  })
}

// ========== 账号管理 ==========
export function useAccounts(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['accounts', params],
    queryFn: () => accountsApi.getList(params),
    staleTime: 30000,
  })
}

export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => accountsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('账号添加成功')
    },
  })
}

export function useToggleAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => accountsApi.toggle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => accountsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('账号已删除')
    },
  })
}

// ========== 数据采集 ==========
export function useCollectorStatus() {
  return useQuery({
    queryKey: ['collector', 'status'],
    queryFn: () => collectorApi.getStatus(),
    staleTime: 5000,
    refetchInterval: 10000,
  })
}

export function useRunCollect() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { platform: string; keywords: string[]; maxPerKeyword?: number; autoAnalyzeIntent?: boolean }) =>
      collectorApi.runCollect(data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      toast.success(`采集完成：新增 ${result.summary?.totalSaved ?? 0} 条线索`)
    },
    onError: () => toast.error('采集任务启动失败'),
  })
}
