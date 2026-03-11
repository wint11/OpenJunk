# Union API 接口文档

跨平台论文数据查询接口

## 基础信息

- **地址**: `http://121.41.230.120:8848`
- **端口**: `8848`
- **协议**: HTTP/REST
- **格式**: JSON

---

## 数据库设计

### Paper 表（论文表）

跨项目共享的论文数据表，由多个平台共同维护。

#### 字段说明

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | String | ✅ | cuid() | 唯一标识符 |
| createdAt | DateTime | ✅ | now() | 创建时间 |
| updatedAt | DateTime | ✅ | auto | 更新时间 |
| **基础信息** |||||
| title | String | ✅ | - | 论文标题 |
| authors | String | ✅ | - | 作者列表，JSON格式：`[{"name": "张三", "unit": "清华大学"}]` |
| abstract | String | ❌ | null | 论文摘要 |
| coverUrl | String | ❌ | null | 封面图片URL |
| pdfUrl | String | ❌ | null | PDF文件URL |
| pdfHash | String | ❌ | null | PDF文件SHA-256哈希值，用于去重 |
| **状态与分类** |||||
| status | String | ✅ | "RECEIVED_PENDING_REVIEWER" | 论文状态，见下方状态枚举 |
| category | String | ❌ | null | 学科分类 |
| type | String | ✅ | "PAPER" | 论文类型：PAPER/REVIEW/SHORT/COMMENT |
| submitTime | DateTime | ❌ | null | 提交/发布时间 |
| **统计指标** |||||
| views | Int | ✅ | 0 | 浏览次数 |
| downloads | Int | ✅ | 0 | 下载次数 |
| cite | Int | ✅ | 0 | 被引用次数 |
| **期刊信息** |||||
| journalName | String | ❌ | null | 所属期刊名称 |
| vol | String | ❌ | null | 卷号 (Volume) |
| no | String | ❌ | null | 期号 (Number/Issue) |
| **基金信息** |||||
| fundCategoryId | String | ❌ | null | 基金类别ID，如 NSFC |
| fundCategoryName | String | ❌ | null | 基金类别名称，如 国家自然科学基金 |
| fundDepartmentId | String | ❌ | null | 基金学部ID |
| fundDepartmentName | String | ❌ | null | 基金学部名称，如 数理科学部 |
| fundProjectId | String | ❌ | null | 基金项目ID |
| fundProjectName | String | ❌ | null | 基金项目名称，如 2026年度面上项目 |
| fundApprovalNumber | String | ❌ | null | 基金批准号 |
| **AOI 学术过度指数** |||||
| aiObjectivity | Float | ❌ | null | 客观性评分 (0-10) |
| aiProfessionalism | Float | ❌ | null | 专业性评分 (0-10) |
| aiReproducibility | Float | ❌ | null | 可复现性评分 (0-10) |
| aiRigor | Float | ❌ | null | 严谨性评分 (0-10) |
| aiStandardization | Float | ❌ | null | 规范性评分 (0-10) |
| aoiScore | Float | ❌ | null | AOI综合得分 (0-10) |
| **标识符** |||||
| noi | String | ❌ | null | Nothing Of Index - 仿DOI的论文唯一标识符 |
| dataSource | String | ✅ | "openjunk" | 数据来源，标识数据来自哪个平台 |

#### 状态枚举

| 状态值 | 中文说明 |
|--------|----------|
| RECEIVED_PENDING_REVIEWER | 已接收待分配审稿人 |
| REVIEWED_PENDING_RESULT | 已审稿待公布结果 |
| ACCEPTED_PENDING_PUBLISH | 已接收待发表 |
| MINOR_REVISION | 小修 |
| MAJOR_REVISION | 大修 |
| DESK_REJECT | 桌拒 |
| REJECTED_AFTER_REVIEW | 审稿后拒稿 |
| RETRACTED | 已撤稿 |
| PUBLISHED | 已发表 |

#### 索引

- `@@index([status])` - 状态索引
- `@@index([journalName])` - 期刊名称索引
- `@@index([category])` - 分类索引
- `@@index([submitTime])` - 提交时间索引
- `@@index([aoiScore])` - AOI评分索引
- `@@index([noi])` - NOI索引
- `@@index([fundCategoryId])` - 基金类别索引
- `@@index([fundApprovalNumber])` - 基金批准号索引
- `@@index([dataSource])` - 数据来源索引

---

### Journal 表（期刊表）

