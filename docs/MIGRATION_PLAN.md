# Tapnow Studio 前端迁移计划

## 一、迁移概述

### 1.1 项目背景

| 项目 | 现状 |
|-----|------|
| **源项目** | Tapnow Studio PP (v3.8.8-rc7) |
| **源前端** | 单文件 React (App.jsx ~40000 行) |
| **源后端** | Python 本地接收器 (tapnow-server-full.py) |
| **目标目录** | `D:\work\Huanu\VibeCode\aigc-coop-fronted` |
| **目标 API** | Axios 模块化架构，统一 `/api` 前缀 |

### 1.2 迁移目标

1. ✅ **仅保留前端**: 移除本地 Python 后端
2. ✅ **接入现有 API**: 使用目标目录的 API 客户端模式
3. ✅ **合理文件架构**: 模块化分层设计
4. ✅ **文件行数控制**: 单文件 ≤300 行

---

## 二、目标 API 架构分析

### 2.1 现有 API 结构

```
src/api/
├── client.ts        # Axios 实例 + 拦截器 + 统一类型
├── index.ts         # 统一导出
├── auth.ts          # 认证
├── user.ts          # 用户管理
├── project.ts       # 项目管理
├── image.ts         # 图片管理
├── video.ts         # 视频管理
├── script.ts        # 脚本管理
├── storyboardScript.ts  # 分镜脚本
├── systemPrompt.ts  # 系统提示词
├── prompt.ts        # 提示词管理
├── storyOutline.ts  # 故事大纲
├── gridStoryboard.ts # 网格分镜
├── episodeScript.ts # 集脚本
├── approval.ts      # 审批
├── config.ts        # API 配置
├── vector.ts        # 向量引擎
└── runningHub.ts    # RunningHub
```

### 2.2 API 客户端模式

```typescript
// 统一响应格式
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 模块化 API
export const imageApi = {
  getAll: (projectId?: number) => Promise<ApiResponse<Image[]>>,
  getById: (id: number) => Promise<ApiResponse<Image>>,
  create: (data: CreateImageRequest) => Promise<ApiResponse<Image>>,
  update: (id: number, data: UpdateImageRequest) => Promise<ApiResponse<Image>>,
  delete: (id: number) => Promise<ApiResponse<void>>,
}
```

---

## 三、源项目功能模块分析

### 3.1 核心功能模块

| 模块 | 行数估算 | 核心功能 |
|-----|---------|---------|
| **节点编辑器** | ~8000 | 画布渲染、节点拖拽、连线、缩放 |
| **智能分镜** | ~6000 | 分镜编辑器、批量生成、预览 |
| **模型库** | ~5000 | 模型配置、请求模板、异步轮询 |
| **历史管理** | ~4000 | 历史记录、缩略图、批量操作 |
| **API 调用层** | ~4000 | 多模型接入、轮询、重试 |
| **UI 组件** | ~6000 | 弹窗、侧边栏、设置面板 |
| **工具函数** | ~3000 | 图片处理、存储、工具库 |
| **状态管理** | ~4000 | React Context + Hooks |

### 3.2 需要保留的核心功能

- ✅ 无限画布节点编辑器
- ✅ 智能分镜系统 (卡片/表格视图)
- ✅ AI 绘图/视频节点
- ✅ 历史记录管理
- ✅ 图像对比工具
- ✅ 性能模式切换
- ✅ i18n 国际化

---

## 四、目标架构设计

### 4.1 目录结构

