# aigc-coop-fronted vs huanu-workbench-frontend 剧本/故事板功能对比

---

## 1. 功能对比总览

| 功能模块 | aigc-coop-fronted (剧本侧边栏) | huanu-workbench-frontend (故事板页面) |
|---------|-------------------------------|--------------------------------------|
| **定位** | 左侧边栏面板 (ScriptPanel) | 独立完整页面 (Storyboard) |
| **剧本上传** | ✅ 本地文件读取 | ✅ 本地文件读取 |
| **资产提取** | ✅ 调用 API (未完整实现) | ✅ 完整实现 |
| **剧本分析** | ✅ 调用 API (未完整实现) | ✅ 完整实现 (大纲/人物/关系) |
| **剧集分集** | ✅ 本地分割逻辑 | ✅ 本地分割 + 后端存储 |
| **分镜生成** | ❌ 无 (在 StoryboardNode 中) | ✅ 完整实现 (AI 生成) |
| **分镜编辑** | ❌ 无 | ✅ 完整实现 (ShotEditorPanel) |
| **数据持久化** | ⚠️ 部分实现 | ✅ 完整实现 |

---

## 2. 详细功能对比

### 2.1 剧本上传

| 项目 | 实现方式 |
|------|----------|
| **aigc-coop-fronted** | `handleFileUpload()` - 读取 File.text() 存入 state |
| **huanu-workbench** | `handleScriptUpload()` - 同上，存入 state |

**代码对比**:

```ts
// aigc-coop-fronted
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  setScriptFile(file);
  const content = await file.text();
  setScriptContent(content);
};

// huanu-workbench
const handleScriptUpload = useCallback(async (file: File, styleCfg: any) => {
  setScriptFile(file);
  const content = await file.text();
  setScriptContent(content);
}, [setScriptContent, setScriptFile]);
```

**结论**: 功能相同，aigc-coop-fronted 更简洁

---

### 2.2 资产提取

| 项目 | 实现状态 | API 调用 |
|------|---------|---------|
| **aigc-coop-fronted** | ⚠️ 有 UI，API 未完整对接 | `scriptApi.analyze()` (options.extractAssets) |
| **huanu-workbench** | ✅ 完整实现 | `api.vector.extractAssets(file, projectId)` |

**aigc-coop-fronted 代码**:
```ts
const handleAnalyze = async () => {
  const response = await scriptApi.analyze({
    scriptContent,
    projectId: currentProjectId,
    options: {
      extractAssets: true,
      generateOutline: true,
      generateCharacterBios: true,
      analyzeRelationships: true,
    }
  });
  // TODO: 处理分析结果 ← 未完整实现
};
```

**huanu-workbench 代码**:
```ts
const handleAIAnalyze = useCallback(async (file?: File) => {
  // 1. 调用 API
  analysisResult = await api.vector.extractAssets(targetFile, currentProjectId);
  
  // 2. 解析 JSON
  parsedResult = transformAssetResponse(rawData);
  
  // 3. 同步资产到后端
  await syncAssetsToBackend(parsedResult, currentProjectId);
  
  // 4. 同步分析结果
  await syncStoryOutlineToBackend(parsedResult, currentProjectId);
}, [...]);
```

**结论**: huanu-workbench 完整实现了资产提取、解析、存储全流程；aigc-coop-fronted 只有 API 调用，缺少后续处理

---

### 2.3 剧本分析

| 项目 | 实现状态 | 说明 |
|------|---------|------|
| **aigc-coop-fronted** | ⚠️ 调用 API，未处理结果 | 调用 `scriptApi.analyze()` |
| **huanu-workbench** | ✅ 完整实现 | 分析大纲、人物小传、人物关系 |

