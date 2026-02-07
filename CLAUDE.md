# Knowledge Map 项目规则

## 项目概述

面向学生的知识库平台，核心功能：AI 生成树形思维导图、追问对话、知识资源库。

- 不被要求时，不允许修改项目结构
- 不被要求时，不允许使用git提交代码
- 不被要求时，不允许主动生成文档

## 技术栈

- **前端**: Vue 3 (Composition API + `<script setup>` + TypeScript) + Vite
- **后端**: NestJS 10 (TypeORM + MySQL)
- **可视化**: @antv/x6 + @antv/layout (树形思维导图)
- **校验**: Zod (前后端共享 Schema)
- **AI 编排**: LangGraph.js (5 步工作流)
- **LLM**: 多模型抽象层 (OpenAI / Claude / 通义千问)
- **实时通信**: SSE (图谱生成进度 + 对话流式输出)
- **包管理**: pnpm workspace

## 文件命名规范

### 后端 (NestJS)

- 实体: `kebab-case.entity.ts` (如 `knowledge-graph.entity.ts`)
- 服务: `kebab-case.service.ts`
- 控制器: `kebab-case.controller.ts`
- 模块: `kebab-case.module.ts`
- LangGraph 节点: `kebab-case.node.ts`
- Provider: `kebab-case.provider.ts`
- 接口: `kebab-case.interface.ts`

### 前端 (Vue 3)

- 页面: `PascalCaseView.vue` (如 `HomeView.vue`)
- 组件: `PascalCase.vue` (如 `MindMapContainer.vue`)
- Store: `kebab-case.store.ts` (如 `graph.store.ts`)
- 服务: `kebab-case.ts` (如 `api.client.ts`)

### 共享包

- 类型: `kebab-case.types.ts`
- Schema: `kebab-case.schema.ts`
- 常量: `index.ts` (导出枚举)

## 代码风格

### 通用

- 注释和文档使用**中文**，添加简洁的中文注释
- JSDoc 注释使用中文描述，`@param` / `@returns` 也用中文
- 异步操作统一使用 `async/await`
- TypeScript 严格模式 (`strict: true`)

### 后端 NestJS 模式

- 每个模块目录结构: `entities/` + `*.controller.ts` + `*.service.ts` + `*.module.ts`
- 实体类名后缀 `Entity` (如 `KnowledgeGraphEntity`)
- 数据库列名 `snake_case`，TypeScript 属性 `camelCase`，通过 `@Column({ name: 'db_name' })` 映射
- 主键统一 `bigint unsigned` 自增
- 分页返回格式: `{ items, total, page, pageSize, totalPages }`
- Service 通过 `@InjectRepository` 注入 TypeORM Repository
- 模块间依赖通过 `imports` + `exports` 管理，循环依赖用 `forwardRef`

### 前端 Vue 3 模式

- 组件统一使用 `<script setup lang="ts">` 语法
- 状态管理使用 Pinia Composition API 风格 (`defineStore` + `ref/computed`)
- 路由使用懒加载 `() => import('@/views/XxxView.vue')`
- API 调用通过 `services/` 层封装，基于 Axios 实例
- 路径别名: `@/` 指向 `src/`，`@shared/` 指向共享包

## 路径别名

```
后端 tsconfig.json:  "@shared/*" → "../shared/src/*"
前端 tsconfig.json:  "@/*" → "./src/*"  |  "@shared/*" → "../shared/src/*"
前端 vite.config.ts: "@" → resolve(__dirname, 'src')
```

## 数据库约定

- 表名: `snake_case` 复数 (如 `knowledge_graphs`, `graph_nodes`)
- 树形结构: `parent_id` 自引用，不使用 edges 表
- 多对多: 独立关联表 (如 `node_resources`)
- JSON 字段: `tags`、`metadata` 等使用 MySQL JSON 类型
- 时间戳: `created_at` + `updated_at` (TypeORM 自动管理)

## LLM / LangGraph 约定

- Provider Pattern: 所有 LLM 实现 `ILlmProvider` 接口
- 通过 OpenAI SDK 兼容接口统一调用 (Claude 和通义千问也走 OpenAI 兼容端点)
- LangGraph 节点函数签名: `(state, ...services) => Promise<Partial<State>>`
- Prompt 模板使用中文，要求 LLM 返回严格 JSON
- 图谱大小限制: 单节点 ≤8 子节点，首次生成 2 层 ≤25 节点，最大深度 4 层

## API 设计

- 全局前缀: `/api`
- RESTful 风格，SSE 端点用 `GET` + `text/event-stream`
- 响应统一包装: `{ code: 200, message: 'success', data }`
- SSE 事件格式: `data: { step, progress, message, data? }\n\n`

## 常用命令

```bash
pnpm dev              # 并行启动前后端
pnpm dev:frontend     # 仅启动前端 (localhost:5173)
pnpm dev:backend      # 仅启动后端 (localhost:3000)
pnpm build            # 构建所有包
pnpm typecheck        # 类型检查
```
