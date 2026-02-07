# 知识图谱 (Knowledge Map) 项目实施方案

## Context

面向学生群体的知识库平台，包含三大核心功能：

1. **知识图谱生成**: 用户提问后，LLM 自动生成树形思维导图，节点关联学习资源链接，支持分层展开
2. **追问对话**: 在图谱基础上继续追问细节，形成多轮对话，保留完整对话历史
3. **知识资源库**: 浏览和搜索系统预置的学习资料（后续支持用户上传）

三类历史记录均需保留：对话历史（消息级）、图谱历史、资源浏览记录。

## 技术栈

| 层级 | 技术选型 |
|------|---------|
| 前端 | Vue 3 (Composition API + TypeScript) |
| 后端 | NestJS |
| 思维导图可视化 | **@antv/x6 + 树形布局** |
| 输入校验 | Zod (前后端共享 Schema) |
| AI 编排 | LangGraph.js |
| LLM | 多模型抽象层 (OpenAI / Claude / 通义千问等) |
| 数据库 | MySQL (TypeORM) |
| 工程化 | pnpm monorepo |

---

## 一、Monorepo 项目结构

```
knowledgeMap/
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── .env.example
├── packages/
│   ├── shared/                   # 共享类型 + Zod Schema
│   │   └── src/
│   │       ├── schemas/          # Zod Schema (graph, topic, chat, resource, user)
│   │       ├── types/            # TypeScript 类型定义
│   │       └── constants/        # 枚举常量
│   ├── frontend/                 # Vue 3 前端
│   │   └── src/
│   │       ├── views/            # 页面: Home, MindMap, Chat, Resources, History
│   │       ├── components/
│   │       │   ├── mindmap/      # X6 思维导图组件族
│   │       │   ├── chat/         # 对话组件 (消息列表、输入框、流式输出)
│   │       │   └── common/       # 通用组件
│   │       ├── composables/      # useX6Tree, useSSE, useChat, useMindMap
│   │       ├── stores/           # Pinia (graph, chat, topic, resource, user)
│   │       └── services/         # API 调用层
│   └── backend/                  # NestJS 后端
│       └── src/
│           ├── common/           # ZodValidation 管道、守卫、过滤器
│           ├── modules/
│           │   ├── auth/         # JWT 认证
│           │   ├── user/         # 用户管理
│           │   ├── topic/        # 主题管理
│           │   ├── graph/        # 图谱 CRUD + SSE 推送
│           │   ├── chat/         # 对话模块
│           │   ├── resource/     # 知识库资源管理
│           │   └── llm/          # LLM 抽象层 + LangGraph 工作流
│           │       ├── providers/
│           │       └── langgraph/
│           └── config/
```

---

## 二、MySQL 数据库设计

### 核心表 (9 张)

**users** — 用户表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 自增主键 |
| username | VARCHAR(50) UK | 用户名 |
| email | VARCHAR(255) UK | 邮箱 |
| password_hash | VARCHAR(255) | 密码哈希 |
| created_at / updated_at | TIMESTAMP | 时间戳 |

**topics** — 知识主题表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 自增主键 |
| name | VARCHAR(200) | 原始主题名 |
| normalized_name | VARCHAR(200) UK | 标准化名称(去重匹配) |
| domain | VARCHAR(100) | 知识领域 |
| search_count | INT | 搜索热度 |

**knowledge_graphs** — 知识图谱表 (树形结构的一次生成记录)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 自增主键 |
| topic_id | BIGINT FK | 关联主题 |
| version | INT | 版本号 |
| title | VARCHAR(300) | 图谱标题 |
| summary | TEXT | AI 生成的摘要 |
| status | ENUM | generating / completed / failed |
| llm_provider / llm_model | VARCHAR | 使用的模型信息 |
| node_count | INT | 节点数量 |
| max_depth | TINYINT | 当前已生成的最大深度 |
| created_by | BIGINT FK | 创建用户 |

