# PRD_AUDIT.md - 产品需求文档审查与实现对照

> 原始 PRD：《AI 智能获客平台》产品需求文档 V1.0（2026-05-11）
> 审查时间：2026-05-12

---

## 功能模块实现对照

### 3.1 线索采集与筛选模块

| PRD 需求 | 实现状态 | 说明 |
|----------|----------|------|
| 多平台关键词配置规则 | 🔄 前端完成，采集引擎待开发 | 前端 LeadsPage 支持筛选，后端 leads.service 支持多条件查询 |
| NLP 意向度评分（0-100分） | ✅ Schema 完成 | t_leads 表含 intent_score 字段，AI 评分逻辑待接入 |
| 线索池分组管理 | ✅ 前端完成 | LeadsPage 含平台/意向/状态筛选 |
| 采集范围：仅公开数据 | 📋 规则文档化 | 合规规则写入 PRD 业务规则 |
| 线索保存 90 天自动归档 | 🔄 待实现 | leads 表含 archived_at 字段，定时任务待开发 |

### 3.2 AI 私信触达模块

| PRD 需求 | 实现状态 | 说明 |
|----------|----------|------|
| 大模型话术动态生成 | ✅ 后端 templates.service 接入 KIMI API | Demo 模式可正常运行，配置 KIMI_API_KEY 后启用真实生成 |
| 多账号风控调度 | ✅ accounts 表 + risk_rules 表完成 | 调度执行逻辑待 Phase 2 实现 |
| 敏感词过滤 | ✅ risk_rules.sensitive_keywords 字段 | 前端风控规则页面可配置 |
| 单账号日触达上限 | ✅ accounts.daily_limit 字段 | 前端账号管理页面可配置 |
| 连续 3 次失败自动暂停 | 🔄 风控引擎待实现 | risk_events 表支持记录 |

### 3.3 私域承接与客户分层模块

| PRD 需求 | 实现状态 | 说明 |
|----------|----------|------|
| 企业微信好友申请自动通过 | 📋 规划中 | 需要企业微信 CORP_ID + APP_SECRET |
| AI 自动打标签 | ✅ customers.tags 字段 | 前端 CRM 页面支持标签展示和添加 |
| ABCD 客户分层 | ✅ customers.tier 字段 | CRM 页面含分层统计卡片 |
| 单账号日添加≤200 人 | ✅ risk_rules.add_friend_limit | 风控规则表已包含 |
| 低意向客户自动 SOP | 📋 规划中 | 自动化运营流程待 Phase 2 |

### 3.4 数据闭环与迭代优化

| PRD 需求 | 实现状态 | 说明 |
|----------|----------|------|
| 全链路数据看板 | ✅ 完成 | DashboardPage 含漏斗/趋势/平台分布/预警 |
| A/B 测试 | 🔄 规划中 | 话术模板表含 reply_rate 字段用于效果对比 |
| AI 优化建议 | ✅ analytics.service.getAiSuggestions() | 目前规则式建议，后期接入 LLM |
| 报表保存 1 年 | ✅ t_operation_data 表 | 含 date 字段支持历史查询 |

### 3.5 风控与合规管理

| PRD 需求 | 实现状态 | 说明 |
|----------|----------|------|
| 平台风控状态监控 | ✅ risk_events 表 | 前端 RiskPage 含实时预警展示 |
| 账号封禁自动暂停 | 🔄 待实现 | 账号 status 字段支持 suspended 状态 |
| 敏感词实时过滤 | ✅ risk_rules.sensitive_keywords | 前端可配置，检测逻辑待后端实现 |
| 预警第一时间通知管理员 | 🔄 规划中 | SMTP 邮件配置已预留 .env 变量 |

---

## 非功能需求对照

### 4.1 性能需求

| 需求 | 对应方案 |
|------|----------|
| 页面加载 ≤3秒 | Vite 构建 + Nginx gzip + CDN |
| 接口响应 ≤1秒 | NestJS + Redis 缓存 |
| 日采集 ≥10000 条 | 异步队列（Phase 2 实现） |
| ≥50 并发 | NestJS Cluster + PostgreSQL 连接池 |

### 4.2 安全需求

| 需求 | 对应方案 |
|------|----------|
| 数据加密传输 | HTTPS（Nginx + SSL） |
| RBAC 权限管理 | JWT Role 字段 + Guard（待扩展） |
| 防 SQL 注入 | Drizzle ORM 参数化查询 |
| 数据备份 | docker volume + 定期 pg_dump |

---

## 风险跟踪

| 风险 | 状态 | 应对方案 |
|------|------|----------|
| 平台封号风险 | 🔄 风控模块开发中 | 分账号+限频+内容过滤 |
| AI 接口依赖单一 | ✅ 支持多 API 切换 | .env 配置 AI_PROVIDER 可切换 |
| 数据合规（GDPR/个人信息保护法） | 📋 待法务审查 | 仅采集公开数据，传输 HTTPS |
| 微信审核风险 | 📋 待运营确认 | 话术合规检测 + 合理引导理由 |
