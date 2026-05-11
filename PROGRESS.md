# PROGRESS.md - AI 智能获客平台开发进度

> 更新时间：2026-05-12 | 当前版本：v0.2.0-beta

---

## 整体进度

| 阶段 | 状态 | 完成度 |
|------|------|--------|
| Phase 1 - 项目骨架 | ✅ 完成 | 100% |
| Phase 2 - 核心功能 | ✅ 完成 | 100% |
| Phase 3 - 扩展功能 | 📋 规划中 | 0% |

---

## Phase 1 详情（已完成）

### 前端 Web 管理后台

| 页面模块 | 完成度 | 备注 |
|---------|--------|------|
| ✅ 登录页 | 100% | Demo 账号 admin/123456 |
| ✅ 数据看板 | 100% | 漏斗、趋势图、平台分布、实时告警 |
| ✅ 线索管理 | 100% | 列表+筛选+详情弹窗 |
| ✅ 触达运营 | 100% | 任务列表+创建任务弹窗 |
| ✅ 话术模板 | 100% | 模板库+AI生成弹窗 |
| ✅ 私域承接 SCRM | 100% | 客户分层+标签管理+详情 |
| ✅ 数据分析 | 100% | KPI卡片+趋势图+AI建议 |
| ✅ 风控管理 | 100% | 事件记录+风控规则配置 |
| ✅ 账号管理 | 100% | 账号池+Cookie管理 |
| ✅ 系统设置 | 100% | 账号信息/通知/API/安全/数据 |

### 后端 API

| 模块 | 完成度 | 备注 |
|------|--------|------|
| ✅ 认证 Auth | 100% | JWT，Demo 用户 |
| ✅ 线索 Leads | 100% | CRUD + 分页 + 筛选 |
| ✅ 数据看板 Dashboard | 100% | 统计/趋势/漏斗 |
| ✅ 触达任务 Outreach | 100% | CRUD + toggle + 日志 |
| ✅ 客户 CRM | 100% | CRUD |
| ✅ 数据分析 Analytics | 100% | 趋势+平台对比+AI建议 |
| ✅ 风控 Risk | 100% | 事件+规则 |
| ✅ 账号 Accounts | 100% | CRUD + toggle |
| ✅ 话术模板 Templates | 100% | CRUD + AI 生成（KIMI） |

### DevOps

| 配置 | 完成度 |
|------|--------|
| ✅ docker-compose.yml | 100% |
| ✅ frontend/Dockerfile | 100% |
| ✅ backend/Dockerfile | 100% |
| ✅ GitHub Actions CI/CD | 100% |
| ✅ Nginx 反代配置 | 100% |

---

## Phase 2 详情（已完成）

### 数据库

| 任务 | 状态 | 备注 |
|------|------|------|
| ✅ Drizzle 迁移 SQL | 完成 | `backend/src/database/migrations/0001_init.sql` |
| ✅ drizzle.config.ts | 完成 | 支持 `npm run db:push / db:generate` |
| ✅ 数据库种子脚本 | 完成 | `npm run db:seed` 初始化管理员/模板/规则/示例数据 |
| ✅ .env.example | 完成 | 所有环境变量说明 |

### AI 功能

| 任务 | 状态 | 备注 |
|------|------|------|
| ✅ AiService 公共服务 | 完成 | `common/services/ai.service.ts`，KIMI API 封装 |
| ✅ 话术生成（真实接入） | 完成 | 支持 KIMI API，无 KEY 时 Demo 降级 |
| ✅ 线索意图 AI 分析 | 完成 | POST `/leads/:id/analyze-intent` |
| ✅ 数据分析 AI 建议 | 完成 | GET `/analytics/ai-suggestions` |
| ✅ 敏感词检测 | 完成 | `checkContent()` 方法 |

### 数据采集引擎

| 任务 | 状态 | 备注 |
|------|------|------|
| ✅ 采集基类 | 完成 | `base.collector.ts` |
| ✅ 微博采集器 | 完成 | 移动版 API，Cookie 可选，无 Cookie 自动降级 Mock |
| ✅ 小红书采集器 | 完成 | 签名认证，同上降级机制 |
| ✅ 采集协调服务 | 完成 | 去重入库 + 简单规则评分 + AI 意图评分（可选） |
| ✅ 定时采集任务 | 完成 | 每天凌晨 2 点自动执行 |
| ✅ 采集 API | 完成 | POST `/collector/run`，GET `/collector/status` |

### 风控引擎

| 任务 | 状态 | 备注 |
|------|------|------|
| ✅ 发送前风控检查 | 完成 | 日限额 + 间隔 + 内容 + 账号状态 |
| ✅ Redis 频率计数器 | 完成 | 无 Redis 时内存计数器降级 |
| ✅ 封号/限流检测 | 完成 | 自动更新账号状态 + 记录事件 |
| ✅ 账号风险分 | 完成 | 累加机制，≥80 自动限制 |
| ✅ 风控规则 CRUD | 完成 | 平台级+全局规则 |
| ✅ 风控统计真实数据 | 完成 | 从数据库汇总 |

### 任务调度引擎

| 任务 | 状态 | 备注 |
|------|------|------|
| ✅ 触达任务执行器 | 完成 | 每 60 秒检查，按账号轮换发送 |
| ✅ 每日计数重置 | 完成 | 0:00 重置账号今日发送量 |
| ✅ 日报汇总任务 | 完成 | 23:50 统计并写入 t_operation_data |
| ✅ 账号健康检查 | 完成 | 每小时检查风险分，自动限制高危账号 |
| ✅ 话术变量渲染 | 完成 | {{nickname}} 等变量替换 |

### 前端

| 任务 | 状态 | 备注 |
|------|------|------|
| ✅ API Services 层 | 完成 | `src/services/api.ts` 全量接口封装 |
| ✅ React Query Hooks | 完成 | `src/hooks/useApi.ts` 数据层统一管理 |
| ✅ 数据看板接入 API | 完成 | 实时数据，Mock 降级 |
| ✅ 看板新增接口 | 完成 | `/platform-distribution`、`/alerts` |

---

## Phase 3 待规划

- [ ] A/B 测试模块（话术效果对比）
- [ ] 企业微信 SCRM API 接入（好友添加 + 消息发送）
- [ ] 移动端 H5 适配
- [ ] 多租户 SaaS 架构
- [ ] 数据导出（Excel/CSV）

---

## 运行方式

```bash
# 1. 配置环境变量
cp backend/.env.example backend/.env
# 编辑 .env，填入 DATABASE_URL / KIMI_API_KEY 等

# 2. 数据库初始化
cd backend
npm install
npm run db:push    # 推送 schema 到数据库
npm run db:seed    # 初始化种子数据

# 3. 启动后端
npm run start:dev

# 4. 启动前端
cd ../frontend
npm install && npm run dev

# 5. Docker 一键运行
cd ..
docker compose up -d
```

## 演示账号

- 用户名：`admin`
- 密码：`123456`
- 前端地址：http://localhost:3100
- 后端 API：http://localhost:8000/api
- Swagger 文档：http://localhost:8000/api/docs