**graph_nodes** — 图谱节点表 (树形结构，通过 parent_id 自引用)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 自增主键 |
| graph_id | BIGINT FK | 所属图谱 |
| parent_id | BIGINT FK NULL | **父节点 ID (NULL=根节点，树形核心)** |
| node_key | VARCHAR(100) | 图内唯一标识 |
| label | VARCHAR(200) | 显示名称 |
| description | TEXT | 知识点描述 |
| node_type | ENUM | root / branch / leaf |
| depth_level | TINYINT | 所在层级 (0=根, 1=一级子节点...) |
| sort_order | INT | 同级排序 |
| is_expandable | BOOLEAN | 是否可继续展开(分层加载标记) |
| is_expanded | BOOLEAN | 是否已展开过 |
| metadata | JSON | 扩展数据(难度、关键词等) |

**resources** — 知识库资源表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 自增主键 |
| title | VARCHAR(300) | 资源标题 |
| url | VARCHAR(1000) | 资源链接 |
| resource_type | ENUM | article / video / document / tutorial / book |
| domain | VARCHAR(100) | 所属知识领域 |
| tags | JSON | 标签数组 ["排序算法", "时间复杂度"] |
| description | TEXT | 资源描述 |
| source | ENUM | system / user_upload (来源) |
| uploaded_by | BIGINT FK NULL | 上传用户(预置资源为 NULL) |
| quality_score | FLOAT | 资源质量评分 |

**node_resources** — 节点-资源关联表 (多对多)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 自增主键 |
| node_id | BIGINT FK | 图谱节点 |
| resource_id | BIGINT FK | 关联资源 |
| relevance_score | FLOAT | 相关度评分(LLM 匹配时计算) |
| is_primary | BOOLEAN | 是否为主要推荐资源 |

**chat_sessions** — 对话会话表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 自增主键 |
| user_id | BIGINT FK | 所属用户 |
| graph_id | BIGINT FK NULL | 关联的图谱 (图谱+追问模式) |
| title | VARCHAR(200) | 会话标题 (取首条消息摘要) |
| status | ENUM | active / archived |
| message_count | INT | 消息数量 |
| created_at / updated_at | TIMESTAMP | 时间戳 |

**chat_messages** — 对话消息表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 自增主键 |
| session_id | BIGINT FK | 所属会话 |
| role | ENUM | user / assistant / system |
| content | TEXT | 消息内容 |
| context_node_id | BIGINT FK NULL | 关联的图谱节点 (针对某节点追问时) |
| metadata | JSON | 扩展数据 (token 用量等) |
| created_at | TIMESTAMP | 时间戳 |
| INDEX | idx_session_created | (session_id, created_at) 加速按时间加载 |

**resource_browse_history** — 资源浏览记录表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 自增主键 |
| user_id | BIGINT FK | 用户 |
| resource_id | BIGINT FK | 浏览的资源 |
| graph_node_id | BIGINT FK NULL | 从哪个图谱节点跳转的 |
| created_at | TIMESTAMP | 浏览时间 |
| INDEX | idx_user_time | (user_id, created_at DESC) 加速历史查询 |

### 设计要点

- **树形存储**: graph_nodes 通过 `parent_id` 自引用实现树形结构，不需要 edges 表
- **分层加载**: `is_expandable` + `is_expanded` 标记节点展开状态，首次只生成 2 层
- **大小限制**: 每次生成限制单层最多 8 个子节点，总深度最多 4 层
- **资源关联**: resources + node_resources 实现节点与学习资料的多对多关联
- **对话关联图谱**: chat_sessions.graph_id 关联图谱，支持在图谱基础上追问
- **消息上下文**: chat_messages.context_node_id 记录针对哪个节点追问，LLM 可获取上下文
- **缓存复用**: `topics.normalized_name` 去重，相同主题直接返回已有图谱

### 性能优化策略

