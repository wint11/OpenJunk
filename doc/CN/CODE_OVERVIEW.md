# SmartReview 项目代码库概览

本文档旨在全面解析 SmartReview 项目的代码结构、文件作用及核心模块设计。该项目是一个基于 Next.js App Router 构建的综合性学术评审与基金管理系统。

## 1. 技术栈概览

- **框架**: Next.js 16.1.1 (App Router)
- **UI 库**: React 19, TailwindCSS, Shadcn UI (Radix UI)
- **数据库 ORM**: Prisma (SQLite/MySQL)
- **认证**: NextAuth.js v5 (Beta)
- **工具库**: `date-fns` (日期处理), `zod` (验证), `xlsx` (Excel 处理), `react-pdf` (PDF 生成)

## 2. 核心目录结构 (src/)

### 2.1 路由与页面 (src/app)

`src/app` 目录采用了 Next.js 的文件系统路由。

#### 核心布局
- **layout.tsx**: 全局根布局，包含 `ThemeProvider` (深色模式), `SessionProvider` (认证状态), `Toaster` (全局提示)。
- **page.tsx**: 首页，展示轮播图、推荐内容、应用下载提示。

#### 管理后台 (src/app/admin)
区分不同角色的管理界面（系统管理员、基金管理员、期刊管理员）。
- **layout.tsx**: 管理后台布局，包含侧边栏导航。根据用户权限动态显示菜单。
- **page.tsx**: 管理后台仪表盘，展示统计数据（基金/期刊）。
- **fund/**: 基金业务管理
  - **projects/**: 基金项目列表（"鸡精列表"），支持 Excel 导入 (`import-dialog.tsx`) 和编辑。
  - **applications/**: 申报管理，查看申报列表和详情 (`[id]/page.tsx`)，进行审核 (`review-dialog.tsx`)。
  - **reviews/**: 评审记录列表。
  - **admins/**: 基金管理员账号管理（仅超级管理员可见）。
- **journals/**: 期刊管理。
- **users/**: 用户管理。
- **audit/**: 稿件审核（小说/论文）。

#### 基金前台业务 (src/app/fund)
面向公众和申请人的页面。
- **page.tsx**: 基金大厅（申报入口）。
- **[id]/page.tsx**: 基金详情页（指南/公告）。
- **apply/[id]/page.tsx**: 基金申报表单页（无需登录）。
- **check/page.tsx**: 申请状态查询页（通过申请编号）。
- **projects/page.tsx**: 已立项项目公示列表。

#### 作者/投稿中心 (src/app/author, src/app/submission)
- **author/**: 作者工作台，管理已发布作品。
- **submission/**: 投稿流程（创建作品、上传章节）。

#### 阅读与浏览
- **novel/[id]**, **paper/[id]**: 作品阅读页。
- **browse/**, **search/**: 浏览和搜索页。

#### API 路由 (src/app/api)
- **auth/[...nextauth]**: NextAuth 认证处理。
- **uploads/**: 文件上传处理。
- **cron/**: 定时任务（如热度衰减）。

### 2.2 组件库 (src/components)

- **ui/**: 通用 UI 组件（Button, Input, Dialog, Table 等），基于 Shadcn UI。
- **navbar.tsx**: 顶部导航栏，包含 Logo、导航链接、用户菜单。
- **main-nav.tsx**: 导航链接逻辑，区分不同模块。
- **footer.tsx**: 页脚组件。
- **auth/**: 认证相关组件（如 `session-guard.tsx`）。

### 2.3 核心逻辑库 (src/lib)

- **prisma.ts**: Prisma Client 单例实例，防止开发环境连接数过多。
- **utils.ts**: 通用工具函数（如 `cn` 类名合并）。
- **auth.ts**: (位于 src 根目录) NextAuth 配置文件，定义 Providers (Credentials), Callbacks (JWT, Session), User Role 逻辑。
- **ai-pre-review.ts**: AI 预审逻辑模拟。
- **audit.ts**: 审计日志记录函数。

## 3. 数据库模型 (prisma/schema.prisma)

主要包含以下模块的模型定义：

- **用户系统**: `User` (包含角色 role), `Account`, `Session`。
- **内容系统**: `Novel` (小说/论文), `Chapter` (章节), `Comment` (评论)。
- **期刊系统**: `Journal` (期刊实体)。
- **基金系统** (新增):
  - `FundCategory`: 基金大类（如“自燃科学鸡精”）。
  - `Fund`: 具体年度项目（如“2026年度面上项目”）。
  - `FundApplication`: 申报记录（包含申请人信息、状态）。
  - `FundExpertProfile`: 专家档案。
  - `FundReview`: 评审记录。

## 4. 关键配置文件

- **package.json**: 定义项目依赖和 `dev`, `build`, `start` 脚本。
- **next.config.ts**: Next.js 配置文件。
- **tsconfig.json**: TypeScript 编译选项。
- **.env**: 环境变量（数据库连接串、Auth Secret 等）。
- **.gitignore**: Git 忽略规则，防止提交敏感文件和构建产物。

## 5. 移动端 (mobile-app/)

包含基于 UniApp 开发的移动端应用源码。
- **pages/**: 移动端页面（首页、期刊、论文详情）。
- **static/**: 静态图标资源。

## 6. 文档 (doc/)

- **CN/**: 中文文档（架构、数据库、UI/UX）。
- **EN/**: 英文文档。

---
*文档生成时间: 2026-02-25*