```
src/
├── main.tsx                    # 入口文件
├── App.tsx                     # 根组件 (≤150行)
├── i18n/                      # 国际化
│   ├── index.ts               # i18n 配置
│   └── locales/
│       ├── en.json
│       └── zh.json
│
├── api/                        # API 层 (已有，复用)
│   ├── client.ts              # Axios 客户端
│   ├── config.ts              # API 配置管理
│   ├── model.ts               # 模型管理 (新增)
│   ├── task.ts                # 任务管理 (新增)
│   └── index.ts
│
├── components/                 # 公共组件
│   ├── common/                # 通用组件
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Dropdown.tsx
│   │   ├── Toast.tsx
│   │   └── Loading.tsx
│   │
│   ├── layout/                # 布局组件
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Layout.tsx
│   │
│   └── canvas/                # 画布组件
│       ├── Canvas.tsx          # 画布主组件
│       ├── CanvasToolbar.tsx   # 工具栏
│       ├── CanvasGrid.tsx      # 网格背景
│       └── CanvasZoom.tsx     # 缩放控制
│
├── features/                   # 功能模块
│   ├── nodes/                 # 节点系统
│   │   ├── NodeContainer.tsx   # 节点容器
│   │   ├── NodeRenderer.tsx    # 节点渲染器
│   │   ├── NodeConnection.tsx  # 连接线
│   │   ├── NodeTypes.ts        # 节点类型定义
│   │   └── NodePanel.tsx       # 节点配置面板
│   │
│   ├── storyboard/            # 智能分镜
│   │   ├── Storyboard.tsx     # 主组件
│   │   ├── StoryboardCard.tsx # 卡片视图
│   │   ├── StoryboardTable.tsx # 表格视图
│   │   ├── ShotEditor.tsx     # 镜头编辑
│   │   └── BatchGenerate.tsx  # 批量生成
│   │
│   ├── history/               # 历史管理
│   │   ├── HistoryPanel.tsx   # 历史面板
│   │   ├── HistoryCard.tsx   # 历史卡片
│   │   └── HistoryThumbnail.tsx # 缩略图
│   │
│   ├── model/                # 模型库
│   │   ├── ModelLibrary.tsx   # 模型库主组件
│   │   ├── ModelCard.tsx     # 模型卡片
│   │   └── ModelConfig.tsx   # 模型配置
│   │
│   ├── image/                # 图像工具
│   │   ├── ImageCompare.tsx  # 图像对比
│   │   └── ImageUpload.tsx   # 图片上传
│   │
│   └── settings/             # 设置
│       ├── Settings.tsx      # 设置主组件
│       ├── ApiSettings.tsx   # API 配置
│       └── ThemeSettings.tsx # 主题设置
│
├── hooks/                     # 自定义 Hooks
│   ├── useCanvas.ts          # 画布状态
│   ├── useNodes.ts           # 节点管理
│   ├── useConnections.ts     # 连线管理
│   ├── useHistory.ts         # 历史记录
│   ├── useStoryboard.ts      # 分镜状态
│   ├── useModel.ts          # 模型管理
│   ├── useApi.ts            # API 调用
│   ├── useLocalStorage.ts   # 本地存储
│   └── usePerformance.ts     # 性能模式
│
├── stores/                    # 状态管理
│   ├── canvasStore.ts        # 画布状态
│   ├── nodeStore.ts          # 节点状态
│   ├── storyboardStore.ts    # 分镜状态
│   ├── historyStore.ts       # 历史状态
│   ├── modelStore.ts         # 模型状态
│   └── settingsStore.ts      # 设置状态
│
├── services/                  # 业务服务
│   ├── imageService.ts       # 图片处理
│   ├── videoService.ts       # 视频处理
│   ├── taskService.ts        # 任务轮询
│   ├── cacheService.ts       # 缓存管理
│   └── exportService.ts      # 导出服务
│
├── utils/                     # 工具函数
│   ├── constants.ts          # 常量定义
│   ├── helpers.ts            # 辅助函数
│   ├── validators.ts         # 验证函数
│   └── formatters.ts         # 格式化函数
│
├── types/                     # 类型定义
│   ├── node.ts               # 节点类型
│   ├── storyboard.ts         # 分镜类型
│   ├── model.ts              # 模型类型
│   ├── history.ts            # 历史类型
│   └── api.ts                # API 类型
│
└── styles/                    # 样式
    ├── globals.css           # 全局样式
    ├── canvas.css           # 画布样式
    └── components.css       # 组件样式
```

### 4.2 模块拆分策略

#### 4.2.1 按功能域拆分

| 功能域 | 包含模块 | 预估文件数 |
|--------|---------|-----------|
| **画布编辑** | Canvas, Nodes, Connections | 8-10 |
| **智能分镜** | Storyboard, Shot, Batch | 5-6 |
| **模型管理** | ModelLibrary, ModelConfig | 3-4 |
| **历史记录** | HistoryPanel, Thumbnail | 3-4 |
| **工具类** | Image, Settings, Common | 8-10 |
| **状态管理** | Stores, Hooks | 10-12 |
| **API 层** | API Client, Services | 8-10 |

#### 4.2.2 行数控制策略

```
单文件行数限制: ≤300 行

控制方法:
1. 组件拆分: 大组件拆分为子组件
2. 类型分离: 类型定义单独文件
3. 样式分离: CSS 单独文件
4. 逻辑抽离: 业务逻辑移至 Hooks/Services
5. 常量抽离: 枚举/常量单独文件
```

---

## 五、API 对接映射

### 5.1 源功能 → 目标 API 映射

| 源功能 | 源实现 | 目标 API |
|--------|--------|---------|
| 图片存储 | IndexedDB + LocalServer | `POST /api/image` |
| 图片列表 | LocalStorage | `GET /api/image` |
| 视频存储 | IndexedDB + LocalServer | `POST /api/video` |
| 项目管理 | LocalStorage | `GET /api/project` |
| 用户认证 | - | `POST /api/auth/login` |
| API 配置 | 配置文件 | `GET /api/config` |
| 模型管理 | 内置模板 | `GET /api/config` + 新增 `model.ts` |

### 5.2 新增 API 模块