| 场景 | 优化方案 |
|------|---------|
| 对话消息加载 | 分页加载 (每次 20 条)，前端虚拟滚动 (virtual scroll) |
| 图谱数据加载 | 分层按需加载，首次仅返回 2 层节点 |
| 资源列表 | 分页 + 按领域/类型索引查询 |
| LLM 响应 | SSE 流式输出，避免长时间等待 |
| 历史记录 | 列表页只返回摘要字段，详情按需加载 |
| 数据库查询 | 关键查询路径加索引 (session+time, user+time, normalized_name) |
| 前端渲染 | X6 画布仅渲染可视区域节点；消息列表虚拟滚动 |

---

## 三、LangGraph 工作流设计 (核心)

### 3.1 状态定义

```typescript
interface GraphGenerationState {
  // 输入
  userInput: string;
  parentNodeContext?: {          // 展开子节点时的上下文
    nodeLabel: string;
    nodeDescription: string;
    path: string[];              // 从根到当前节点的路径
  };
  config: {
    maxChildrenPerNode: number;  // 单节点最大子节点数 (默认 8)
    generateDepth: number;       // 本次生成层数 (默认 2)
    maxTotalDepth: number;       // 最大总深度 (默认 4)
  };

  // 阶段产物
  analysis?: {
    domain: string;
    scope: string;
    difficulty: string;
  };
  treeData?: {                   // 树形结构数据
    root: TreeNode;
  };
  resourceMatches?: Array<{      // 资源匹配结果
    nodeKey: string;
    resources: { resourceId: number; relevanceScore: number }[];
  }>;
  validation?: {
    isValid: boolean;
    issues: string[];
  };

  // 控制
  retryCount: number;
  currentStep: string;
  error?: string;
}

interface TreeNode {
  key: string;
  label: string;
  description: string;
  type: 'root' | 'branch' | 'leaf';
  isExpandable: boolean;
  children: TreeNode[];
}
```

### 3.2 工作流节点 (5 步)

```
[START]
   │
   ▼
┌──────────────┐
│ analyzeInput │  分析主题，确定知识领域和范围
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ generateTree │  生成树形知识结构 (限制: ≤8子节点/层, 生成2层)
└──────┬───────┘
       │
       ▼
┌────────────────┐
│ matchResources │  从资源库匹配每个节点的相关学习资料
└──────┬─────────┘
       │
       ▼
┌────────────────┐
│ validateTree   │  校验: 节点数合理? 层级正确? 资源匹配?
└──────┬─────────┘
       │
       ▼
   ┌───────┐
   │ 通过?  │──否──▶ retryCount < 2 ? → 回到 generateTree
   └───┬───┘                          → 否则标记 failed
       │是
       ▼
┌──────────────┐
│ persistGraph │  存入 MySQL (nodes + node_resources)
└──────┬───────┘
       │
       ▼
    [END]
```

### 3.3 各节点职责

| 节点 | 核心逻辑 | 大小限制 |
|------|---------|---------|
| analyzeInput | 分析主题领域、范围、难度 | — |
| generateTree | LLM 生成树形 JSON，Prompt 中明确限制子节点数和层数 | **≤8 子节点/层，生成 2 层** |
| matchResources | 用节点 label+description 在 resources 表中匹配 (tags/domain 匹配 + LLM 评分) | 每节点最多关联 3 个资源 |
| validateTree | 检查节点数、层级深度、是否有空节点 | 总节点数 ≤ 25 (首次) |
| persistGraph | 递归写入 graph_nodes，写入 node_resources 关联 | — |

### 3.4 分层加载流程

```
用户输入 "数据结构与算法"
  → 首次生成: 根节点 + 2 层子节点 (约 10-20 个节点)
  → 叶子节点标记 is_expandable = true

用户点击 "排序算法" 节点
  → 调用 expand API，传入节点上下文 + 从根到当前的路径
  → LangGraph 再次运行，以 "排序算法" 为子根生成 2 层
  → 新节点挂载到原树上，前端动画展开
```

### 3.5 资源匹配策略

