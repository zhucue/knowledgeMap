# Knowledge Map — 面向学生的 AI 知识图谱平台

基于 AI 自动生成树形思维导图，支持追问对话与知识资源库管理，帮助学生高效构建知识体系。

## 功能特性

### AI 思维导图生成

输入任意知识主题，由 LangGraph 5 步工作流（分析输入 → 生成树 → 检索上下文 → 匹配资源 → 校验持久化）自动生成结构化知识图谱。

- 分层按需加载：首次生成 2 层（≤25 节点），点击叶子节点可继续展开，最深 4 层
- 节点自动关联学习资源：LLM 从资源库中为每个知识点匹配 Top 3 相关学习资料并评分
- 主题去重缓存：相同主题直接复用已有图谱，避免重复生成
- @antv/x6 树形可视化，支持缩放、平移、节点详情抽屉

### 图谱追问对话

在思维导图基础上进行多轮 AI 对话，图谱与对话联动。

- 点击任意节点发起追问，自动注入该节点描述及从根到当前节点的完整路径作为上下文
- SSE 流式输出，逐字呈现 AI 回复
- 对话集成 RAG 检索：从知识库中召回相关文档片段，增强回答的准确性
- 滑动窗口管理上下文（最近 20 条消息），自动截断防止 token 超限

### 知识资源库

上传文档构建私有知识库，支持语义检索与协作。

- 多格式文档解析：PDF / DOCX / TXT / Markdown
- 自动分块 + Embedding 向量化，存入 Milvus 向量数据库
- 语义检索：基于向量相似度匹配最相关的文档片段
- 知识库协作：支持多用户共享同一知识库

### 技术亮点

| 特性 | 说明 |
|---|---|
| 多 LLM 支持 | OpenAI / Claude / 通义千问 / DeepSeek / 豆包，Provider Pattern 统一抽象，通过 OpenAI 兼容接口调用 |
| 全栈类型安全 | 前后端共享 Zod Schema + TypeScript 严格模式，校验逻辑零重复 |
| 实时体验 | SSE 推送图谱生成进度（5 步状态实时反馈）与对话流式输出 |
| 向量检索 | Milvus 2.4 驱动语义搜索，支撑 RAG 增强对话与知识库检索 |
| Monorepo | pnpm workspace 管理 frontend / backend / shared 三包，共享类型与常量 |

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 (Composition API + `<script setup>` + TypeScript) + Vite + Tailwind CSS |
| 状态管理 | Pinia |
| 可视化 | @antv/x6 + @antv/layout |
| 后端 | NestJS 10 + TypeORM + MySQL |
| AI 编排 | LangGraph.js（LangChain） |
| LLM | OpenAI / Claude / 通义千问 / DeepSeek / 豆包 |
| 向量数据库 | Milvus 2.4 |
| 校验 | Zod（前后端共享 Schema） |
| 实时通信 | SSE |
| 包管理 | pnpm workspace monorepo |

## 项目结构

```
knowledge/
├── packages/
│   ├── frontend/          # Vue 3 前端
│   │   └── src/
│   │       ├── views/         # 页面（首页、图谱、对话、知识库等）
│   │       ├── components/    # 组件（mindmap / chat / common）
│   │       ├── stores/        # Pinia 状态管理
│   │       ├── services/      # API 调用层
│   │       ├── composables/   # 组合式函数
│   │       └── router/        # 路由配置
│   ├── backend/           # NestJS 后端
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/            # JWT 认证
│   │       │   ├── user/            # 用户管理
│   │       │   ├── topic/           # 主题管理
│   │       │   ├── graph/           # 知识图谱 CRUD + SSE
│   │       │   ├── chat/            # 对话管理
│   │       │   ├── resource/        # 学习资源
│   │       │   ├── knowledge-base/  # 知识库（文档解析、向量存储、检索）
│   │       │   └── llm/             # LLM 抽象层 + LangGraph 工作流
│   │       └── common/          # 守卫、拦截器、过滤器、管道
│   └── shared/            # 共享包（Zod Schema、类型、常量）
├── database/
│   └── init.sql           # 数据库初始化脚本
├── docker/
│   └── docker-compose.yml # Milvus + etcd + MinIO
└── package.json           # 工作区根配置
```

## 快速开始

### 环境要求

- Node.js >= 20
- pnpm >= 9
- MySQL 8
- Docker & Docker Compose（用于 Milvus）

### 1. 克隆 & 安装依赖

```bash
git clone <repo-url>
cd knowledge
pnpm install
```

### 2. 配置环境变量

复制模板并填写实际值：

```bash
cp .env.example packages/backend/.env
```

编辑 `packages/backend/.env`，填入数据库密码、JWT 密钥、LLM API Key 等（详见下方环境变量说明）。

### 3. 初始化数据库

确保 MySQL 服务已启动，然后执行初始化脚本：

```bash
mysql -u root -p < database/init.sql
```

该脚本会创建 `knowledge_map` 数据库及所有必要的表。

### 4. 启动 Milvus 向量数据库

```bash
cd docker
docker compose up -d
```

等待所有服务健康运行（etcd + MinIO + Milvus）。

### 5. 启动开发服务器

```bash
# 同时启动前后端
pnpm dev

# 或分别启动
pnpm dev:frontend   # http://localhost:5173
pnpm dev:backend    # http://localhost:3000
```

## 环境变量说明

| 变量 | 说明 | 默认值 |
|---|---|---|
| `PORT` | 后端服务端口 | `3000` |
| `NODE_ENV` | 运行环境 | `development` |
| `DB_HOST` | MySQL 主机地址 | `localhost` |
| `DB_PORT` | MySQL 端口 | `3306` |
| `DB_USERNAME` | MySQL 用户名 | `root` |
| `DB_PASSWORD` | MySQL 密码 | — |
| `DB_DATABASE` | 数据库名 | `knowledge_map` |
| `JWT_SECRET` | JWT 签名密钥 | — |
| `JWT_EXPIRES_IN` | JWT 过期时间 | `7d` |
| `LLM_DEFAULT_PROVIDER` | 默认 LLM 提供商 | `openai` |
| `LLM_OPENAI_API_KEY` | OpenAI API Key | — |
| `LLM_OPENAI_BASE_URL` | OpenAI API 地址 | `https://api.openai.com/v1` |
| `LLM_OPENAI_MODEL` | OpenAI 模型 | `gpt-4o` |
| `LLM_CLAUDE_API_KEY` | Claude API Key | — |
| `LLM_CLAUDE_MODEL` | Claude 模型 | `claude-3-5-sonnet-20241022` |
| `LLM_TONGYI_API_KEY` | 通义千问 API Key | — |
| `LLM_TONGYI_MODEL` | 通义千问模型 | `qwen-plus` |
| `MILVUS_ADDRESS` | Milvus 连接地址 | `localhost:19530` |
| `EMBEDDING_MODEL` | Embedding 模型 | `text-embedding-3-small` |

## 常用命令

```bash
pnpm dev              # 并行启动前后端
pnpm dev:frontend     # 仅启动前端
pnpm dev:backend      # 仅启动后端
pnpm build            # 构建所有包
pnpm typecheck        # 类型检查
pnpm lint             # 代码检查
```

## License

MIT
