# 科研基金申报模拟系统需求规格说明书 (PRD) - SmartReview集成版

## 1. 项目概述

### 1.1 项目背景
本项目旨在构建一个高度仿真的科研基金申报演练平台。系统需还原中国主要国家级及省部级科研基金资助体系的申报流程，从指南发布、申请书撰写、形式审查到专家评审、结果公示，实现全流程跑通。

**集成说明**：本项目将作为 `SmartReview` 系统的一个核心子模块（Fund Module）进行开发，复用现有的用户认证、UI组件库及底层架构。

### 1.2 项目目标
*   **全真模拟**：提供接近真实的申报界面与流程体验。
*   **体系完整**：覆盖NSFC、社科、科技部重大计划等六大类资助体系。
*   **评审演练**：重点强化专家评审环节，支持多维度打分与反馈。
*   **数据结构化**：建立可扩展的基金项目库与申报书模型。

---

## 2. 用户角色 (User Roles)

本模块基于 SmartReview 的 `User` 表构建，但采用**独立的扩展表**来管理基金业务特有的身份，与论文审稿体系严格物理隔离。

| 角色 | 标识 | 数据实现方式 | 核心职责 |
| :--- | :--- | :--- | :--- |
| **超级管理员** | `Super Admin` | `User.role = "SUPER_ADMIN"` | 拥有所有权限，可管理所有基金和人员。 |
| **基金管理员** | `Fund Admin` | `User` 关联 `FundCategory` (Admins) | 仅负责其被授权的基金大类（如仅管理“社科基金”）。 |
| **基金评审专家**| `Fund Expert` | `User` 关联 `FundExpertProfile` | 独立的专家库。需录入学科代码、回避单位等信息。 |
| **申报人** | `Applicant` | 任意 `User` (需实名认证) | 提交申请。 |

> **注意**：原有的期刊管理员（Journal Admin）和论文审稿人（Journal Reviewer）**无权**干涉基金业务，除非他们被额外赋予了基金角色。

---

## 3. 资助体系架构 (Fund System Architecture)

系统需内置以下六大类资助体系，并支持动态扩展（通过 `FundCategory` 模型管理）：

### 3.1 国家自然科学基金委员会 (NSFC) 系列
*   **主管**：国务院直属
*   **项目类型**：面上项目、青年科学基金、重点项目、杰青/优青、联合基金。
*   **评审特点**：强调“四类科学问题属性”分类评价。

### 3.2 国家社会科学基金 (NSSFC) 系列
*   **主管**：全国社科工作办
*   **项目类型**：一般项目、青年项目、重点项目、重大项目。
*   **评审特点**：强调“中国问题、中国理论”，匿名评审严格。

### 3.3 科技部重大科技计划
*   **主管**：科技部
*   **项目类型**：国家重点研发计划、科技创新2030。

### 3.4 人才类专项计划
*   **类型**：万人计划、长江学者、青年人才托举工程。

### 3.5 部委专项基金
*   **类型**：教育部人文社科、中国博士后科学基金、卫健委医学基金。

### 3.6 地方与区域协同
*   **类型**：省级自然/社科基金。

---

## 4. 功能需求详情 (Functional Requirements)

### 4.1 基金库管理模块 (Fund Admin)
*   **统一管理后台**：
    *   与现有的期刊/论文管理后台集成在同一入口。
    *   根据管理员权限动态展示“基金管理”菜单（与“期刊管理”并列）。
*   **基金分类管理**：支持树状结构管理（主管部门 -> 基金大类 -> 项目子类）。
*   **指南发布**：
    *   配置年度指南（如“2026年度申报指南”）。
    *   设定申报时间窗口。
*   **数据导入 (Excel)**：
    *   **支持 Excel 批量导入**：管理员有权通过上传 Excel 文件批量导入基金项目或历史申报数据。

### 4.2 申报系统模块 (Applicant)
*   **公开基金大厅 (Public)**：
    *   **统一展示**：在网站显眼位置（如 `/fund`）展示所有当前开放申请的基金列表。
    *   **筛选检索**：支持按分类查看。
*   **申报书撰写 (免登录)**：
    *   **无需登录**：任何人均可直接访问申报页面。
    *   **选择基金**：从列表中选择要申请的基金项目。
    *   **基本信息填写**：
        *   **项目申请人**：**必填**（手动输入姓名，不关联系统账号）。
        *   **项目名称**：必填。
        *   **项目简介**：必填（文本域）。
        *   **项目已有成果**：可选（文本描述或简单列表）。
*   **提交与ID生成**：
    *   提交成功后，系统必须生成一个**全局唯一**的申请ID（Application ID）。
    *   用户需自行记录该ID用于后续查询（或通过邮件/手机号找回，待定）。

### 4.3 评审管理系统 (Review System) - **核心**
*   **形式审查 (Admin)**：
    *   查看待审列表 -> 标记“通过/不通过” -> 填写初审意见。
*   **专家指派 (Admin)**：
    *   手动指派：选择项目 -> 勾选专家 -> 下发任务。