```
matchResources 节点的匹配逻辑:
1. 关键词匹配: 用节点 label 在 resources.tags JSON 中搜索
2. 领域匹配: 用 analysis.domain 匹配 resources.domain
3. LLM 评分: 将候选资源列表交给 LLM，评估相关度 (0-1)
4. 取 Top 3 关联到节点
```

---

## 四、后端关键设计

### 4.1 多模型 LLM 抽象层 (Provider Pattern)

```
ILlmProvider (接口)
├── chatCompletion(messages, options) → Promise<Result>
├── chatCompletionStream(messages, options) → AsyncIterable<string>
└── healthCheck() → Promise<boolean>

实现类:
├── OpenAIProvider    (openai SDK)
├── ClaudeProvider    (anthropic SDK)
└── TongyiProvider    (dashscope SDK)

LlmService:
├── providers: Map<string, ILlmProvider>
├── getProvider(name?) → ILlmProvider
└── 根据 .env LLM_DEFAULT_PROVIDER 配置默认模型
```

### 4.2 Chat 对话模块设计

**用户交互流程**:
```
用户输入 "数据结构与算法"
  → 系统生成思维导图 (SSE 推送进度)
  → 图谱展示在左侧/上方
  → 右侧/下方显示 Chat 面板，首条 assistant 消息 = 图谱摘要
  → 用户可以:
    a) 在 Chat 中追问: "详细讲讲红黑树" → LLM 文本回答 (流式)
    b) 点击图谱节点追问: 自动带入节点上下文 → LLM 回答
    c) 展开图谱子节点: 调用 expand API
```

**Chat Service 核心逻辑**:
```typescript
ChatService:
├── createSession(userId, graphId?) → session
├── sendMessage(sessionId, content, contextNodeId?)
│   ├── 1. 构建 LLM messages: system prompt + 图谱上下文 + 历史消息 (最近 20 条)
│   ├── 2. 如果有 contextNodeId，注入该节点的 description + 路径上下文
│   ├── 3. 调用 LLM 流式生成
│   └── 4. 存储 user message + assistant message
├── getSessionHistory(sessionId, page, pageSize) → messages[]
├── getUserSessions(userId) → sessions[]
└── archiveSession(sessionId)
```

**上下文窗口管理** (避免 token 超限):
- 始终包含: system prompt + 图谱摘要 (固定)
- 滑动窗口: 最近 20 条消息
- 如果有 contextNodeId: 额外注入节点描述 + 从根到该节点的路径
- 预估 token 数，超限时截断早期消息

### 4.3 Resource 模块 (知识库资源)

```typescript
ResourceService:
├── findByTags(tags: string[], domain: string) → Resource[]
├── create(dto)          // 管理员预置资源
├── search(keyword)      // 搜索资源
└── getByNodeId(nodeId)  // 获取节点关联资源

// 后续扩展: 用户上传
├── uploadResource(userId, file/url)
└── 上传后解析标签，存入 resources 表 (source='user_upload')
```

### 4.4 SSE 实时推送

```
GET /api/graph/generate/stream?topic=xxx

SSE Events:
→ { step: "analyzeInput",    progress: 15, message: "分析知识领域..." }
→ { step: "generateTree",    progress: 45, message: "生成知识结构..." }
→ { step: "matchResources",  progress: 70, message: "匹配学习资源..." }
→ { step: "validateTree",    progress: 85, message: "校验图谱质量..." }
→ { step: "persistGraph",    progress: 95, message: "保存图谱..." }
→ { step: "complete",        progress: 100, data: { graphId, treeData } }
```

