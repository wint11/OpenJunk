# 系统架构设计

## 概述
SmartRead (OpenJunk) 是一个基于 **Next.js 16 (App Router)** 框架构建的全栈学术期刊平台。它致力于“变废为宝”，为学术界的“垃圾”论文提供一个公开展示、评审和交流的平台。系统集成了现代化的阅读体验、热度算法、多角色权限管理（RBAC）以及 AI 辅助审核功能。

## 技术栈

### 前端 (Frontend)
- **框架**: Next.js 16 (React 19)
- **语言**: TypeScript
- **样式**: Tailwind CSS v4
- **组件库**: shadcn/ui (基于 Radix UI)
- **状态管理**: React Server Components (RSC) & React Hooks
- **图标**: Lucide React
- **PDF 阅读**: 嵌入式 iframe / 原生 PDF 支持

### 后端 (Backend)
- **运行时**: Node.js (通过 Next.js Server Actions & API Routes)
- **ORM**: Prisma
- **数据库**: SQLite (开发环境) / PostgreSQL (生产环境就绪)
- **认证**: Auth.js (NextAuth v5) - Credentials Provider
- **验证**: Zod
- **任务调度**: Cron Jobs (用于热度衰减)

## 核心实现机制

### 1. 认证与 RBAC 流程
我们使用 **Auth.js v5 (beta)** 配合自定义 Credentials 提供商。
*   **登录**:
    1.  用户提交邮箱/密码。
    2.  `authorize` 回调通过 **Zod** 验证输入格式。
    3.  使用 `bcrypt.compare` 验证密码哈希。
*   **会话管理**:
    *   策略: **JWT** (无状态)。
    *   **角色同步**: 为了确保权限变更（如封号）即时生效，`jwt` 回调在*每次*会话检查时都会查询数据库 (`prisma.user.findUnique`) 以刷新 `token.role`。
    *   **Session Guard**: 在 `src/components/session-guard.tsx` 中实现了会话守卫，防止浏览器持有过期/无效 Cookie 访问受保护资源，自动触发登出。
*   **审计**: 通过 `signIn` 事件回调，异步将“LOGIN”事件记录到 `AuditLog` 表。

### 2. 热度系统 (Popularity)
位于 `src/lib/popularity.ts` 和 `src/app/api/cron/decay/route.ts`。
*   **增长机制**:
    *   查看详情 (VIEW): +1
    *   下载 PDF (DOWNLOAD): +5
    *   发表评论 (COMMENT): +10
    *   加入书架 (BOOKSHELF): +8
*   **衰减机制**:
    *   通过 Cron Job 定时调用 API，对所有热度 > 1 的论文执行指数衰减（如每小时衰减 5%），确保榜单的时效性。

### 3. 期刊矩阵与投稿
*   **期刊矩阵**: 展示平台下的所有期刊，包含统计信息（论文数、编辑数）。
*   **快速通道**:
    *   **SUPER_ADMIN**: 可向全站任意期刊投稿。
    *   **ADMIN (主编)**: 仅可向其管理的期刊投稿。
    *   **REVIEWER (编辑)**: 仅可向其参与评审的期刊投稿。
    *   **普通用户/游客**: 需经过常规审核流程。

### 4. PDF 文件处理
*   **上传**: 支持 PDF 文件上传，计算 SHA-256 哈希以实现文件去重。
*   **存储**: 文件存储于 `public/uploads/pdfs`，支持直接静态访问。
*   **路由**: 通过 `src/app/uploads/pdfs/[filename]/route.ts` 处理文件请求，提供正确的 Content-Type 和错误处理（如 404）。

## 系统模块

### 1. 核心应用 (`src/app`)
应用使用 Next.js App Router 进行基于文件系统的路由管理。
- `(public)`: 首页、论文库 (`/browse`)、趋势榜 (`/trends`)、期刊矩阵 (`/journals`)。
- `admin`: 系统管理的受保护路由，包含期刊、论文、用户及审计管理。
- `submission`: 投稿流程。
- `profile`: 用户个人中心与设置。
- `novel`: 论文详情页与评论区。
- `uploads`: 静态资源服务路由。

### 2. Server Actions (`src/app/*/actions.ts`)
我们优先使用 **Server Actions** 而非传统的 REST API 进行数据变更。
- **优势**: 类型安全、减少客户端包体积、渐进增强。
- **场景**: 登录、注册、投稿、评论、点赞、热度更新。

### 3. API 路由 (`src/app/api`)
主要用于：
- 定时任务 (`/api/cron/*`)。
- NextAuth 认证端点 (`/api/auth`)。
- 日志记录 (`/api/log`)。

## 目录结构

```text
src/
├── app/                 # Next.js App Router
│   ├── admin/           # 管理员后台
│   ├── browse/          # 论文库
│   ├── trends/          # 趋势榜
│   ├── journals/        # 期刊矩阵
│   ├── novel/           # 论文详情页
│   ├── submission/      # 投稿页面
│   ├── uploads/         # 文件服务路由
│   └── api/             # API 路由
├── components/          # React 组件
│   ├── ui/              # shadcn/ui 基础组件
│   ├── paper-card.tsx   # 论文卡片组件
│   └── session-guard.tsx# 会话守卫组件
├── lib/                 # 共享逻辑
│   ├── popularity.ts    # 热度计算逻辑
│   ├── prisma.ts        # 数据库客户端
│   └── utils.ts         # 工具函数
└── prisma/              # 数据库 Schema 与迁移
```
