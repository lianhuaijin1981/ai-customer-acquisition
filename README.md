# AI 智能获客平台

> 全链路 AI 智能获客平台 · 从线索挖掘到私域承接的端到端自动化运营系统

[![CI/CD](https://github.com/your-org/ai-customer-acquisition/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/your-org/ai-customer-acquisition/actions)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 项目概述

本平台针对传统企业获客「线索质量低、触达效率差、私域承接断层、人工成本高」四大痛点，构建了全链路 AI 智能获客解决方案。

### 核心目标
- 🎯 线索筛选精准度 **≥85%**
- 💬 私信回复率 **≥20%**
- ➕ 私域加微转化率 **≥30%**
- 💰 单线索获客成本**降低 50%**

---

## 功能模块

| 模块 | 说明 |
|------|------|
| 📊 数据看板 | 全链路获客漏斗、核心指标 KPI、实时告警 |
| 🎯 线索管理 | 多平台公开线索采集、NLP 意向度评分、线索池管理 |
| 📨 触达运营 | AI 话术生成、多账号风控调度、任务管理 |
| 💬 话术模板 | 模板库管理、AI 智能生成、A/B 效果对比 |
| 👥 私域承接 | 企业微信 SCRM、客户分层、自动打标签 |
| 📈 数据分析 | 转化率趋势、平台对比、AI 优化建议 |
| 🛡️ 风控管理 | 实时风险监控、账号健康度、合规规则 |
| ⚡ 账号管理 | 平台账号池、Cookie 管理、IP 池调度 |

---

## 技术栈

### 前端
- **React 19** + Vite 5 + TypeScript
- **TailwindCSS** + Radix UI 组件
- **Recharts** 数据可视化
- **Zustand** 状态管理 + **React Query** 异步数据
- **React Router v6** 路由

### 后端
- **NestJS 10** + TypeScript
- **Drizzle ORM** + PostgreSQL
- **Passport JWT** 认证
- **KIMI / GPT** 大模型 API（话术生成）
- **Redis** 缓存 + 会话

### 基础设施
- **Docker Compose** 容器化部署
- **GitHub Actions** CI/CD
- **Nginx** 反向代理

---

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/your-org/ai-customer-acquisition.git
cd ai-customer-acquisition
```

### 2. 环境配置

```bash
# 后端
cp backend/.env.example backend/.env
# 编辑 backend/.env，填入 DATABASE_URL、KIMI_API_KEY 等
```

### 3. Docker 启动（推荐）

```bash
docker compose up -d
```

访问：
- 前端：http://localhost
- 后端 API：http://localhost:8000/api
- Swagger 文档：http://localhost:8000/api/docs

### 4. 本地开发

```bash
# 安装依赖
cd frontend && npm install
cd ../backend && npm install

# 启动开发服务器
# 终端 1 - 后端
cd backend && npm run start:dev

# 终端 2 - 前端
cd frontend && npm run dev
```

---

## 项目结构

```
ai-customer-acquisition/
├── frontend/               # React 前端
│   ├── src/
│   │   ├── components/     # 通用组件
│   │   │   ├── ui/         # 基础 UI 组件
│   │   │   └── layout/     # 布局组件
│   │   ├── pages/          # 页面组件
│   │   │   ├── dashboard/  # 数据看板
│   │   │   ├── leads/      # 线索管理
│   │   │   ├── outreach/   # 触达运营
│   │   │   ├── crm/        # 私域承接
│   │   │   ├── analytics/  # 数据分析
│   │   │   ├── risk/       # 风控管理
│   │   │   ├── accounts/   # 账号管理
│   │   │   └── settings/   # 系统设置
│   │   ├── store/          # Zustand 状态
│   │   ├── types/          # TypeScript 类型
│   │   └── utils/          # 工具函数
│   └── Dockerfile
├── backend/                # NestJS 后端
│   ├── src/
│   │   ├── modules/        # 业务模块
│   │   │   ├── auth/       # 认证授权
│   │   │   ├── leads/      # 线索服务
│   │   │   ├── outreach/   # 触达任务
│   │   │   ├── crm/        # 客户管理
│   │   │   ├── analytics/  # 数据分析
│   │   │   ├── risk/       # 风控服务
│   │   │   ├── accounts/   # 账号服务
│   │   │   ├── templates/  # 话术模板
│   │   │   └── dashboard/  # 看板数据
│   │   ├── database/       # Drizzle Schema & Migrations
│   │   └── common/         # 通用 Guards/Pipes
│   └── Dockerfile
├── docker-compose.yml
└── .github/workflows/ci-cd.yml
```

---

## API 文档

启动后端后访问 Swagger：`http://localhost:8000/api/docs`

核心 API：
- `POST /api/auth/login` - 登录
- `GET /api/dashboard/stats` - 看板核心指标
- `GET /api/leads` - 线索列表（支持分页/筛选）
- `POST /api/outreach/tasks` - 创建触达任务
- `POST /api/templates/ai-generate` - AI 生成话术
- `GET /api/analytics/platform-comparison` - 平台对比

---

## 演示账号

| 角色 | 账号 | 密码 |
|------|------|------|
| 超级管理员 | admin | 123456 |
| 运营专员 | operator | 123456 |

---

## 开发计划

### Phase 1（已完成 ✅）
- [x] 项目骨架搭建
- [x] 前端 Web 管理后台（全 8 个模块）
- [x] 后端 NestJS API（全 9 个模块）
- [x] 数据库 Schema 设计（Drizzle ORM）
- [x] Docker 容器化 + CI/CD

### Phase 2（进行中 🔄）
- [ ] 多平台数据采集引擎（微博、小红书、抖音、知乎）
- [ ] KIMI API 集成话术动态生成
- [ ] 企业微信 SCRM 接口对接
- [ ] 实时风控引擎

### Phase 3（规划中 📋）
- [ ] 微信支付 / 支付宝支付集成
- [ ] 移动端 H5 适配
- [ ] 多租户 SaaS 架构
- [ ] 机器学习意向度评分优化

---

## License

MIT © 2026