### 4.5 REST API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| **认证** | | |
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 → JWT |
| **图谱** | | |
| POST | /api/graph/generate | 生成图谱 {topic, depth?, provider?} |
| GET | /api/graph/generate/stream | SSE 流式生成 |
| GET | /api/graph/:id | 获取图谱 (完整树 + 资源链接) |
| POST | /api/graph/:id/expand/:nodeId | 展开子节点 (分层加载) |
| GET | /api/graph/history | 用户图谱历史 |
| **对话** | | |
| POST | /api/chat/sessions | 创建会话 {graphId?} |
| GET | /api/chat/sessions | 用户会话列表 (分页) |
| GET | /api/chat/sessions/:id | 会话详情 |
| GET | /api/chat/sessions/:id/messages | 消息列表 (分页, 支持向上加载更早消息) |
| POST | /api/chat/sessions/:id/messages | 发送消息 {content, contextNodeId?} |
| GET | /api/chat/sessions/:id/messages/stream | SSE 流式回复 |
| PATCH | /api/chat/sessions/:id | 归档/重命名会话 |
| **主题** | | |
| GET | /api/topics/search | 搜索已有主题 |
| GET | /api/topics/hot | 热门主题 |
| **资源** | | |
| GET | /api/resources | 资源列表 (分页+领域/类型筛选) |
| GET | /api/resources/search | 搜索资源 |
| POST | /api/resources | 新增预置资源 (管理员) |
| POST | /api/resources/:id/browse | 记录浏览 |
| GET | /api/resources/history | 用户资源浏览记录 |
| **LLM** | | |
| GET | /api/llm/providers | 可用 LLM 列表 |

### 4.6 展开子节点 API 详细设计

```typescript
// POST /api/graph/:id/expand/:nodeId
// Request:
{ depth?: number }  // 展开层数，默认 2

// Response:
{
  parentNodeId: 123,
  newNodes: [
    {
      id: 201,
      parentId: 123,
      label: "冒泡排序",
      description: "...",
      type: "leaf",
      isExpandable: true,
      depthLevel: 3,
      resources: [
        { id: 1, title: "冒泡排序详解", url: "...", type: "article" },
        { id: 2, title: "排序算法可视化", url: "...", type: "tutorial" }
      ]
    },
    // ... 更多子节点
  ]
}
```

---

## 五、前端关键设计

### 5.1 页面结构

```
views/
├── HomeView.vue          # 首页: 搜索框 + 热门主题 + 最近图谱
├── GraphChatView.vue     # 核心页面: 左侧思维导图 + 右侧 Chat 面板
├── ResourcesView.vue     # 知识资源库: 分类浏览 + 搜索
├── HistoryView.vue       # 历史记录: Tab 切换 (对话/图谱/资源浏览)
└── LoginView.vue         # 登录/注册
```

### 5.2 GraphChatView 布局 (核心页面)

```
┌──────────────────────────────────────────────────────────┐
│  [← 返回]  数据结构与算法  [缩放] [居中] [导出]          │
├────────────────────────────┬─────────────────────────────┤
│                            │  对话                        │
│   @antv/x6 思维导图        │  ┌─────────────────────┐    │
│   (可缩放/平移)            │  │ AI: 这是关于数据结构 │    │
│                            │  │ 与算法的知识图谱...   │    │
│   ┌─ 数据结构与算法        │  └─────────────────────┘    │
│   ├── 线性结构             │  ┌─────────────────────┐    │
│   │   ├── 数组             │  │ 用户: 详细讲讲红黑树 │    │
│   │   ├── 链表 [+]         │  └─────────────────────┘    │
│   │   └── 栈与队列         │  ┌─────────────────────┐    │
│   ├── 树形结构 [+]         │  │ AI: 红黑树是一种...  │    │
│   └── 排序算法 [+]         │  │ (流式输出中...)      │    │
│                            │  └─────────────────────┘    │
│  点击节点 → 右侧显示详情    │                             │
│  点击 [+] → 展开子节点     │  ┌─────────────────────┐    │
│                            │  │ 输入问题...    [发送] │    │
├────────────────────────────┴─────────────────────────────┤
│  关联资源: [排序算法详解] [可视化教程] [LeetCode题单]      │
└──────────────────────────────────────────────────────────┘
```

### 5.3 @antv/x6 思维导图组件