*   **在线评审 (Reviewer)**：
    *   **评审工作台**：待评审/已评审列表。
    *   **双盲浏览**：查看申报书（可视情况屏蔽申请人信息）。
    *   **评审打分**：
        *   综合评分（A/B/C/D）。
        *   分项打分（创新性、研究基础、方案可行性）。
        *   资助建议（优先资助/可资助/不予资助）。
    *   **评审意见**：填写具体定性评语（不少于200字）。

### 4.4 结果公示与反馈
*   **立项评审**：系统汇总专家评分 -> 管理员划定分数线 -> 批量标记“拟立项”。
*   **结果通知**：申请人查看申报状态（已立项/未获资助），查看专家反馈意见。

---

## 5. 数据模型设计 (Prisma Schema Draft)

本模块需扩展 `prisma/schema.prisma`，通过新增关联表来实现角色分离，保持 `User` 表核心结构稳定。

```prisma
// 基金大类 (如: NSFC, NSSFC)
model FundCategory {
  id          String   @id @default(cuid())
  name        String   // e.g. "国家自然科学基金"
  code        String   @unique // e.g. "NSFC"
  description String?
  
  // 基金管理员：多对多关联，指定谁管理这个大类
  admins      User[]   @relation("FundCategoryAdmins")
  
  funds       Fund[]
}

// 基金专家档案 (独立于 User 表的扩展信息)
model FundExpertProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  
  realName    String?  // 真实姓名（冗余存储，用于快照）
  title       String?  // 职称 (教授/副教授)
  researchField String? // 研究领域/关键词
  institution String?  // 单位（用于回避原则）
  bankCard    String?  // 银行卡号（发放评审费）
  idCard      String?  // 身份证号
  
  isActive    Boolean  @default(true)
  
  reviews     FundReview[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 具体基金指南/项目 (如: 2026年NSFC面上项目)
model Fund {
  id          String   @id @default(cuid())
  title       String   // e.g. "2026年度面上项目"
  year        Int      // 2026
  
  categoryId  String
  category    FundCategory @relation(fields: [categoryId], references: [id])
  
  startDate   DateTime
  endDate     DateTime
  
  status      String   @default("DRAFT") // DRAFT, ACTIVE, CLOSED, ARCHIVED
  guideContent String? // 指南正文(Markdown/HTML)
  
  applications FundApplication[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 申报书
model FundApplication {
  id          String   @id @default(cuid())
  serialNo    String?  @unique // 全局唯一ID，规则待定
  
  fundId      String
  fund        Fund     @relation(fields: [fundId], references: [id])
  
  // 移除关联用户，改为手动填写
  // applicantId String
  // applicant   User     @relation("FundApplicant", fields: [applicantId], references: [id])
  applicantName String   // 申请人姓名 (手动填写)
  
  title       String   // 项目名称
  description String   // 项目简介
  achievements String? // 项目已有成果（可选）
  
  status      String   @default("DRAFT") // DRAFT, SUBMITTED, UNDER_REVIEW, REJECTED, APPROVED
  
  reviews     FundReview[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 评审记录
model FundReview {
  id            String   @id @default(cuid())
  
  applicationId String
  application   FundApplication @relation(fields: [applicationId], references: [id])
  
  // 关联到专家档案，而不是直接关联 User，强调专家身份
  expertId      String
  expert        FundExpertProfile @relation(fields: [expertId], references: [id])
  
  score         Float?
  grade         String?  // A, B, C, D
  comments      String?  // 评审意见
  
  status        String   @default("PENDING") // PENDING, SUBMITTED
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## 6. 技术集成方案 (Technical Integration)

### 6.1 目录结构规划 (Next.js App Router)
```text
src/app/
  ├── fund/                  # 基金大厅 (Public, 无需登录)
  │   ├── page.tsx           # 基金列表页
  │   ├── [id]/              # 基金详情页
  │   └── apply/[id]/        # 申报页 (无需登录)
  ├── reviewer/
  │   └── fund/              # 评审中心 (需登录)
  └── admin/                 # 统一管理后台
      ├── fund/              # 基金管理 (新增)
      ├── journals/          # 期刊管理 (已有)
      └── novels/            # 稿件管理 (已有)
```

### 6.2 全局导航重构 (Navigation)
*   **主导航栏**：合并为以下 5 个核心模块，支持下拉菜单。
    1.  **首页** (Home)
    2.  **期刊** (Journals) - *原有的期刊列表/详情*
    3.  **论文** (Papers/Novels) - *原有的稿件/论文库*
    4.  **基金** (Funds) - *新增模块*
    5.  **关于** (About)
*   **页脚优化 (Footer)**：
    *   **轻量化**：移除冗余链接，仅保留版权信息和核心联系方式。
    *   **折叠/转移**：次要链接（如隐私政策、帮助中心）移至导航栏“关于”下的下拉菜单或底部的一行小字。

### 6.3 关键复用点
*   **Auth**: 仅 Admin 和 Reviewer 需要登录。Applicant 无需 Auth。
*   **UI Components**: 复用 `components/ui`。

## 7. 非功能需求
*   **易用性**：界面需严肃、专业，符合科研系统风格。
*   **隔离性**：基金模块数据应与 Novel/Journal 模块逻辑解耦，但共享用户库。