**huanu-workbench 额外功能**:
```ts
// 同步人物小传到后端
api.vector.updateStoryOutline(11, {
  resourceName: '人物小传',
  resourceContent: JSON.stringify({ characterBios: analysisResult.characterBios }),
  ...
});

// 同步人物关系到后端
api.vector.updateStoryOutline(12, {
  resourceName: '人物关系',
  resourceContent: JSON.stringify({ relationships: analysisResult.relationships }),
  ...
});

// 同步故事大纲到后端
api.vector.updateStoryOutline(13, {
  resourceName: '故事大纲',
  resourceContent: JSON.stringify({ storyOutline: analysisResult.storyOutline }),
  ...
});
```

---

### 2.4 剧集分集

| 项目 | 实现方式 | 数据存储 |
|------|---------|---------|
| **aigc-coop-fronted** | 本地分割 `splitScriptIntoEpisodes()` | `episodeScriptApi.create()` |
| **huanu-workbench** | 本地分割 + 后端存储 | `api.vector.createEpisodeScript()` |

**aigc-coop-fronted**:
```ts
const handleSplitEpisodes = async () => {
  const splitEpisodes = splitScriptIntoEpisodes(scriptContent);
  const resultData: SplitResult = {
    episodes: splitEpisodes,
    totalEpisodes: splitEpisodes.length,
    originalContent: scriptContent
  };
  await episodeScriptApi.create(name, resultData, currentProjectId);
  await loadEpisodes(currentProjectId);
};
```

**结论**: 两者实现类似，huanu-workbench 功能更完整

---

### 2.5 分集浏览

| 项目 | 功能 |
|------|------|
| **aigc-coop-fronted** | ✅ 下拉选择分集，显示剧本内容 |
| **huanu-workbench** | ✅ 下拉选择，加载分集数据 + 分镜数据 |

**aigc-coop-fronted**:
- 从 `useEpisodeStore` 获取分集列表
- 监听 store 变化实现与 StoryboardNode 同步

**huanu-workbench**:
```ts
// 加载分集数据
loadEpisodeData(selectedEpisodeId)
//   ├── getStoryboardScriptList() - 获取分镜
//   ├── getEpisodeScript() - 获取剧本
//   └── parseStoryboardScript() - 解析分镜脚本
```

---

### 2.6 分镜生成 (AI)

| 项目 | 实现位置 | 功能 |
|------|---------|------|
| **aigc-coop-fronted** | StoryboardNode 画布节点 | ✅ AI 生成分镜 |
| **huanu-workbench** | StoryboardActionBar | ✅ 完整实现 |

**aigc-coop-fronted (StoryboardNode)**:
```ts
const handleGenerate = async () => {
  const response = await vectorApi.chatCompletion({
    messages: [{ role: 'user', content: episode.content }],
    type: 3, // 转分镜
  });
  // 解析并保存
  const parsed = parseStoryboardScript(response.data);
  updateData('shotGroups', parsed);
  await saveStoryboard(episodeId, content);
};
```

**huanu-workbench**:
```ts
const handleToStoryboard = async (scriptContent: string, type: string) => {
  // 调用 AI 转分镜
  const result = await api.vector.convertToStoryboard(scriptContent, currentProjectId);
  // 解析结果
  const shotGroups = parseStoryboardScript(result);
  // 保存到后端
  await handleSaveShotGroups();
};
```

---

### 2.7 分镜编辑

| 项目 | 实现 |
|------|------|
| **aigc-coop-fronted** | ❌ 无独立的分镜编辑器 |
| **huanu-workbench** | ✅ ShotEditorPanel 完整实现 |

**huanu-workbench ShotEditorPanel 功能**:
- 场景/镜头组管理 (增删改)
- 帧编辑 (景别、时长、描述)
- 视觉风格配置
- 批量保存到后端

---

## 3. 数据流对比

### aigc-coop-fronted

```
剧本上传 → 剧本分析/资产提取 (API) → 结果未处理
         → 剧集分集 → 存储到后端
         
分集选择 → 加载剧本内容 (从 episodeStore)
         → StoryboardNode 选择分集 → 同步到 ScriptPanel

StoryboardNode → AI生成分镜 → 保存分镜到后端
```

