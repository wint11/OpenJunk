
# SmartReview 移动端 APP 设计文档

## 1. 概述

SmartReview 移动端 APP 是为了满足用户随时随地阅读期刊论文的需求而设计的。基于 UniApp 开发，支持 Android 和 iOS 平台（优先 Android）。APP 采用“无登录”模式，最大化降低用户使用门槛，专注于内容的消费与发现。

## 2. 核心功能

### 2.1 浏览与筛选
- **期刊列表**: 展示平台下所有活跃期刊，支持按名称搜索。
- **论文列表**: 展示最新发表的论文，支持按期刊、作者、标题筛选。
- **分类检索**: 用户可以快速定位感兴趣的领域。

### 2.2 趋势榜 (Trends)
- **C 位入口**: 在底部导航栏中间位置设置“趋势”入口，作为核心引流模块。
- **热度排行**: 基于浏览量、下载量和评论数计算的实时热度榜单。
- **时效性**: 仅展示近期热门内容，确保榜单鲜活。

### 2.3 沉浸式阅读
- **PDF 阅读器**: 内置 PDF 阅读功能，支持缩放、翻页。
- **深色模式**: 适配系统深色模式，保护视力。

### 2.4 APP 获取
- **网页引流**: 在 SmartReview 移动端网页 (Web) 底部悬浮提示框，引导用户下载 APK。
- **本地部署**: APK 文件直接托管在服务器，无需经过应用商店审核。

## 3. 技术架构

### 3.1 前端 (Client)
- **框架**: UniApp (Vue.js)
- **工具**: HBuilderX
- **平台**: Android (APK), iOS (IPA - 需签名), H5
- **PDF 引擎**: `web-view` 组件或 `pdf.js`

### 3.2 后端 (Server)
- **框架**: Next.js 16 (现有项目)
- **API 风格**: RESTful API
- **路径**: `/api/v1/*`

## 4. API 接口设计

为了支持 APP 独立运行，我们在 Next.js 项目中扩展了以下公共 API：

| 接口 | 方法 | 描述 | 参数 |
| :--- | :--- | :--- | :--- |
| `/api/v1/journals` | GET | 获取期刊列表 | 无 |
| `/api/v1/papers` | GET | 获取论文列表 | `page`, `limit`, `journalId`, `sort`, `search` |
| `/api/v1/trends` | GET | 获取趋势榜单 | 无 (默认 Top 10) |
| `/api/v1/app/version` | GET | 检查更新 | (待实现) |

## 5. 部署流程

1.  **打包**: 使用 HBuilderX 将 UniApp 项目打包为 `.apk` 文件 (如 `smartreview.apk`)。
2.  **上传**: 将 APK 文件上传至服务器的 `public/app/` 目录下。
3.  **分发**: 用户访问手机网页时，通过 `AppDownloadBanner` 组件自动检测并提示下载。

## 6. 项目结构建议

建议将 UniApp 项目直接放置在 SmartReview 仓库的根目录下，形成 Monorepo 结构：

```text
SmartReview/
├── src/                # Next.js 源码 (Web & API)
├── public/             # 静态资源
│   └── app/            # 存放 APK 文件
├── mobile-app/         # [新建] UniApp 源码目录
│   ├── pages/          # 页面文件
│   ├── static/         # 静态资源
│   ├── manifest.json   # 配置
│   └── main.js         # 入口
├── prisma/             # 数据库定义
└── package.json
```

## 7. 后续规划

- **用户登录**: 未来版本可加入扫码登录功能，同步网页端书架。
- **推送通知**: 接入 UniPush，推送新刊发布提醒。
- **离线缓存**: 允许用户下载论文到本地离线阅读。