- 蚂蚁出品，Vue 生态友好，有 `@antv/x6-vue-shape` 支持 Vue 组件作为节点
- 内置 `@antv/layout` 提供 CompactBox / Mindmap 树形布局算法
- 支持节点展开/折叠、动画过渡、缩放平移
- 节点可完全自定义 (HTML/Vue 组件)，方便嵌入资源链接

### 5.4 核心组件设计

```
components/
├── mindmap/                     # 思维导图组件
│   ├── MindMapContainer.vue     # X6 画布容器 + 初始化
│   ├── MindMapNode.vue          # 自定义节点 (Vue Shape)
│   ├── ResourcePopover.vue      # 资源链接弹出面板
│   ├── MindMapToolbar.vue       # 工具栏
│   ├── NodeDetailDrawer.vue     # 节点详情抽屉
│   └── GenerationProgress.vue   # 生成进度条
├── chat/                        # 对话组件
│   ├── ChatPanel.vue            # Chat 面板容器
│   ├── MessageList.vue          # 消息列表 (虚拟滚动)
│   ├── MessageBubble.vue        # 单条消息气泡 (支持 Markdown 渲染)
│   ├── ChatInput.vue            # 输入框 + 发送按钮
│   ├── StreamingText.vue        # 流式文本输出动画
│   └── SessionList.vue          # 历史会话列表 (侧边栏)
└── common/
    ├── AppHeader.vue
    ├── SearchInput.vue
    └── VirtualScroll.vue        # 虚拟滚动组件 (消息列表性能)
```

### 5.5 节点视觉设计

```
┌─────────────────────────────────┐
│ [蓝] 数据结构与算法              │  ← root 节点 (蓝色左边框)
│    "计算机科学核心基础"           │  ← 描述文字 (灰色)
│    [链接] 3个学习资源            │  ← 资源链接入口
│                          [+]    │  ← 展开按钮
└─────────────────────────────────┘
        │
        ├── [紫] 线性结构              ← branch 节点 (紫色)
        │   ├── [绿] 数组              ← leaf 节点 (绿色)
        │   ├── [绿] 链表 [+]          ← 可展开的 leaf
        │   └── [绿] 栈与队列
        │
        ├── [紫] 树形结构
        └── [紫] 排序算法 [+]
```

### 5.6 交互功能

| 操作 | 行为 |
|------|------|
| 点击节点 | 打开右侧抽屉，显示知识点详情 + 关联资源完整列表 |
| 点击 [+] 按钮 | 调用 expand API，动画展开子节点 (分层加载) |
| 点击 [-] 按钮 | 折叠子节点 (仅前端操作，不删除数据) |
| 点击资源图标 | 弹出 Popover 显示 Top 3 资源链接 |
| 点击资源链接 | 新标签页打开学习资料 |
| 滚轮 | 缩放画布 |
| 拖拽空白区域 | 平移画布 |
| 工具栏-居中 | 自适应缩放，居中显示整棵树 |

### 5.7 Composable 设计

```typescript
// useX6Tree(containerRef) — X6 画布 + 树形布局封装
// useSSE(url) — SSE 连接管理 (图谱生成 + Chat 流式回复共用)
// useMindMap() — 图谱业务逻辑
// useChat(sessionId) — 对话业务逻辑 (发送/接收/流式/历史加载)
// useVirtualScroll(containerRef, items) — 虚拟滚动 (消息列表性能)
```

### 5.8 Pinia Store

```typescript
// graph.store.ts — 图谱状态
state: {
  currentGraph: { id, title, treeData } | null,
  generationStatus: 'idle' | 'generating' | 'done' | 'error',
  currentStep: string,
  progress: number,
  expandingNodeId: number | null,
  graphHistory: GraphSummary[],
}

// chat.store.ts — 对话状态
state: {
  currentSession: { id, graphId, title } | null,
  messages: ChatMessage[],           // 当前会话消息
  isStreaming: boolean,              // 是否正在流式输出
  streamingContent: string,          // 流式输出中的内容
  sessions: SessionSummary[],        // 会话列表
  hasMoreMessages: boolean,          // 是否有更早的消息 (向上加载)
}

// resource.store.ts — 资源状态
state: {
  resources: Resource[],
  browseHistory: BrowseRecord[],
  filters: { domain?, type?, keyword? },
  pagination: { page, pageSize, total },
}
```

