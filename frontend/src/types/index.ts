// ===================== 通用类型 =====================
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface SelectOption {
  label: string
  value: string | number
}

// ===================== 线索类型 =====================
export type LeadStatus = 'new' | 'processing' | 'contacted' | 'converted' | 'lost' | 'archived'
export type LeadPlatform = 'weibo' | 'xiaohongshu' | 'douyin' | 'zhihu' | 'wechat' | 'other'
export type IntentLevel = 'high' | 'medium' | 'low'

export interface Lead {
  id: string
  platform: LeadPlatform
  platformUserId: string
  nickname: string
  avatar?: string
  bio?: string
  interactionContent?: string
  intentScore: number
  intentLevel: IntentLevel
  tags: string[]
  status: LeadStatus
  industry?: string
  location?: string
  followerCount?: number
  createdAt: string
  updatedAt: string
  lastContactAt?: string
  assignedTo?: string
}

export interface LeadFilter {
  platform?: LeadPlatform
  status?: LeadStatus
  intentLevel?: IntentLevel
  industry?: string
  dateFrom?: string
  dateTo?: string
  keyword?: string
  page?: number
  pageSize?: number
}

// ===================== 账号类型 =====================
export type AccountStatus = 'active' | 'suspended' | 'warning' | 'inactive'
export type AccountPlatform = LeadPlatform

export interface Account {
  id: string
  platform: AccountPlatform
  username: string
  avatar?: string
  groupId?: string
  status: AccountStatus
  dailyLimit: number
  todaySent: number
  ipPool?: string
  loginCookie?: string
  lastActiveAt?: string
  riskScore: number
  createdAt: string
}

// ===================== 话术模板类型 =====================
export type TemplateScene = 'first_contact' | 'follow_up' | 'add_wechat' | 'nurture'
export type TemplateStatus = 'active' | 'inactive' | 'testing'

export interface Template {
  id: string
  name: string
  industry: string
  scene: TemplateScene
  content: string
  variables: string[]
  version: number
  status: TemplateStatus
  useCount: number
  replyRate?: number
  createdAt: string
  updatedAt: string
}

// ===================== 触达任务类型 =====================
export type TaskStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed'

export interface OutreachTask {
  id: string
  name: string
  platform: LeadPlatform
  accountIds: string[]
  templateId: string
  leadFilter: Partial<LeadFilter>
  dailyLimit: number
  status: TaskStatus
  totalTarget: number
  totalSent: number
  totalReplied: number
  totalConverted: number
  startAt?: string
  endAt?: string
  createdAt: string
  updatedAt: string
}

// ===================== 客户类型 =====================
export type CustomerStatus = 'pending' | 'added' | 'active' | 'inactive' | 'churned'
export type CustomerTier = 'A' | 'B' | 'C' | 'D'

export interface Customer {
  id: string
  leadId: string
  wechatId?: string
  name: string
  avatar?: string
  sourcePlatform: LeadPlatform
  status: CustomerStatus
  tier: CustomerTier
  intentScore: number
  tags: string[]
  assignedSales?: string
  addedAt?: string
  lastInteractAt?: string
  notes?: string
  createdAt: string
}

// ===================== 数据看板类型 =====================
export interface DashboardStats {
  todayLeads: number
  todayLeadsGrowth: number
  todaySent: number
  todaySentGrowth: number
  replyRate: number
  replyRateGrowth: number
  addWechatRate: number
  addWechatRateGrowth: number
  totalLeads: number
  totalCustomers: number
  activeAccounts: number
  todayCost: number
}

export interface OperationData {
  date: string
  platform?: string
  leadsCount: number
  sentCount: number
  replyCount: number
  addWechatCount: number
  convertCount: number
  replyRate: number
  addWechatRate: number
  convertRate: number
  cost: number
}

// ===================== 风控类型 =====================
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type RiskEventType = 'account_suspended' | 'send_limit' | 'ip_blocked' | 'content_filtered' | 'login_failed'

export interface RiskEvent {
  id: string
  type: RiskEventType
  level: RiskLevel
  accountId?: string
  platform?: LeadPlatform
  description: string
  isResolved: boolean
  resolvedAt?: string
  createdAt: string
}

export interface RiskRule {
  id: string
  name: string
  platform: LeadPlatform | 'all'
  dailySendLimit: number
  addFriendLimit: number
  minSendInterval: number
  enableContentFilter: boolean
  sensitiveKeywords: string[]
  isActive: boolean
  updatedAt: string
}

// ===================== 用户/权限类型 =====================
export type UserRole = 'admin' | 'operator' | 'analyst' | 'sales'

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  avatar?: string
  lastLoginAt?: string
  createdAt: string
}

export interface AuthState {
  token: string | null
  user: User | null
}
