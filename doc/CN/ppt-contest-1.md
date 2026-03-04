# 第一届乱讲PPT大赛 (The First Random PPT Contest)

## 1. 项目概述 (Overview)

“第一届乱讲PPT大赛”是一个集上传、盲讲录制、大众评审于一体的趣味互动活动。参与者上传任意 PPT，其他参赛者在不知道内容的情况下进行即兴解说（录音），最后由大众评审投票选出最有趣的解说。

**核心流程**：
1.  **Stage 1 - 上传 (Upload)**: 用户上传 PPT/PPTX 文件，系统自动转换为无水印的高清 PDF 预览。
2.  **Stage 2 - 录制 (Record)**: “盲盒”模式。用户随机抽取一个 PPT，点击开始录音后才能看到内容，必须一边翻页一边即兴解说。
3.  **Stage 3 - 投票 (Vote)**: 大众评审随机刷到“解说作品”，系统自动同步播放音频和 PPT 翻页，用户进行投票。

## 2. 技术架构 (Architecture)

### 2.1 技术栈
*   **Frontend**: Next.js (App Router), React, Tailwind CSS
*   **Backend**: Next.js Server Actions
*   **Database**: SQLite (Development) / PostgreSQL (Production), Prisma ORM
*   **File Storage**: Local Filesystem (Primary, `public/uploads`), Vercel Blob (Backup)
*   **PDF Rendering**: `react-pdf` (Client-side rendering)
*   **Audio Recording**: MediaRecorder API (`audio/webm`)
*   **PPT Conversion**: Python (`comtypes` + Microsoft PowerPoint)

### 2.2 核心功能实现

#### A. PPT 转 PDF (High-Fidelity Conversion)
为了保证最佳的渲染效果（保留动画帧的静态图、字体、排版），我们放弃了 `libreoffice`，转而使用 Python 脚本调用 Windows 本地的 COM 接口控制 PowerPoint 进行转换。
*   **脚本**: `scripts/ppt2pdf.py`
*   **逻辑**: Next.js 接收上传 -> 保存临时文件 -> 调用 Python 脚本 -> 生成 PDF -> 移动到 `public/uploads/ppt-contest-preview`。
*   **特点**: 无水印、原汁原味、支持重试机制（Stealth -> ReadOnly -> Visible）。

#### B. 盲讲录制 (Blind Recording)
*   **组件**: `src/app/ppt-contest-1/components/stage2-record.tsx`
*   **机制**:
    *   在点击“开始录音”前，PPT 内容被遮罩隐藏。
    *   录音开始后，记录每一次翻页的时间戳 (`timestamps: [{page: 1, time: 0}, {page: 2, time: 5.4}, ...]`)。
    *   录音结束自动生成 WebM 音频文件上传。

#### C. 同步回放 (Synchronized Playback)
*   **组件**: `src/app/ppt-contest-1/components/stage3-vote.tsx`
*   **逻辑**:
    *   加载作品时，同时拉取音频 URL 和时间戳 JSON。
    *   使用 `useEffect` 监听音频的 `currentTime`。
    *   根据当前时间在时间戳数组中查找对应的 `pageNumber`，并传递给 `PdfPreview` 组件，实现“视频化”的 PPT 播放体验。

#### D. 本地优先存储 (Local-First Storage)
*   为了确保开发环境的响应速度和离线可用性，所有文件（PDF 预览、WebM 音频）优先保存到 `public/uploads`。
*   数据库字段 `localFileUrl`, `localPreviewUrl` 存储本地路径。
*   Vercel Blob 仅作为异步备份，不阻塞用户操作。

## 3. 数据库设计 (Database Schema)

### PPTSubmission (上传记录)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | UUID |
| `filename` | String | 原始文件名 |
| `localFileUrl` | String | 本地 PPT 路径 |
| `localPreviewUrl` | String | 本地 PDF 预览路径 |
| `fileUrl` | String | 远程 PPT URL (Backup) |
| `previewUrl` | String | 远程 PDF URL (Backup) |
| `uploaderIp` | String | 上传者 IP (限流用) |

### PPTInterpretation (解说作品)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | UUID |
| `submissionId` | String | 关联的 PPT ID |
| `audioUrl` | String | 音频文件路径 |
| `duration` | Int | 录音时长 (秒) |
| `timestamps` | String | 翻页时间戳 JSON |
| `votes` | Int | 获票数 |
| `speakerIp` | String | 解说者 IP |

## 4. 部署与运行 (Setup & Usage)

### 4.1 环境要求
*   **Windows OS**: 必须，因为依赖本地 Office COM 接口。
*   **Microsoft PowerPoint**: 必须安装且已激活。
*   **Python 3.x**: 安装 `comtypes` 库 (`pip install comtypes`)。
*   **Node.js**: 18+

### 4.2 运行步骤
1.  安装依赖: `npm install`
2.  初始化数据库: `npx prisma migrate dev`
3.  启动开发服务器: `npm run dev`
4.  **测试模式**: 在 `src/app/ppt-contest-1/actions.ts` 中设置 `TEST_MODE = true` 可无视日期限制进行全流程测试。

### 4.3 目录结构
*   `src/app/ppt-contest-1/`: 页面主入口及各阶段子页面。
*   `src/app/ppt-contest-1/components/`: 核心组件 (Stage1Upload, Stage2Record, Stage3Vote, PdfPreview)。
*   `scripts/ppt2pdf.py`: 转换脚本。
*   `public/uploads/`: 存储上传的 PPT、生成的 PDF 和录制的音频。

## 5. 已知限制 (Known Limitations)
*   **服务器依赖**: 必须部署在 Windows 服务器上才能使用 COM 转换功能。Linux 部署需重写转换逻辑（如使用 LibreOffice）。
*   **并发限制**: 本地 COM 调用是串行的，大量并发上传可能会排队。
