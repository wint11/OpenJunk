# SmartRead (OpenJunk) 项目设计总结

## 1. 项目概览

**SmartRead (OpenJunk)** 是一个基于 **Next.js 16 (App Router)** 构建的全栈学术期刊平台。该项目旨在“变废为宝”，为学术界的“废弃”论文提供一个公开展示、评审和交流的平台。系统集成了现代化的阅读体验、热度算法、多角色权限管理（RBAC）、AI 辅助审核功能以及基金管理系统。

此外，项目还包含一个移动端应用（UniApp），实现了跨平台的访问体验。

## 2. 系统架构

### 2.1 技术栈

*   **前端框架**: Next.js 16 (React 19)
*   **开发语言**: TypeScript
*   **样式方案**: Tailwind CSS v4
*   **UI 组件库**: shadcn/ui (基于 Radix UI), Lucide React (图标)
*   **后端运行时**: Node.js (Next.js Server Actions & API Routes)
*   **数据库 ORM**: Prisma
*   **数据库**: SQLite (开发环境) / PostgreSQL (生产环境)
*   **身份认证**: NextAuth.js v5 (Credentials Provider)
*   **数据验证**: Zod
*   **移动端**: UniApp (Vue.js)
*   **其他**: Three.js (3D Universe), PDF.js (PDF 阅读)

### 2.2 目录结构

*   `src/app`: Next.js App Router 路由定义，包含页面逻辑和 Server Actions。
    *   `admin`: 管理后台 (期刊、论文、用户、基金等管理)。
    *   `api`: 后端 API 路由 (Auth, Cron, Uploads)。
    *   `browse`, `trends`, `journals`: 公共浏览页面。
    *   `submission`: 投稿流程。
    *   `novel`, `paper`: 内容详情页。
*   `src/components`: React 组件库。
    *   `ui`: shadcn/ui 基础组件。
    *   `universe`: 3D 宇宙视图组件。
*   `src/lib`: 工具函数库 (Prisma 实例, 鉴权, 热度算法, AI 预审逻辑)。
*   `prisma`: 数据库 Schema 定义 (`schema.prisma`) 和迁移文件。
*   `mobile-app`: UniApp 移动端项目源码。
*   `public`: 静态资源 (PDF, 图片)。

## 3. 核心功能模块

### 3.1 用户与权限系统 (RBAC)

系统基于 NextAuth.js 实现认证，并定义了以下角色：
*   **USER (读者)**: 浏览、阅读、评论、收藏。
*   **AUTHOR (作者)**: 投稿、管理自己的稿件。
*   **REVIEWER (评审)**: 审阅分配的稿件。
*   **ADMIN (管理员)**: 管理期刊、会议、奖项，审核稿件。
*   **SUPER_ADMIN (超级管理员)**: 系统级配置、用户管理、全站权限。

**关键特性**:
*   **Session Guard**: 防止 Cookie 过期但页面未刷新的安全机制。
*   **审计日志**: 记录登录、操作等关键行为 (`AuditLog`)。

### 3.2 内容管理 (CMS)

支持多种内容类型的管理：
*   **期刊 (Journal)**: 包含统计信息、编辑团队、投稿通道。
*   **论文/小说 (Paper/Novel)**:
    *   支持 PDF 上传 (SHA-256 去重)。
    *   支持章节式阅读 (Markdown/Text)。
    *   支持元数据管理 (作者、摘要、分类)。
*   **会议 (Conference)**: 会议信息及相关论文提交。
*   **预印本 (Preprint)**: 快速发布的学术成果。

### 3.3 评审系统

*   **AI 预审 (AI Pre-review)**: 投稿时自动进行质量检测和合规性扫描 (基于 OpenAI/LLM)。
*   **人工评审**:
    *   **快速通道**: 内部编辑/管理员可直接发布。
    *   **常规通道**: 需经过评审员/管理员审核 (Approve/Reject)，支持反馈意见。

### 3.4 基金管理系统 (Fund System)

*   **项目申报**: 用户可申请基金项目。
*   **审核流程**: 管理员对基金申请进行审批。
*   **资金管理**: 跟踪项目资金使用情况。
*   **关联成果**: 基金项目可关联产出的论文/成果。

### 3.5 交互与社区

*   **热度系统**: 基于浏览、下载、评论、收藏的多维度热度计算，支持时间衰减 (Cron Job)。
*   **评论系统**: 支持嵌套回复、点赞。
*   **3D 宇宙 (Universe)**: 可视化展示学术成果或用户互动的 3D 界面。
*   **消息通知**: 系统通知、评审结果通知。

### 3.6 移动端应用 (Mobile App)

位于 `mobile-app` 目录，基于 UniApp 开发，提供移动端的浏览和阅读体验。
*   **功能**: 首页推荐、期刊浏览、论文阅读、个人中心。
*   **技术**: Vue.js, uView UI (推测), 跨平台编译 (iOS/Android/H5)。

## 4. 数据库设计 (Prisma)

核心数据模型 (`schema.prisma`):

*   **User**: 用户账户，包含角色、关联的期刊/会议/奖项管理权限。
*   **Journal/Conference/Award**: 组织实体，包含关联的论文和管理员。
*   **Novel (Paper)**: 核心内容实体，存储标题、作者、PDF 链接、热度、审核状态等。
*   **Chapter**: 章节内容 (用于非 PDF 内容)。
*   **Comment**: 评论数据。
*   **ReviewLog**: 评审记录。
*   **FundApplication/FundProject**: 基金相关实体。
*   **ReadingHistory**: 用户阅读历史。
*   **AuditLog**: 系统操作审计日志。

## 5. 部署与运维

*   **环境依赖**: Node.js 18+, SQLite (默认) 或 PostgreSQL。
*   **初始化**:
    1.  `npm install`: 安装依赖。
    2.  `npx prisma migrate dev`: 数据库迁移。
    3.  `npx tsx prisma/seed.ts`: 种子数据填充 (默认管理员账户)。
*   **启动**: `npm run dev` (开发) / `npm run build && npm start` (生产)。
*   **数据导出**: 支持将数据库表导出为 CSV (`prisma/export_to_csv.ts`)。
*   **日志**: 文件级请求日志记录。