---

## 六、大小限制策略汇总

| 限制项 | 值 | 说明 |
|--------|---|------|
| 单节点最大子节点数 | **8** | Prompt 中硬性约束 |
| 首次生成层数 | **2 层** | 根 + 一级 + 二级 |
| 首次总节点数上限 | **≤ 25** | validateTree 校验 |
| 最大展开总深度 | **4 层** | 超过后 is_expandable=false |
| 每次展开生成层数 | **2 层** | 与首次一致 |
| 每节点关联资源数 | **≤ 3** | matchResources 取 Top 3 |

Prompt 中的限制示例:
```
请为"{topic}"生成知识结构树。要求:
- 根节点为主题本身
- 第一层: 3-6 个核心分支，每个分支代表一个主要知识领域
- 第二层: 每个分支下 2-5 个子知识点
- 总节点数不超过 25 个
- 每个节点包含: key, label, description(50字以内), isExpandable(是否值得深入)
- 输出严格 JSON 格式
```

---

## 七、实施阶段

### Phase 1: 项目脚手架 + 基础设施
- 初始化 pnpm monorepo
- 搭建 Vue 3 + Vite 前端
- 搭建 NestJS 后端
- 创建 shared 包 (Zod Schema + Types)
- MySQL + TypeORM 配置，建表 (9 张表)
- 预置一批学习资源到 resources 表

### Phase 2: LLM 层 + LangGraph 工作流
- 实现 ILlmProvider 接口 + 首个 Provider
- 实现 LangGraph 5 步工作流 (含大小限制)
- 实现资源匹配逻辑
- SSE 进度推送

### Phase 3: 图谱 API + 分层加载
- graph 模块 CRUD
- topic 模块 (搜索、去重、热度)
- expand API (分层加载核心)
- resource 模块 CRUD

### Phase 4: @antv/x6 思维导图可视化
- X6 画布初始化 + Mindmap 布局
- 自定义 Vue 节点组件
- 展开/折叠动画
- 资源链接 Popover
- SSE 接入生成进度

### Phase 5: Chat 对话功能
- chat 模块后端 (会话管理 + 消息存储)
- LLM 流式对话 + 图谱上下文注入
- ChatPanel 前端组件 (消息列表 + 虚拟滚动 + 流式输出)
- GraphChatView 页面整合 (左图谱 + 右对话)
- 点击节点追问联动

### Phase 6: 资源库 + 历史记录 + 完善
- ResourcesView 资源浏览页面
- HistoryView 三类历史记录 (对话/图谱/资源浏览)
- JWT 认证
- 多 LLM 切换 UI
- 错误处理 + 响应式适配

---

## 验证方式

1. 启动 MySQL，建表，导入预置资源数据
2. `pnpm dev` 启动前后端
3. **图谱生成**: 输入 "数据结构与算法"
   - SSE 推送 5 步进度
   - X6 渲染 2 层树形思维导图 (≤25 节点)
   - 节点上显示资源链接图标
4. **分层展开**: 点击 "排序算法" 的 [+] 按钮
   - 动画展开 2 层子节点
5. **追问对话**: 在右侧 Chat 输入 "详细讲讲快速排序的时间复杂度"
   - 流式输出 LLM 回答
   - 消息保存到数据库
6. **节点追问**: 点击 "链表" 节点后追问
   - LLM 回答带有链表上下文
7. **资源浏览**: 点击资源链接，新标签页打开，浏览记录写入
8. **历史记录**: 切换到 History 页面，查看三类历史
9. **缓存**: 刷新页面，相同主题从 MySQL 缓存加载
10. **性能**: 消息列表 50+ 条时虚拟滚动正常工作
