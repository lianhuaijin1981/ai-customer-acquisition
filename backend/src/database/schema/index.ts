import { pgTable, varchar, text, integer, real, boolean, timestamp, jsonb, serial, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ===================== 用户表 =====================
export const users = pgTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('operator'),
  avatar: varchar('avatar', { length: 500 }),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ===================== 线索池表 t_leads =====================
export const leads = pgTable('t_leads', {
  id: varchar('id', { length: 36 }).primaryKey(),
  platform: varchar('platform', { length: 30 }).notNull(),
  platformUserId: varchar('platform_user_id', { length: 100 }).notNull(),
  nickname: varchar('nickname', { length: 100 }),
  avatar: varchar('avatar', { length: 500 }),
  bio: text('bio'),
  interactionContent: text('interaction_content'),
  interactionType: varchar('interaction_type', { length: 50 }),
  intentScore: integer('intent_score').default(0),
  intentLevel: varchar('intent_level', { length: 20 }).default('low'),
  tags: jsonb('tags').$type<string[]>().default([]),
  status: varchar('status', { length: 20 }).default('new'),
  industry: varchar('industry', { length: 50 }),
  location: varchar('location', { length: 50 }),
  followerCount: integer('follower_count').default(0),
  assignedTo: varchar('assigned_to', { length: 36 }),
  lastContactAt: timestamp('last_contact_at'),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  platformIdx: index('leads_platform_idx').on(table.platform),
  statusIdx: index('leads_status_idx').on(table.status),
  intentIdx: index('leads_intent_idx').on(table.intentLevel),
  createdAtIdx: index('leads_created_at_idx').on(table.createdAt),
}))

// ===================== 话术模板表 t_templates =====================
export const templates = pgTable('t_templates', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  industry: varchar('industry', { length: 50 }),
  scene: varchar('scene', { length: 50 }).notNull(),
  content: text('content').notNull(),
  variables: jsonb('variables').$type<string[]>().default([]),
  version: integer('version').default(1),
  status: varchar('status', { length: 20 }).default('active'),
  useCount: integer('use_count').default(0),
  replyCount: integer('reply_count').default(0),
  replyRate: real('reply_rate').default(0),
  createdBy: varchar('created_by', { length: 36 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ===================== 账号表 =====================
export const accounts = pgTable('accounts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  platform: varchar('platform', { length: 30 }).notNull(),
  username: varchar('username', { length: 100 }).notNull(),
  avatar: varchar('avatar', { length: 500 }),
  groupId: varchar('group_id', { length: 36 }),
  status: varchar('status', { length: 20 }).default('inactive'),
  loginCookie: text('login_cookie'),
  dailyLimit: integer('daily_limit').default(200),
  todaySent: integer('today_sent').default(0),
  ipPool: varchar('ip_pool', { length: 50 }),
  riskScore: integer('risk_score').default(0),
  lastActiveAt: timestamp('last_active_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ===================== 触达任务表 =====================
export const outreachTasks = pgTable('outreach_tasks', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  platform: varchar('platform', { length: 30 }).notNull(),
  accountIds: jsonb('account_ids').$type<string[]>().default([]),
  templateId: varchar('template_id', { length: 36 }),
  leadFilter: jsonb('lead_filter').default({}),
  dailyLimit: integer('daily_limit').default(200),
  status: varchar('status', { length: 20 }).default('pending'),
  totalTarget: integer('total_target').default(0),
  totalSent: integer('total_sent').default(0),
  totalReplied: integer('total_replied').default(0),
  totalConverted: integer('total_converted').default(0),
  startAt: timestamp('start_at'),
  endAt: timestamp('end_at'),
  createdBy: varchar('created_by', { length: 36 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ===================== 触达记录表 =====================
export const outreachLogs = pgTable('outreach_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  taskId: varchar('task_id', { length: 36 }).notNull(),
  leadId: varchar('lead_id', { length: 36 }).notNull(),
  accountId: varchar('account_id', { length: 36 }).notNull(),
  templateId: varchar('template_id', { length: 36 }),
  messageContent: text('message_content'),
  status: varchar('status', { length: 20 }).default('pending'),
  repliedAt: timestamp('replied_at'),
  replyContent: text('reply_content'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ===================== 客户表（私域承接）=====================
export const customers = pgTable('customers', {
  id: varchar('id', { length: 36 }).primaryKey(),
  leadId: varchar('lead_id', { length: 36 }),
  wechatId: varchar('wechat_id', { length: 100 }),
  name: varchar('name', { length: 100 }),
  avatar: varchar('avatar', { length: 500 }),
  sourcePlatform: varchar('source_platform', { length: 30 }),
  status: varchar('status', { length: 20 }).default('pending'),
  tier: varchar('tier', { length: 5 }).default('D'),
  intentScore: integer('intent_score').default(0),
  tags: jsonb('tags').$type<string[]>().default([]),
  assignedSales: varchar('assigned_sales', { length: 36 }),
  addedAt: timestamp('added_at'),
  lastInteractAt: timestamp('last_interact_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ===================== 运营数据表 t_operation_data =====================
export const operationData = pgTable('t_operation_data', {
  id: serial('id').primaryKey(),
  date: varchar('date', { length: 10 }).notNull(),
  platform: varchar('platform', { length: 30 }),
  leadsCount: integer('leads_count').default(0),
  sentCount: integer('sent_count').default(0),
  replyCount: integer('reply_count').default(0),
  addWechatCount: integer('add_wechat_count').default(0),
  convertCount: integer('convert_count').default(0),
  replyRate: real('reply_rate').default(0),
  addWechatRate: real('add_wechat_rate').default(0),
  convertRate: real('convert_rate').default(0),
  cost: real('cost').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  dateIdx: index('op_data_date_idx').on(table.date),
}))

// ===================== 风控事件表 =====================
export const riskEvents = pgTable('risk_events', {
  id: varchar('id', { length: 36 }).primaryKey(),
  type: varchar('type', { length: 50 }).notNull(),
  level: varchar('level', { length: 20 }).notNull(),
  accountId: varchar('account_id', { length: 36 }),
  platform: varchar('platform', { length: 30 }),
  description: text('description'),
  isResolved: boolean('is_resolved').default(false),
  resolvedBy: varchar('resolved_by', { length: 36 }),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ===================== 风控规则表 =====================
export const riskRules = pgTable('risk_rules', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  platform: varchar('platform', { length: 30 }).default('all'),
  dailySendLimit: integer('daily_send_limit').default(200),
  addFriendLimit: integer('add_friend_limit').default(200),
  minSendInterval: integer('min_send_interval').default(30),
  enableContentFilter: boolean('enable_content_filter').default(true),
  sensitiveKeywords: jsonb('sensitive_keywords').$type<string[]>().default([]),
  isActive: boolean('is_active').default(true),
  updatedBy: varchar('updated_by', { length: 36 }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
