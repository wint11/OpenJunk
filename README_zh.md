# SmartRead - 智能期刊阅读与投稿平台

SmartRead 是一个基于 **Next.js 16 (App Router)** 全栈开发的现代化在线期刊平台。它致力于为学术出版提供全流程解决方案，普通读者可以便捷地阅读期刊论文，审稿人则可以在后台进行专业的稿件评审。

## ✨ 核心功能

### 📚 沉浸式阅读体验
- **阅读器**: 专注模式、字体大小调节、目录跳转，专为论文阅读优化。
- **书架系统**: 收藏关注的论文，记录阅读进度。
- **个性化**: 支持深色/浅色主题切换 (`next-themes`)。
- **发现**: 首页轮播推荐、分类浏览与搜索功能。

### ✍️ 创作者中心
- **投稿管理**: 提交新论文、编辑元数据、上传封面。
- **章节创作**: 在线编辑器，支持论文章节预览与发布。
- **权限隔离**: 严格的作者权限校验，确保数据安全。

### 🛡️ 管理与安全
- **RBAC 权限体系**: 细分为 读者 (USER)、作者 (AUTHOR)、审稿人 (REVIEWER)、管理员 (ADMIN)、超级管理员 (SUPER_ADMIN)。
- **用户管理**: 封禁/解封用户、重置密码、角色变更。
- **内容审核**: 论文与章节的双重审核流。
- **审计与日志**:
  - **审计日志**: 记录关键操作（如封号、删除作品）到数据库。
  - **请求日志**: 每日请求流水文件记录 (`/logs`)，便于流量分析与溯源。

### 🤖 AI 智能集成
- **内容预审**: 提交章节时自动进行 AI 质量检测与合规性扫描。
- **数据结构预留**: 数据库已为 AI 评分、智能推荐预留字段。

## 🛠 技术栈

- **框架**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI 库**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **数据库**: [Prisma](https://www.prisma.io/) (ORM), SQLite (默认)
- **认证**: [NextAuth.js v5](https://authjs.dev/) (Credentials Provider)
- **表单与验证**: [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
- **动画**: framer-motion, tw-animate-css

## 📂 项目结构

```text
.
├── prisma/                 # 数据库 Schema 与迁移文件
├── public/                 # 静态资源
├── src/
│   ├── app/                # App Router 路由定义
│   │   ├── admin/          # 管理员后台 (用户/审核/审计)
│   │   ├── author/         # 作者工作台 (作品/章节管理)
│   │   ├── api/            # 后端 API 路由
│   │   └── ...             # 首页、阅读、书架等公共页面
│   ├── components/         # React 组件 (UI/业务)
│   ├── lib/                # 工具库 (Prisma, Logger, AI, Audit)
│   └── types/              # TypeScript 类型定义
└── logs/                   # (自动生成) 每日请求日志
```

## 🚀 快速开始

### 1. 环境准备
确保你的环境中已安装 Node.js (推荐 v18+)。

### 2. 安装依赖
```bash
npm install
```

### 3. 配置数据库
项目默认使用 SQLite，开箱即用。
```bash
# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev
```

### 4. 初始化数据 (Seed)
使用种子脚本创建默认的管理员、作者、审稿人和读者账号，以及一些初始论文数据。
```bash
npx tsx prisma/seed.ts
```
**默认账号:**
- 超级管理员: `admin@example.com` / `123456`
- 作者: `author@example.com` / `123456`
- 审稿人: `reviewer@example.com` / `123456`
- 读者: `user@example.com` / `123456`

### 5. 启动开发服务器
```bash
npm run dev
```
访问 [http://localhost:3000](http://localhost:3000) 开始体验。

## 📝 最近更新 (2026-02-15)

### 新增功能
- **期刊平台转型**: 全面重构为学术期刊发布与评审平台。
- **审稿人角色**: 新增专业的审稿人角色与后台审核流程。
- **AI 预审流程**: 章节发布通过 `ai-pre-review` 进行初步质量评估。
- **高级用户管理**: 超级管理员现可直接在后台修改用户角色、重置密码及封禁账号。
- **日志系统升级**: 实现了基于文件的每日请求日志记录，增强了系统的可观测性。

### 优化与修复
- 升级至 **Next.js 16** 与 **React 19**。
- 移除了 CTF 模块及相关依赖。
- 修复了登录重定向、作者权限校验及页脚布局等已知问题。
- 优化了数据库模型，增加了对 AI 审核状态的完整支持。