### huanu-workbench

```
首次加载 → loadStoryData() → 加载所有后端数据
         →人物小传/关系/大纲/资产/分集列表

剧本上传 → handleScriptUpload() → 本地读取

AI分析 → extractAssets/analyzeScript → 解析结果
       → syncAssetsToBackend() → 创建图片资源
       → syncStoryOutlineToBackend() → 保存分析结果

选择分集 → loadEpisodeData() → 加载剧本+分镜
        → 显示在 ShotEditorPanel

分镜编辑 → handleSaveShotGroups() → 保存到后端
```

---

## 4. 代码结构对比

### aigc-coop-fronted

```
src/components/leftPanel/script/
├── ScriptPanel.tsx       # 剧本侧边栏 (主组件)
└── scriptUtils.ts        # 剧本工具函数

src/stores/
└── episodeStore.ts       # 分集状态管理 (Zustand)

src/components/nodes/
└── StoryboardNode.tsx   # 画布上的智能分镜节点

src/api/
├── scriptApi.ts          # 剧本 API
└── episodeScriptApi.ts   # 分集脚本 API
```

### huanu-workbench

```
components/Storyboard/
├── index.tsx                    # 主入口
├── LeftPanel.tsx               # 左侧面板
├── LeftBottomPanel.tsx         # 底部左侧面板
├── ShotEditorPanel.tsx         # 分镜编辑器
├── Storyboard.api.ts           # 故事板 API
├── useStoryboardState.ts       # 状态管理
├── useStoryboardData.ts        # 数据加载
├── useStoryboardHandlers.ts    # 事件处理
└── Storyboard.types.ts         # 类型定义

src/services/api/
├── vectorApiWrapper.ts         # 向量引擎 API
└── imageApi.ts                 # 图片资源 API

stores/storyboard/
└── storyboardStore.ts          # 状态管理
```

---

## 5. API 对比

| 功能 | aigc-coop-fronted | huanu-workbench |
|------|-------------------|-----------------|
| 资产提取 | `scriptApi.analyze(options.extractAssets)` | `api.vector.extractAssets(file, projectId)` |
| 剧本分析 | `scriptApi.analyze(options.generateOutline)` | `api.vector.analyzeScript(file, projectId)` |
| 分集创建 | `episodeScriptApi.create()` | `api.vector.createEpisodeScript()` |
| 分集列表 | `episodeScriptApi.getList()` | `api.vector.getEpisodeScriptList()` |
| 分镜创建 | ❌ | `api.vector.createStoryboardScript()` |
| 分镜更新 | ❌ | `api.vector.updateStoryboardScript()` |
| 分镜列表 | `storyboardScriptApi.getAll()` | `api.vector.getStoryboardScriptList()` |
| 大纲保存 | ❌ | `api.vector.updateStoryOutline()` |
| 图片资源 | ❌ | `api.resource.createImage()` |

---

## 6. 结论与建议

### aigc-coop-fronted 现状
- ✅ 基础框架搭建完成
- ✅ 剧本上传、分集功能可用
- ⚠️ 剧本分析、资产提取仅调用 API，未处理结果
- ❌ 缺少分镜编辑器

### huanu-workbench 优点
- ✅ 完整的数据流 (加载→分析→存储)
- ✅ 完善的分镜编辑器 (ShotEditorPanel)
- ✅ 丰富的状态管理
- ✅ 错误处理、进度展示

### 建议迁移/参考
1. **采用 huanu-workbench 的 API 调用模式** - 完整实现从调用到存储的流程
2. **参考 shotGroups 数据结构** - aigc-coop-fronted 可复用
3. **考虑添加分镜编辑器** - 或与 StoryboardNode 集成
4. **同步资产到后端** - 参考 `syncAssetsToBackend()` 实现