期刊信息表，存储期刊的基本信息和编委会信息。

#### 字段说明

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | String | ✅ | cuid() | 唯一标识符 |
| createdAt | DateTime | ✅ | now() | 创建时间 |
| updatedAt | DateTime | ✅ | auto | 更新时间 |
| **基本信息** |||||
| name | String | ✅ | - | 期刊名称（唯一） |
| homepage | String | ❌ | null | 期刊主页URL |
| contact | String | ❌ | null | 联系方式 |
| nssn | String | ❌ | null | 国家标准期刊编号（唯一） |
| coverUrl | String | ❌ | null | 期刊封面图URL |
| templateUrl | String | ❌ | null | 投稿模板文件URL |
| description | String | ❌ | null | 期刊说明/简介 |
| **编委会信息** |||||
| editorInChief | String | ❌ | null | 主编，JSON格式：`[{"name": "张三", "unit": "清华大学", "email": "zs@tsinghua.edu.cn"}]` |
| associateEditors | String | ❌ | null | 副主编，JSON格式：`[{"name": "李四", "unit": "北京大学"}]` |
| editorialBoard | String | ❌ | null | 编委，JSON格式：`[{"name": "赵六", "unit": "中科院"}]` |
| dataSource | String | ✅ | "openjunk" | 数据来源 |

#### 索引

- `@@index([name])` - 期刊名称索引
- `@@index([nssn])` - NSSN索引
- `@@index([dataSource])` - 数据来源索引

---

## 接口列表

### 1. 获取论文列表

```http
GET /papers
```

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| status | string | 论文状态筛选 |
| category | string | 学科分类筛选 |
| journalName | string | 期刊名称（模糊匹配） |
| dataSource | string | 数据来源筛选 |
| search | string | 标题/摘要/作者搜索 |
| limit | number | 返回数量，默认100 |

**示例：**

```bash
# 获取所有论文
curl http://121.41.230.120:8848/papers

# 按状态筛选
curl "http://121.41.230.120:8848/papers?status=PUBLISHED"

# 按数据来源筛选
curl "http://121.41.230.120:8848/papers?dataSource=openjunk"

# 搜索
curl "http://121.41.230.120:8848/papers?search=人工智能"

# 限制数量
curl "http://121.41.230.120:8848/papers?limit=10"
```

**响应：**

```json
{
  "success": true,
  "count": 114,
  "data": [
    {
      "id": "cl...",
      "title": "论文标题",
      "authors": "[{\"name\":\"张三\",\"unit\":\"清华大学\"}]",
      "abstract": "摘要...",
      "status": "PUBLISHED",
      "category": "计算机科学",
      "dataSource": "openjunk",
      "journalName": "Nature",
      "views": 100,
      "downloads": 50,
      "cite": 10,
      "noi": "NOI-2024-00001",
      "createdAt": "2024-01-10T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

---

### 2. 获取单篇论文

```http
GET /papers/:id
```

**示例：**

```bash
curl http://121.41.230.120:8848/papers/cl1234567890abcdef
```

**响应：**

```json
{
  "success": true,
  "data": {
    "id": "cl...",
    "title": "论文标题",
    "authors": "...",
    "abstract": "...",
    "coverUrl": "...",
    "pdfUrl": "...",
    "status": "PUBLISHED",
    "dataSource": "openjunk",
    ...
  }
}
```

---

### 3. 获取期刊列表

```http
GET /journals
```

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| name | string | 期刊名称（模糊匹配） |
| dataSource | string | 数据来源筛选 |
| search | string | 名称/描述搜索 |
| limit | number | 返回数量，默认100 |

**示例：**

```bash
# 获取所有期刊
curl http://121.41.230.120:8848/journals

# 按数据来源筛选
curl "http://121.41.230.120:8848/journals?dataSource=openjunk"

# 搜索
curl "http://121.41.230.120:8848/journals?search=Nature"
```

**响应：**

```json
{
  "success": true,
  "count": 53,
  "data": [
    {
      "id": "cl...",
      "name": "Nature",
      "homepage": "https://www.nature.com",
      "contact": "contact@nature.com",
      "nssn": "0028-0836",
      "dataSource": "openjunk",
      "editorInChief": "[{\"name\":\"主编\",\"unit\":\"单位\"}]",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 4. 获取单个期刊

```http
GET /journals/:id
```

**示例：**

```bash
curl http://121.41.230.120:8848/journals/cl1234567890abcdef
```

---
