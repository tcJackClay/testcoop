# 项目文件功能指引

## 核心组件 (src/components/)

### 布局组件
| 文件 | 功能 |
|------|------|
| `layout/Header.tsx` | 顶部导航栏，包含Logo、导航项、设置按钮 |
| `layout/Sidebar.tsx` | 左侧悬浮工具栏，包含添加节点、工具按钮、左右面板切换 |
| `leftPanel/LeftPanel.tsx` | 左侧面板统一管理组件 (History/Characters) |
| `rightPanel/RightPanel.tsx` | 右侧面板统一管理组件 (Characters/Chat) |

### Canvas 组件
| 文件 | 功能 |
|------|------|
| `canvas/Canvas.tsx` | 主画布组件，处理拖拽、缩放、选择等 |
| `canvas/CanvasToolbar.tsx` | 画布顶部工具栏 |
| `canvas/CanvasContextMenu.tsx` | 右键菜单组件 |
| `nodes/NodeRenderer.tsx` | 节点渲染主组件 |
| `nodes/nodeConstants.tsx` | 节点图标、颜色常量定义 |
| `nodes/ConnectionLine.tsx` | 连接线组件 |

### 认证组件
| 文件 | 功能 |
|------|------|
| `auth/LoginModal.tsx` | 登录弹窗组件 |

---

## 功能模块 (src/features/)

### 设置模块 (settings/)
| 文件 | 功能 |
|------|------|
| `settings/SettingsModal.tsx` | 设置弹窗主组件，包含多个Tab |
| `settings/ApiTab.tsx` | API配置Tab |
| `settings/LanguageTab.tsx` | 语言设置Tab |
| `settings/DevTab.tsx` | 开发者选项Tab |
| `settings/RegisterTab.tsx` | 用户注册Tab |

### 角色模块 (characters/)
| 文件 | 功能 |
|------|------|
| `characters/CharactersPanel.tsx` | 资产库面板 |

### 历史模块 (history/)
| 文件 | 功能 |
|------|------|
| `history/History.tsx` | 历史记录页面 |
| `history/HistoryPanel.tsx` | 历史记录面板 |
| `history/HistoryCard.tsx` | 历史卡片组件 |

### 聊天模块 (chat/)
| 文件 | 功能 |
|------|------|
| `chat/ChatPanel.tsx` | AI对话面板 |

### 分镜模块 (storyboard/)
| 文件 | 功能 |
|------|------|
| `storyboard/Storyboard.tsx` | 分镜主页面 |
| `storyboard/ShotEditor.tsx` | 镜头编辑器 |
| `storyboard/StoryboardCard.tsx` | 分镜卡片组件 |

### 模型模块 (models/)
| 文件 | 功能 |
|------|------|
| `models/Models.tsx` | 模型管理页面 |

---

## 状态管理 (src/stores/)
| 文件 | 功能 |
|------|------|
| `canvasStore.ts` | 画布状态管理 (节点、连线、视图) |
| `authStore.ts` | 认证状态管理 |

---

## 入口文件
| 文件 | 功能 |
|------|------|
| `App.tsx` | 应用主入口 |
| `main.tsx` | React入口 |

---

## 代码规范
- 所有 `.tsx` 文件不超过 **300行**
- 组件拆分原则：按功能模块拆分，复杂组件拆分为子组件
- 常用拆分模式：
  - 常量提取到单独文件 (`*Constants.tsx`)
  - Tab内容提取到单独文件 (`*Tab.tsx`)
  - 大组件拆分子组件 (`*Body.tsx`, `*Card.tsx`)
