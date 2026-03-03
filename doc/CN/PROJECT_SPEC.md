# SmartRead (OpenJunk) 项目规范

本文档用于约定 SmartRead (OpenJunk) 的开发规范与工程约束，以保证多人协作时的可维护性与一致性。架构/数据库/设计背景请优先参考同目录下的其他文档。

## 1. 范围与模块

- Web 主站：Next.js App Router（源码在 `src/`）
- 数据库：Prisma（Schema 在 `prisma/schema.prisma`）
- 移动端：UniApp（源码在 `mobile-app/`）
- 静态资源：`public/`（包含 pdfjs、模板、生成稿件、安装包等）

## 2. 技术栈与版本约束

- Node.js：建议 v18+
- 包管理器：npm（仓库使用 `package-lock.json`）
- 框架：Next.js 16.1.1 + React 19
- TypeScript：`strict: true`（见 `tsconfig.json`）
- 样式：Tailwind CSS v4
- UI：shadcn/ui（Radix UI）组件组织在 `src/components/ui/`
- ORM：Prisma 5

## 3. 本地开发流程

### 3.1 安装与启动

```bash
npm install
 # 先配置 DATABASE_URL（见“环境变量规范”）
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev
```

### 3.2 常用脚本（package.json）

- `npm run dev`：启动开发服务（监听 `0.0.0.0`，方便局域网移动端联调）
- `npm run build`：Next.js 构建
- `npm run start`：生产模式启动
- `npm run lint`：ESLint（Next.js core-web-vitals + TypeScript 规则）

## 4. 环境变量规范

以 `.env`/`.env.local` 形式配置，禁止提交到仓库（见 `.gitignore`）。

### 4.1 必需

- `DATABASE_URL`：Prisma 数据库连接串（当前 `schema.prisma` 使用 `postgresql` provider）

### 4.2 认证相关

- `AUTH_SECRET`：Auth.js/NextAuth 用于 JWT 加解密的密钥

### 4.3 AI 相关（可选）

项目支持多种 AI 接入方式，按使用场景选择配置：

- DeepSeek/OpenAI SDK 直连
  - `DEEPSEEK_API_KEY`：DeepSeek API Key
  - `DEEPSEEK_BASE_URL`：DeepSeek Base URL（缺省使用 `https://api.deepseek.com`）
  - `OPENAI_API_KEY`：当未设置 `DEEPSEEK_API_KEY` 时作为备选
- 预审 HTTP Endpoint（用于 `runAiPreReview`）
  - `AI_REVIEW_ENDPOINT` 或 `AI_REVIEW_BASE_URL`：预审服务地址（未配置则走启发式预审）
  - `AI_REVIEW_API_KEY`：预审服务 Bearer Token（可选）

## 5. 目录与命名约定

### 5.1 Web（src/）

- `src/app/`：页面与路由（App Router）
  - 页面文件：`page.tsx`
  - 布局文件：`layout.tsx`
  - 路由处理：`route.ts`
  - 服务器动作：优先使用同目录 `actions.ts` 承载数据变更逻辑
- `src/components/`：复用组件
  - `src/components/ui/`：基础 UI 组件（保持“无业务/可复用”）
  - 业务组件：按领域分子目录或以功能命名文件
- `src/lib/`：后端/共享逻辑（Prisma、日志、AI、算法、模板等）
- `src/types/`：全局类型增强（如 next-auth 类型扩展）

### 5.2 数据库（prisma/）

- `prisma/schema.prisma`：唯一可信的模型定义来源
- 迁移：使用 Prisma 官方命令生成；禁止手工改写已应用到线上环境的迁移
- `prisma/migrations_sqlite_backup/`：迁移备份目录，不作为运行时迁移输入

### 5.3 移动端（mobile-app/）

- `mobile-app/pages/`：页面（按业务模块分目录）
- `mobile-app/static/`：静态资源（Tabbar 等）

## 6. 编码与实现规范

### 6.1 TypeScript 与导入

- 默认使用 TypeScript，保持 `strict` 通过
- 使用路径别名 `@/*` 指向 `src/*`
- 组件/逻辑拆分以可读性为主，避免超大文件与“万能 util”

### 6.2 数据访问

- 只通过 `prisma` 客户端访问数据库，避免自行创建连接
- 变更数据的操作优先落在 Server Actions 或 API Route 中
- 需要记录关键业务行为时同步写入审计日志（见“日志与审计”）

### 6.3 表单与校验

- 入口参数与用户输入统一做校验（优先 Zod）
- 认证相关：Credentials 登录使用 Zod 校验并使用 bcrypt 验证密码

### 6.4 权限与路由保护

- 统一基于 Auth.js session 获取用户身份与角色
- UI 层展示与路由访问控制都需要考虑角色（例如 admin 区域）
- 权限更新应可即时生效（当前实现会在 JWT 回调中从数据库刷新 role）

### 6.5 UI 规范

- 基础交互优先复用 `src/components/ui/` 中组件
- 页面布局遵循 Tailwind 约定，避免自建重复样式体系
- 主题切换由 `ThemeProvider`/`ModeToggle` 管理，避免局部自实现

## 7. 日志与审计规范

- 请求日志：写入 `logs/YYYY-MM-DD.log`（`logs/` 已被 gitignore）
- 审计日志：写入数据库 `AuditLog`（用于登录、封禁、删除等关键操作追溯）
- 日志内容禁止包含密钥、Token、密码与完整敏感个人信息

## 8. 生成内容与大文件管理

- `public/uploads/`、`public/csv/`、`logs/` 为运行时生成目录，已被 `.gitignore` 忽略
- `public/generated-manuscripts/` 属于生成产物，避免在 PR 中无意义地频繁变更
- 二进制/大文件（apk、docx、pdf）尽量放在明确的子目录并保持命名可追溯

## 9. 变更与质量门禁（建议）

- 合并前至少通过：`npm run lint` 与一次本地 `npm run build`
- 涉及 Prisma 变更时：确保 `prisma migrate dev` 在空库可顺利执行，并更新 seed（如需要）
- 新增/调整 API 或 Server Action：确保错误处理不泄露敏感信息，返回结构保持可前端消费

## 10. 关联文档

- 架构设计：`doc/CN/ARCHITECTURE.md`
- 数据库设计：`doc/CN/DATABASE.md`
- UI/UX 设计：`doc/CN/UI_UX.md`
- 代码概览：`doc/CN/CODE_OVERVIEW.md`

