# OpenJunk 详细功能参考文档

## 📁 项目结构总览

### 核心目录结构
```
src/
├── app/                    # Next.js App Router 页面和API
├── components/             # React组件库
├── lib/                    # 核心工具函数和配置
├── config/                 # 配置文件
├── hooks/                  # 自定义React Hooks
└── types/                  # TypeScript类型定义
```

## 🚀 核心功能模块详解

### 📱 src/app/ - 页面路由模块

#### 根页面和布局
- **[layout.tsx](file:///e:/项目文件/OpenJunk/src/app/layout.tsx)** - 全局布局组件
  - 功能：定义整个应用的根布局，包含导航栏、主题提供者等
  - 关键特性：NextAuth会话管理、主题切换、全局样式

- **[page.tsx](file:///e:/项目文件/OpenJunk/src/app/page.tsx)** - 首页
  - 功能：平台首页，展示热门内容、最新论文等
  - 组件：使用NovelCard、PaperCard展示内容卡片

#### 🔐 认证系统
- **[login/page.tsx](file:///e:/项目文件/OpenJunk/src/app/login/page.tsx)** - 登录页面
  - 功能：用户登录界面
  - 组件：LoginForm组件处理登录逻辑

- **[login/actions.ts](file:///e:/项目文件/OpenJunk/src/app/login/actions.ts)** - 登录动作
  - 功能：处理用户认证逻辑
  - 特性：bcrypt密码验证、NextAuth会话管理

#### 👤 用户管理
- **[profile/page.tsx](file:///e:/项目文件/OpenJunk/src/app/profile/page.tsx)** - 用户个人中心
  - 功能：用户个人信息管理、偏好设置
  - 组件：PasswordForm、PreferenceForm

#### 📚 内容管理
- **[novel/[id]/page.tsx](file:///e:/项目文件/OpenJunk/src/app/novel/[id]/page.tsx)** - 小说/论文详情页
  - 功能：展示作品详情、章节列表、评论系统
  - 特性：AOI指数显示、阅读历史记录

- **[novel/[id]/read/page.tsx](file:///e:/项目文件/OpenJunk/src/app/novel/[id]/read/page.tsx)** - 阅读器
  - 功能：沉浸式阅读体验
  - 特性：章节导航、阅读进度保存

#### 🏢 期刊系统
- **[journals/page.tsx](file:///e:/项目文件/OpenJunk/src/app/journals/page.tsx)** - 期刊列表
  - 功能：展示所有期刊，支持搜索和筛选
  - 组件：JournalsList组件

- **[journals/[id]/page.tsx](file:///e:/项目文件/OpenJunk/src/app/journals/[id]/page.tsx)** - 期刊详情
  - 功能：单个期刊的详细信息、收录论文
  - 特性：自定义渲染器支持

#### 🎪 会议系统
- **[conferences/page.tsx](file:///e:/项目文件/OpenJunk/src/app/conferences/page.tsx)** - 会议列表
  - 功能：学术会议展示和管理
  - 特性：会议时间线、地点信息

#### 💰 基金系统
- **[fund/page.tsx](file:///e:/项目文件/OpenJunk/src/app/fund/page.tsx)** - 基金申请
  - 功能：科研项目基金申请系统
  - 组件：项目筛选、申请表格

#### 🏆 奖项系统
- **[awards/page.tsx](file:///e:/项目文件/OpenJunk/src/app/awards/page.tsx)** - 奖项展示
  - 功能：学术奖项申请和展示
  - 特性：多赛道申请、评审流程

#### 🎮 特色功能
- **[universe/page.tsx](file:///e:/项目文件/OpenJunk/src/app/universe/page.tsx)** - 宇宙系统
  - 功能：游戏化学术竞争系统
  - 特性：期刊战斗力、季度统计

- **[ppt-contest-1/page.tsx](file:///e:/项目文件/OpenJunk/src/app/ppt-contest-1/page.tsx)** - PPT大赛
  - 功能：三阶段PPT创作比赛
  - 阶段：上传 → 讲解 → 投票

#### 📊 管理后台
- **[admin/page.tsx](file:///e:/项目文件/OpenJunk/src/app/admin/page.tsx)** - 管理后台首页
  - 功能：管理员仪表板
  - 组件：数据统计、快速操作

- **[admin/users/page.tsx](file:///e:/项目文件/OpenJunk/src/app/admin/users/page.tsx)** - 用户管理
  - 功能：用户列表、角色管理
  - 特性：批量操作、用户状态管理

- **[admin/novels/page.tsx](file:///e:/项目文件/OpenJunk/src/app/admin/novels/page.tsx)** - 内容审核
  - 功能：论文/小说审核管理
  - 特性：AI预审结果、审核流程

### 🧩 src/components/ - 组件库

#### UI基础组件
- **[ui/button.tsx](file:///e:/项目文件/OpenJunk/src/components/ui/button.tsx)** - 按钮组件
  - 功能：可复用的按钮组件
  - 特性：多种样式变体、尺寸选择
  - 技术：class-variance-authority (CVA)

- **[ui/card.tsx](file:///e:/项目文件/OpenJunk/src/components/ui/card.tsx)** - 卡片组件
  - 功能：内容展示卡片
  - 特性：Header、Content、Footer结构

- **[ui/dialog.tsx](file:///e:/项目文件/OpenJunk/src/components/ui/dialog.tsx)** - 对话框
  - 功能：模态对话框组件
  - 技术：Radix UI Dialog

#### 业务组件
- **[novel-card.tsx](file:///e:/项目文件/OpenJunk/src/components/novel-card.tsx)** - 作品卡片
  - 功能：展示作品信息
  - 特性：封面图、标题、作者、AOI指数

- **[paper-card.tsx](file:///e:/项目文件/OpenJunk/src/components/paper-card.tsx)** - 论文卡片
  - 功能：学术论文展示
  - 特性：引用信息、下载统计

- **[search-bar.tsx](file:///e:/项目文件/OpenJunk/src/components/search-bar.tsx)** - 搜索栏
  - 功能：全局搜索功能
  - 特性：实时搜索建议、历史记录

#### 布局组件
- **[navbar.tsx](file:///e:/项目文件/OpenJunk/src/components/navbar.tsx)** - 导航栏
  - 功能：顶部导航菜单
  - 特性：响应式设计、用户菜单

- **[footer.tsx](file:///e:/项目文件/OpenJunk/src/components/footer.tsx)** - 页脚
  - 功能：页面底部信息
  - 内容：版权信息、友情链接

- **[main-wrapper.tsx](file:///e:/项目文件/OpenJunk/src/components/main-wrapper.tsx)** - 主容器
  - 功能：页面内容容器
  - 特性：最大宽度限制、内边距

### 🔧 src/lib/ - 核心工具库

#### AI功能模块
- **[ai-pre-review.ts](file:///e:/项目文件/OpenJunk/src/lib/ai-pre-review.ts)** - AI预审系统
  - 功能：自动内容质量评估
  - 特性：DeepSeek API集成、注入检测
  - 算法：多维度评分（0-10分）

- **[aoi-calculator.ts](file:///e:/项目文件/OpenJunk/src/lib/aoi-calculator.ts)** - AOI计算器
  - 功能：学术过端指数计算
  - 五维度：严谨性、可复现性、规范性、专业性、客观性
  - 特性：PDF文本提取、AI评分、防注入

#### 数据处理
- **[popularity.ts](file:///e:/项目文件/OpenJunk/src/lib/popularity.ts)** - 流行度算法
  - 功能：内容热度计算
  - 权重：浏览(1)、下载(5)、评论(10)、收藏(8)
  - 特性：时间衰减机制

- **[recommendation.ts](file:///e:/项目文件/OpenJunk/src/lib/recommendation.ts)** - 推荐系统
  - 功能：个性化内容推荐
  - 算法：基于用户行为的内容推荐

#### 数据库和存储
- **[prisma.ts](file:///e:/项目文件/OpenJunk/src/lib/prisma.ts)** - 数据库连接
  - 功能：Prisma客户端实例
  - 特性：单例模式、连接池管理

- **[storage.ts](file:///e:/项目文件/OpenJunk/src/lib/storage.ts)** - 文件存储
  - 功能：文件上传和管理
  - 支持：本地存储、Vercel Blob

#### 工具函数
- **[utils.ts](file:///e:/项目文件/OpenJunk/src/lib/utils.ts)** - 通用工具
  - 功能：CSS类名合并
  - 技术：clsx + tailwind-merge

- **[logger.ts](file:///e:/项目文件/OpenJunk/src/lib/logger.ts)** - 日志系统
  - 功能：请求日志记录
  - 特性：文件日志、错误追踪

### ⚙️ src/config/ - 配置文件

- **[admin-menu.ts](file:///e:/项目文件/OpenJunk/src/config/admin-menu.ts)** - 管理员菜单
  - 功能：后台管理导航菜单
  - 结构：分组菜单项、权限控制

- **[search-placeholder.ts](file:///e:/项目文件/OpenJunk/src/config/search-placeholder.ts)** - 搜索提示
  - 功能：搜索框占位符文本
  - 特性：随机轮换显示

- **[ppt-contest-banners.ts](file:///e:/项目文件/OpenJunk/src/config/ppt-contest-banners.ts)** - 大赛横幅
  - 功能：PPT大赛轮播图配置
  - 内容：图片URL、跳转链接

### 🎣 src/hooks/ - 自定义Hooks

- **[use-toast.ts](file:///e:/项目文件/OpenJunk/src/hooks/use-toast.ts)** - Toast通知
  - 功能：全局通知系统
  - 特性：多种类型、自动消失

### 📡 API路由详解

#### 认证API
- **[api/auth/[...nextauth]/route.ts](file:///e:/项目文件/OpenJunk/src/app/api/auth/[...nextauth]/route.ts)** - NextAuth配置
  - 功能：用户认证处理
  - 提供者：Credentials Provider

#### 移动端API
- **[api/v1/mobile/login/route.ts](file:///e:/项目文件/OpenJunk/src/app/api/v1/mobile/login/route.ts)** - 移动端登录
  - 功能：移动应用登录接口
  - 验证：邮箱密码验证

- **[api/v1/mobile/chat/route.ts](file:///e:/项目文件/OpenJunk/src/app/api/v1/mobile/chat/route.ts)** - 移动端聊天
  - 功能：管理员群聊系统
  - 权限：仅管理员可访问

#### 内容管理API
- **[api/v1/papers/route.ts](file:///e:/项目文件/OpenJunk/src/app/api/v1/papers/route.ts)** - 论文API
  - 功能：论文CRUD操作
  - 特性：分页、搜索、过滤

- **[api/v1/journals/route.ts](file:///e:/项目文件/OpenJunk/src/app/api/v1/journals/route.ts)** - 期刊API
  - 功能：期刊信息管理
  - 特性：统计信息、关联查询

#### 系统API
- **[api/cron/decay/route.ts](file:///e:/项目文件/OpenJunk/src/app/api/cron/decay/route.ts)** - 热度衰减
  - 功能：定时降低内容热度
  - 触发：Cron任务定时执行

- **[api/seed/route.ts](file:///e:/项目文件/OpenJunk/src/app/api/seed/route.ts)** - 数据种子
  - 功能：初始化测试数据
  - 内容：默认用户、示例内容

### 🎯 特色功能实现

#### AI集成系统
1. **内容预审**：自动质量评估
2. **AOI计算**：五维度学术评价
3. **安全防护**：AI注入检测
4. **PDF解析**：文档内容提取

#### 多角色权限
1. **RBAC设计**：五级权限体系
2. **动态菜单**：基于权限的导航
3. **功能隔离**：不同角色不同功能
4. **审计日志**：操作记录追踪

#### 游戏化元素
1. **宇宙系统**：期刊战斗力
2. **季度统计**：竞技排行榜
3. **PPT大赛**：三阶段比赛
4. **积分系统**：用户参与度

#### 移动端支持
1. **Uni-app开发**：跨平台应用
2. **API适配**：移动端专用接口
3. **离线支持**：本地数据缓存
4. **推送通知**：实时消息提醒

### 📊 数据库模型

#### 核心实体
- **User**：用户基础信息
- **Novel**：作品/论文主体
- **Journal**：期刊信息
- **Conference**：会议信息
- **Chapter**：章节内容

#### 关系设计
- **多对多**：用户-角色、作品-分类
- **层级结构**：评论回复、章节归属
- **状态管理**：审核流程、发布状态
- **统计关联**：浏览记录、评分系统

### 🔒 安全机制

#### 认证授权
- **Session管理**：NextAuth集成
- **密码安全**：bcrypt加密
- **权限验证**：中间件保护
- **API安全**：CORS配置

#### 内容安全
- **AI检测**：有害内容识别
- **审核流程**：多级审核机制
- **用户举报**：社区自治
- **数据脱敏**：敏感信息保护

### 🚀 性能优化

#### 前端优化
- **组件懒加载**：动态导入
- **图片优化**：Next.js Image组件
- **缓存策略**：静态资源缓存
- **代码分割**：路由级别分割

#### 后端优化
- **数据库索引**：查询性能优化
- **连接池**：数据库连接管理
- **响应缓存**：API响应缓存
- **错误处理**：优雅降级

### 📈 监控分析

#### 日志系统
- **访问日志**：用户行为记录
- **错误日志**：异常信息收集
- **性能监控**：响应时间统计
- **业务指标**：核心功能使用

#### 数据分析
- **热度算法**：内容流行度计算
- **推荐系统**：个性化内容推荐
- **用户画像**：行为特征分析
- **趋势预测**：数据趋势分析

## 💡 开发最佳实践

### 代码组织
1. **模块化**：功能模块清晰分离
2. **类型安全**：TypeScript全覆盖
3. **错误处理**：统一的错误处理
4. **文档注释**：关键逻辑说明

### 测试策略
1. **类型检查**：TypeScript编译检查
2. **代码规范**：ESLint规则约束
3. **功能测试**：核心功能验证
4. **性能测试**：关键路径优化

### 部署运维
1. **环境配置**：开发/生产分离
2. **数据库迁移**：版本控制管理
3. **监控告警**：异常及时通知
4. **备份恢复**：数据安全保障

这个详细的功能参考文档涵盖了项目的每个核心文件和功能模块，为开发者提供了全面的技术参考。