-- =====================================================
-- AI 智能获客平台 - 数据库初始化迁移 V1
-- 创建时间：2026-05-12
-- =====================================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'operator',
  avatar VARCHAR(500),
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 线索池表
CREATE TABLE IF NOT EXISTS t_leads (
  id VARCHAR(36) PRIMARY KEY,
  platform VARCHAR(30) NOT NULL,
  platform_user_id VARCHAR(100) NOT NULL,
  nickname VARCHAR(100),
  avatar VARCHAR(500),
  bio TEXT,
  interaction_content TEXT,
  interaction_type VARCHAR(50),
  intent_score INTEGER DEFAULT 0,
  intent_level VARCHAR(20) DEFAULT 'low',
  tags JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'new',
  industry VARCHAR(50),
  location VARCHAR(50),
  follower_count INTEGER DEFAULT 0,
  assigned_to VARCHAR(36),
  last_contact_at TIMESTAMP,
  archived_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leads_platform_idx ON t_leads (platform);
CREATE INDEX IF NOT EXISTS leads_status_idx ON t_leads (status);
CREATE INDEX IF NOT EXISTS leads_intent_idx ON t_leads (intent_level);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON t_leads (created_at);

-- 话术模板表
CREATE TABLE IF NOT EXISTS t_templates (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  industry VARCHAR(50),
  scene VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  version INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active',
  use_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  reply_rate REAL DEFAULT 0,
  created_by VARCHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 账号池表
CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR(36) PRIMARY KEY,
  platform VARCHAR(30) NOT NULL,
  username VARCHAR(100) NOT NULL,
  avatar VARCHAR(500),
  group_id VARCHAR(36),
  status VARCHAR(20) DEFAULT 'inactive',
  login_cookie TEXT,
  daily_limit INTEGER DEFAULT 200,
  today_sent INTEGER DEFAULT 0,
  ip_pool VARCHAR(50),
  risk_score INTEGER DEFAULT 0,
  last_active_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 触达任务表
CREATE TABLE IF NOT EXISTS outreach_tasks (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  platform VARCHAR(30) NOT NULL,
  account_ids JSONB DEFAULT '[]',
  template_id VARCHAR(36),
  lead_filter JSONB DEFAULT '{}',
  daily_limit INTEGER DEFAULT 200,
  status VARCHAR(20) DEFAULT 'pending',
  total_target INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_replied INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,
  start_at TIMESTAMP,
  end_at TIMESTAMP,
  created_by VARCHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 触达记录表
CREATE TABLE IF NOT EXISTS outreach_logs (
  id VARCHAR(36) PRIMARY KEY,
  task_id VARCHAR(36) NOT NULL,
  lead_id VARCHAR(36) NOT NULL,
  account_id VARCHAR(36) NOT NULL,
  template_id VARCHAR(36),
  message_content TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  replied_at TIMESTAMP,
  reply_content TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 客户表（私域）
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(36) PRIMARY KEY,
  lead_id VARCHAR(36),
  wechat_id VARCHAR(100),
  name VARCHAR(100),
  avatar VARCHAR(500),
  source_platform VARCHAR(30),
  status VARCHAR(20) DEFAULT 'pending',
  tier VARCHAR(5) DEFAULT 'D',
  intent_score INTEGER DEFAULT 0,
  tags JSONB DEFAULT '[]',
  assigned_sales VARCHAR(36),
  added_at TIMESTAMP,
  last_interact_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 运营数据表
CREATE TABLE IF NOT EXISTS t_operation_data (
  id SERIAL PRIMARY KEY,
  date VARCHAR(10) NOT NULL,
  platform VARCHAR(30),
  leads_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  add_wechat_count INTEGER DEFAULT 0,
  convert_count INTEGER DEFAULT 0,
  reply_rate REAL DEFAULT 0,
  add_wechat_rate REAL DEFAULT 0,
  convert_rate REAL DEFAULT 0,
  cost REAL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS op_data_date_idx ON t_operation_data (date);

-- 风控事件表
CREATE TABLE IF NOT EXISTS risk_events (
  id VARCHAR(36) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  level VARCHAR(20) NOT NULL,
  account_id VARCHAR(36),
  platform VARCHAR(30),
  description TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by VARCHAR(36),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 风控规则表
CREATE TABLE IF NOT EXISTS risk_rules (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  platform VARCHAR(30) DEFAULT 'all',
  daily_send_limit INTEGER DEFAULT 200,
  add_friend_limit INTEGER DEFAULT 200,
  min_send_interval INTEGER DEFAULT 30,
  enable_content_filter BOOLEAN DEFAULT TRUE,
  sensitive_keywords JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  updated_by VARCHAR(36),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