```typescript
// src/api/model.ts - 模型管理
export interface ModelConfig {
  id: number
  name: string
  provider: string
  modelId: string
  baseUrl: string
  apiKey: string
  type: 'image' | 'video'
  config: Record<string, unknown>
  status: number
}

export const modelApi = {
  getAll: () => Promise<ApiResponse<ModelConfig[]>>,
  create: (data: Partial<ModelConfig>) => Promise<ApiResponse<ModelConfig>>,
  update: (id: number, data: Partial<ModelConfig>) => Promise<ApiResponse<ModelConfig>>,
  delete: (id: number) => Promise<ApiResponse<void>>,
  test: (id: number) => Promise<ApiResponse<boolean>>,
}

// src/api/task.ts - 任务管理
export interface TaskRequest {
  modelId: number
  prompt: string
  images?: string[]
  params: Record<string, unknown>
}

export interface {
  id: TaskResult string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: string
  error?: string
}

export const taskApi = {
  create: (data: TaskRequest) => Promise<ApiResponse<TaskResult>>,
  getStatus: (id: string) => Promise<ApiResponse<TaskResult>>,
  cancel: (id: string) => Promise<ApiResponse<void>>,
  getResult: (id: string) => Promise<ApiResponse<string>>,
}
```

---

## 六、迁移阶段计划

### 6.1 阶段划分

| 阶段 | 任务 | 预估工时 |
|------|------|---------|
| **Phase 1** | 基础架构搭建 | 2h |
| **Phase 2** | API 层对接 | 4h |
| **Phase 3** | 核心组件开发 | 8h |
| **Phase 4** | 功能模块迁移 | 16h |
| **Phase 5** | 样式与优化 | 4h |
| **Phase 6** | 测试与调优 | 4h |

### 6.2 详细任务分解

#### Phase 1: 基础架构搭建 (2h)

- [ ] 1.1 初始化项目配置 (package.json, vite.config.js, tailwind.config.js)
- [ ] 1.2 创建目录结构
- [ ] 1.3 配置基础组件 (Button, Modal, Toast, Loading)
- [ ] 1.4 搭建布局组件 (Header, Sidebar, Layout)

#### Phase 2: API 层对接 (4h)

- [ ] 2.1 复用现有 `api/client.ts`
- [ ] 2.2 创建 `api/model.ts` 模型管理
- [ ] 2.3 创建 `api/task.ts` 任务管理
- [ ] 2.4 创建类型定义 `types/`

#### Phase 3: 核心组件开发 (8h)

- [ ] 3.1 画布基础架构 (Canvas, Grid, Zoom)
- [ ] 3.2 节点系统基础 (NodeContainer, NodeRenderer)
- [ ] 3.3 连线系统 (NodeConnection)
- [ ] 3.4 节点面板 (NodePanel)

#### Phase 4: 功能模块迁移 (16h)

- [ ] 4.1 智能分镜模块 (Storyboard)
- [ ] 4.2 历史记录模块 (History)
- [ ] 4.3 模型库模块 (ModelLibrary)
- [ ] 4.4 图像对比工具 (ImageCompare)
- [ ] 4.5 设置面板 (Settings)

#### Phase 5: 样式与优化 (4h)

- [ ] 5.1 样式文件整理
- [ ] 5.2 性能优化
- [ ] 5.3 i18n 完善

#### Phase 6: 测试与调优 (4h)

- [ ] 6.1 单元测试
- [ ] 6.2 集成测试
- [ ] 6.3 Bug 修复

---

## 七、关键技术决策

### 7.1 状态管理方案

| 方案 | 选择 | 理由 |
|------|------|------|
| Redux | ❌ | 过于重 |
| Zustand | ❌ | 目标项目未使用 |
| **React Context + Hooks** | ✅ | 轻量、符合现有模式 |
| **useReducer** | ✅ | 复杂状态管理 |

### 7.2 样式方案

| 方案 | 选择 | 理由 |
|------|------|------|
| CSS Modules | ❌ | 目标项目未使用 |
| Styled Components | ❌ | 过于重 |
| **Tailwind CSS** | ✅ | 目标项目已配置 |
| **内联样式** | ✅ | 动态样式需求 |

### 7.3 画布渲染方案

| 方案 | 选择 | 理由 |
|------|------|------|
| Canvas API | ❌ | 复杂交互难实现 |
| SVG | ❌ | 大量节点性能差 |
| **React + DOM** | ✅ | 简单、调试方便 |
| **reactflow** | ❌ | 需额外学习 |

---

## 八、风险与应对

### 8.1 主要风险

| 风险 | 影响 | 应对方案 |
|------|------|---------|
| 单文件行数超限 | 代码质量 | 严格按架构拆分 |
| API 能力不足 | 功能缺失 | 扩展 API 模块 |
| 性能问题 |用户体验 | 分阶段加载 + 虚拟列表 |
| 样式不一致 | UI 问题 | 统一设计规范 |

### 8.2 回滚策略

- 每个阶段完成后进行功能验证
- 保留源项目作为参考
- 渐进式迁移而非一次性重写

---

## 九、验收标准

### 9.1 功能验收

- [ ] 画布节点拖拽、连线、缩放正常
- [ ] 智能分镜创建、编辑、批量生成正常
- [ ] 历史记录增删改查正常
- [ ] 模型库配置保存正常
- [ ] API 请求正常返回

### 9.2 代码质量

- [ ] 单文件行数 ≤300
- [ ] TypeScript 类型完整
- [ ] 统一代码风格
- [ ] 必要的注释

### 9.3 性能要求

- [ ] 首次加载 ≤3s
- [ ] 100 节点操作流畅
- [ ] 内存无明显泄漏
