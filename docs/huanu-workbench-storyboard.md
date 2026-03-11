# huanu-workbench-frontend 故事板页面功能参考

> 基于 `D:\work\Huanu\VibeCode\huanu-workbench-frontend` 项目

---

## 1. 页面入口与组件结构

### 1.1 路由入口 (App.tsx)

```tsx
const Storyboard = lazy(() => import('./components/Storyboard'));

// App.tsx
const renderModule = () => {
  switch (activeModule) {
    case 'storyboard': return <Storyboard />;
    // ...
  }
};
```

### 1.2 组件结构

```
Storyboard (主组件)
├── LeftBottomPanel     # 底部左侧面板（资产、角色、关系、大纲、剧本）
├── LeftPanel           # 左侧面板（上传、分析、分集）
├── ShotEditorPanel     # 分镜编辑器（核心区域）
├── StoryboardArrow     # 箭头连接
├── StoryboardErrorAlert # 错误提示
├── StoryboardProgress  # 分析进度
├── StoryboardActionBar # 操作栏
└── StoryboardConfirmModal # 确认弹窗
```

---

## 2. API 服务层

### 2.1 API 导出 (src/services/api/index.ts)

```ts
export const api = {
  assets: assetApi,
  script: scriptApi,
  shots: shotApi,
  llm: llmApi,
  image: imageGenApi,
  vector: vectorApi,      // 故事板主要使用 vectorApi
  auth: authApi,
  resource: imageApi,
  systemPrompt: systemPromptApi,
  storyboard: storyboardApi,
};
```

### 2.2 向量引擎 API (src/services/api/vectorApiWrapper.ts)

#### 2.2.1 资产提取 (type = 1)

```ts
// 资产提取 - type = 1
async extractAssets(file: File, projectId: number = 1): Promise<string> {
  return withRetry(
    () => this.chatCompletion({
      file,
      projectId,
      promptName: '资产提取',
      type: 1,
    }),
    { ...defaultRetryOptions, maxRetries: 3, retryDelay: 1500, timeout: 30000 }
  );
}
```

#### 2.2.2 剧本分析 (type = 2)

```ts
// 剧本分析（产出故事大纲）- type = 2
async analyzeScript(file: File, projectId: number = 1): Promise<string> {
  return withRetry(
    () => this.chatCompletion({
      file,
      projectId,
      promptName: '剧本分析',
      type: 2,
    }),
    { ...defaultRetryOptions, maxRetries: 3, retryDelay: 1500, timeout: 30000 }
  );
}
```

#### 2.2.3 转分镜 (type = 3)

```ts
// 转分镜 - type = 3
async convertToStoryboard(scriptContent: string, projectId: number = 1): Promise<string> {
  const doRequest = async () => {
    const url = `${API_BASE_URL}/vector/chat-completion`;
    const token = getAuthToken();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        prompt: scriptContent,
        type: 3
      }),
    });
    // ...
  };
  
  return withRetry(doRequest, { ...defaultRetryOptions, maxRetries: 3, retryDelay: 1500, timeout: 30000 });
}
```

### 2.3 资源管理 API

#### 2.3.1 图片资源

```ts
// 获取图片资源列表
async getImageList(projectId: number): Promise<ImageResource[]>

// 创建图片资源
async createImage(data: CreateImageRequest): Promise<ImageResource>
```

#### 2.3.2 剧本资源

```ts
// 创建剧本
async createScript(name: string, content: string, projectId: number, userId?: number): Promise<Resource>

// 获取剧本列表
async getScriptList(projectId: number): Promise<Resource[]>
```

#### 2.3.3 分集脚本

```ts
// 创建分集脚本
async createEpisodeScript(
  name: string, 
  content: object, 
  projectId: number, 
  userId?: number
): Promise<Resource>

// 获取分集脚本
async getEpisodeScript(id: number): Promise<Resource>

// 获取分集脚本列表
async getEpisodeScriptList(projectId: number): Promise<Resource[]>

// 删除分集脚本
async deleteEpisodeScript(id: number): Promise<void>
```

#### 2.3.4 分镜脚本

```ts
// 创建分镜脚本
async createStoryboardScript(
  name: string, 
  content: object, 
  projectId: number, 
  userId?: number, 
  episodeId?: number
): Promise<Resource>

// 获取分镜脚本
async getStoryboardScript(id: number): Promise<Resource>

// 获取分镜脚本列表
async getStoryboardScriptList(projectId: number): Promise<Resource[]>

// 更新分镜脚本
async updateStoryboardScript(
  id: number, 
  content: object, 
  userId?: number, 
  updatedBy?: string,
  resourceName?: string
): Promise<Resource>
```

#### 2.3.5 故事大纲

```ts
// 获取故事大纲
async getStoryOutline(id: number): Promise<any>

// 通过resourceName获取故事大纲
async getStoryOutlineByName(resourceName: string, projectId: number): Promise<any>

// 保存故事大纲
async saveStoryOutline(data: {
  resourceName: string;
  resourceContent: string;
  projectId: number;
  userId: number;
  createdBy: string;
  updatedBy: string;
}): Promise<any>

// 更新故事大纲
async updateStoryOutline(
  _id: number, 
  data: {
    resourceName: string;
    resourceContent: string;
    projectId: number;
    userId: number;
    createdBy: string;
    updatedBy: string;
  }
): Promise<any>
```

---

## 3. 核心功能与 API 调用

### 3.1 剧本上传 (handleScriptUpload)

```ts
const handleScriptUpload = useCallback(async (file: File, styleCfg: any) => {
  setScriptFile(file);
  try {
    const content = await file.text();
    setScriptContent(content);
  } catch (e) {
    console.error('读取文件内容失败:', e);
  }
}, [setScriptContent, setScriptFile]);
```

**参数**: 
- `file`: 上传的剧本文件 (File)
- `styleCfg`: 风格配置

**说明**: 仅读取文件内容到 state，不调用 API

---

### 3.2 AI 分析剧本 (handleAIAnalyze)

```ts
const handleAIAnalyze = useCallback(async (file?: File) => {
  const targetFile = file || scriptFile;
  const { extractAssets, generateOutline, generateCharacterBios, analyzeRelationships } = config;
  
  setAnalyzing(true);
  setAnalysisProgress(0);
  setCurrentAnalysisStep('正在准备分析...');
  
  try {
    let analysisResult = '';
    
    if (extractAssets) {
      setCurrentAnalysisStep('正在提取资产...');
      setAnalysisProgress(20);
      // 调用资产提取 API
      analysisResult = await api.vector.extractAssets(targetFile, currentProjectId);
    } else if (generateOutline || generateCharacterBios || analyzeRelationships) {
      setCurrentAnalysisStep('正在分析剧本大纲...');
      setAnalysisProgress(20);
      // 调用剧本分析 API
      analysisResult = await api.vector.analyzeScript(targetFile, currentProjectId);
    }
    
    // 解析结果
    let jsonStr = analysisResult;
    if (typeof jsonStr === 'string') {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/```$/, '').trim();
    }
    
    // 转换为结构化数据
    let parsedResult: ScriptAnalysisResult;
    if (isAssetExtraction) {
      parsedResult = transformAssetResponse(rawData);
    } else {
      parsedResult = transformAnalysisResponse(rawData);
    }
    
    // 同步资产到后端
    await syncAssetsToBackend(parsedResult, currentProjectId);
    
    // 同步分析结果到后端
    await syncStoryOutlineToBackend(parsedResult, currentProjectId);
    
  } finally {
    setAnalyzing(false);
  }
}, [...]);
```

**API 调用**:
```ts
// 资产提取
api.vector.extractAssets(file, projectId)

// 剧本分析
api.vector.analyzeScript(file, projectId)
```

---

### 3.3 同步资产到后端 (syncAssetsToBackend)

```ts
const syncAssetsToBackend = useCallback(async (analysisResult: ScriptAnalysisResult, projectId: number) => {
  const authState = useAuthStore.getState();
  const userId = authState.user?.id || 1;
  const username = authState.user?.username || 'system';
  
  const requests: Array<any> = [];
  
  const processAssets = (assets: any[], type: string, ext1Type: string) => {
    if (!assets) return;
    for (const item of assets) {
      // 主资产记录
      requests.push({
        resourceName: item.name || '未命名',
        resourceType: 'image',
        resourceContent: '',
        projectId,
        userId,
        ext1: JSON.stringify({ id: item.id, name: item.name, type: ext1Type }),
        createdBy: username,
        updatedBy: username,
      });
      
      // 为每个 variant 创建独立记录
      for (const variant of item.variants || []) {
        requests.push({
          resourceName: `${item.name} - ${variant}`,
          resourceType: 'image',
          projectId,
          userId,
          ext1: JSON.stringify({ name: item.name, variant, type: ext1Type }),
          createdBy: username,
          updatedBy: username,
        });
      }
    }
  };
  
  processAssets(analysisResult.assets?.characters, 'character', 'character_primary');
  processAssets(analysisResult.assets?.scenes, 'scene', 'scene_primary');
  processAssets(analysisResult.assets?.props, 'prop', 'prop_primary');
  
  // 检查已存在的资产，避免重复创建
  const existingAssets = await api.resource.getImageList(projectId);
  
  for (const request of requests) {
    const existing = existingAssets.find(
      item => item.resourceName === request.resourceName && item.ext1 === request.ext1
    );
    
    if (!existing) {
      await api.resource.createImage(request);
    }
  }
}, []);
```

**API 调用**:
```ts
// 获取已有资产列表
api.resource.getImageList(projectId)

// 创建图片资源
api.resource.createImage(request)
```

---

### 3.4 同步故事大纲到后端 (syncStoryOutlineToBackend)

```ts
const syncStoryOutlineToBackend = useCallback(async (analysisResult: ScriptAnalysisResult, projectId: number) => {
  const authState = useAuthStore.getState();
  const userId = authState.user?.id || 1;
  const username = authState.user?.username || 'system';
  
  const promises = [];
  
  // 人物小传
  if (analysisResult.characterBios?.length > 0) {
    promises.push(
      api.vector.updateStoryOutline(11, {
        resourceName: '人物小传',
        resourceContent: JSON.stringify({ characterBios: analysisResult.characterBios }),
        projectId,
        userId,
        createdBy: username,
        updatedBy: username,
      })
    );
  }
  
  // 人物关系
  if (analysisResult.relationships?.length > 0) {
    promises.push(
      api.vector.updateStoryOutline(12, {
        resourceName: '人物关系',
        resourceContent: JSON.stringify({ relationships: analysisResult.relationships }),
        projectId,
        userId,
        createdBy: username,
        updatedBy: username,
      })
    );
  }
  
  // 故事大纲
  if (analysisResult.storyOutline) {
    promises.push(
      api.vector.updateStoryOutline(13, {
        resourceName: '故事大纲',
        resourceContent: JSON.stringify({ storyOutline: analysisResult.storyOutline }),
        projectId,
        userId,
        createdBy: username,
        updatedBy: username,
      })
    );
  }
  
  await Promise.all(promises);
}, []);
```

**API 调用**:
```ts
// 更新故事大纲（人物小传、人物关系、故事大纲）
api.vector.updateStoryOutline(id, data)
```

---

### 3.5 保存分镜脚本 (handleSaveShotGroups)

```ts
const handleSaveShotGroups = useCallback(async () => {
  if (!selectedEpisodeId) return;
  
  const authState = useAuthStore.getState();
  const userId = authState.user?.id || 1;
  const username = authState.user?.username || 'admin';
  
  // 构造分镜脚本内容
  let scriptContent = '';
  
  if (sceneOverview) {
    scriptContent += `【场次概述】${sceneOverview}\n`;
  }
  
  shotGroups.forEach((group) => {
    scriptContent += `#【Shot ${group.groupNumber}】`;
    group.frames.forEach((frame) => {
      scriptContent += `【Frame ${frame.duration}】【${frame.scale}】${frame.description}`;
    });
    scriptContent += '\n';
  });
  
  // 查找已存在的分镜脚本
  const storyboardList = await api.vector.getStoryboardScriptList(currentProjectId);
  const matchingScript = storyboardList.find((sb: any) => 
    sb.ext1 && String(sb.ext1) === String(selectedEpisodeId)
  );
  
  if (matchingScript) {
    // 更新
    await api.vector.updateStoryboardScript(
      matchingScript.id, 
      { content: scriptContent },
      userId,
      username,
      matchingScript.resourceName
    );
  } else {
    // 创建新的
    const episodeInfo = episodeList.find(ep => String(ep.id) === String(selectedEpisodeId));
    const resourceName = episodeInfo?.resourceName || `第${selectedEpisodeId}集分镜`;
    await api.vector.createStoryboardScript(
      resourceName,
      { content: scriptContent },
      currentProjectId,
      userId,
      String(selectedEpisodeId)
    );
  }
}, [...]);
```

**API 调用**:
```ts
// 获取分镜脚本列表
api.vector.getStoryboardScriptList(projectId)

// 创建分镜脚本
api.vector.createStoryboardScript(name, content, projectId, userId, episodeId)

// 更新分镜脚本
api.vector.updateStoryboardScript(id, content, userId, updatedBy, resourceName)
```

---

### 3.6 加载后端数据 (loadStoryData)

```ts
export const loadStoryData = async (
  currentProjectId: number,
  forceRefresh: boolean = false
): Promise<{
  characterBios: any[];
  relationships: any[];
  outline: any;
  backendAssets: ExtendedAssets;
  episodeList: EpisodeInfo[];
}> => {
  // 并行加载多个数据
  const [biosRes, relsRes, outlineRes, assetsRes, imageRes] = await Promise.allSettled([
    // 人物小传
    api.vector.getStoryOutlineByName('人物小传', currentProjectId),
    // 人物关系
    api.vector.getStoryOutlineByName('人物关系', currentProjectId),
    // 故事大纲
    api.vector.getStoryOutlineByName('故事大纲', currentProjectId),
    // 图片资源列表
    api.resource.getImageList(currentProjectId),
    // 分集剧本列表
    api.vector.getEpisodeScriptList(currentProjectId),
  ]);
  
  // 处理返回数据...
  return { characterBios, relationships, outline, backendAssets, episodeList };
};
```

**API 调用**:
```ts
// 获取故事大纲（按名称）
api.vector.getStoryOutlineByName(resourceName, projectId)

// 获取图片资源列表
api.resource.getImageList(projectId)

// 获取分集剧本列表
api.vector.getEpisodeScriptList(projectId)
```

---

### 3.7 加载分集数据 (loadEpisodeData)

```ts
export const loadEpisodeData = async (
  currentProjectId: number,
  episodeId: string,
  episodeList: EpisodeInfo[]
): Promise<{
  scriptContent: string;
  storyboardScript: string;
  sceneOverview: string;
  shotGroups: any[];
}> => {
  // 获取分镜脚本
  const storyboardList = await api.vector.getStoryboardScriptList(currentProjectId);
  const matchingScript = storyboardList.find((sb: any) => 
    sb.ext1 && String(sb.ext1) === String(episodeId)
  );
  
  if (matchingScript?.resourceContent) {
    const sbContentObj = JSON.parse(matchingScript.resourceContent);
    storyboardScript = sbContentObj.content;
    // 解析分镜脚本
    shotGroups = parseStoryboardScript(storyboardScript);
  }
  
  // 获取分集剧本
  const episodeData = await api.vector.getEpisodeScript(parseInt(episodeId));
  if (episodeData?.resourceContent) {
    const contentObj = JSON.parse(episodeData.resourceContent);
    scriptContent = contentObj.content;
  }
  
  return { scriptContent, storyboardScript, sceneOverview, shotGroups };
};
```

**API 调用**:
```ts
// 获取分镜脚本列表
api.vector.getStoryboardScriptList(projectId)

// 获取分集剧本
api.vector.getEpisodeScript(id)
```

---

## 4. 状态管理

### 4.1 Store 结构

```ts
interface StoryboardState {
  // 分镜数据
  shotGroups: ShotGroup[];
  selectedGroupId: string | null;
  selectedFrameId: string | null;
  
  // 分析结果
  scriptContent: string;
  rawAssetText: string;
  analysisResult: ScriptAnalysisResult | null;
  isAnalyzing: boolean;
  analysisProgress: number;
  currentAnalysisStep: string;
  analysisError: string | null;
  
  // 分集相关
  selectedEpisodeId: string | null;
  episodeList: EpisodeInfo[];
  selectedEpisodeContent: string;
  storyboardScriptContent: string;
}

interface StoryboardActions {
  // 选择
  selectGroup: (groupId: string) => void;
  selectFrame: (groupId: string, frameId: string) => void;
  
  // 更新
  updateShotGroup: (groupId: string, updates: Partial<ShotGroup>) => void;
  updateFrame: (groupId: string, frameId: string, updates: Partial<Frame>) => void;
  
  // 添加/删除
  addShotGroup: (group: ShotGroup) => void;
  deleteShotGroup: (groupId: string) => void;
  addFrame: (groupId: string, frame: Frame) => void;
  deleteFrame: (groupId: string, frameId: string) => void;
  
  // 状态设置
  setScriptContent: (content: string) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setAnalysisProgress: (progress: number) => void;
  // ...
}
```

---

## 5. 数据结构

### 5.1 分镜组 (ShotGroup)

```ts
interface ShotGroup {
  id: string;
  groupNumber: string;        // "01", "02"...
  cameraWork: string;         // 镜头运动
  description: string;        // 描述
  frames: Frame[];           // 帧列表
  order: number;             // 排序
}
```

### 5.2 帧 (Frame)

```ts
interface Frame {
  id: string;
  frameNumber: string;       // "001", "002"...
  scale: string;            // 景别: "中景", "近景"...
  description: string;       // 描述
  duration: string;          // 时长: "3s", "5s"...
  order: number;             // 排序
}
```

### 5.3 资源 (Resource)

```ts
interface Resource {
  id: number;
  resourceName: string;
  resourceContent?: string;
  resourceStatus?: string;
  projectId: number;
  resourceType?: string;
  userId?: number;
  createdBy?: string | number;
  updatedBy?: string | number;
  createdTime?: string;
  updatedTime?: string;
  ext1?: string;            // 扩展字段（用于关联分集ID等）
  ext2?: string;
}
```

---

## 6. API 端点汇总

| 功能 | API 方法 | 端点 |
|------|----------|------|
| 资产提取 | `api.vector.extractAssets(file, projectId)` | POST `/vector/chat-completion-file` |
| 剧本分析 | `api.vector.analyzeScript(file, projectId)` | POST `/vector/chat-completion-file` |
| 转分镜 | `api.vector.convertToStoryboard(content, projectId)` | POST `/vector/chat-completion` |
| 获取图片列表 | `api.resource.getImageList(projectId)` | GET `/image/list` |
| 创建图片 | `api.resource.createImage(data)` | POST `/image` |
| 创建剧本 | `api.vector.createScript(name, content, projectId)` | POST `/script` |
| 获取剧本列表 | `api.vector.getScriptList(projectId)` | GET `/script/list` |
| 创建分集脚本 | `api.vector.createEpisodeScript(name, content, projectId)` | POST `/episode-script` |
| 获取分集脚本 | `api.vector.getEpisodeScript(id)` | GET `/episode-script/{id}` |
| 获取分集脚本列表 | `api.vector.getEpisodeScriptList(projectId)` | GET `/episode-script/list` |
| 创建分镜脚本 | `api.vector.createStoryboardScript(name, content, projectId, userId, episodeId)` | POST `/storyboard-script` |
| 获取分镜脚本列表 | `api.vector.getStoryboardScriptList(projectId)` | GET `/storyboard-script/list` |
| 更新分镜脚本 | `api.vector.updateStoryboardScript(id, content, userId, updatedBy, name)` | PUT `/storyboard-script/{id}` |
| 获取故事大纲 | `api.vector.getStoryOutline(id)` | GET `/story-outline/{id}` |
| 按名称获取大纲 | `api.vector.getStoryOutlineByName(name, projectId)` | GET `/story-outline/list` |
| 更新故事大纲 | `api.vector.updateStoryOutline(id, data)` | PUT `/story-outline/{id}` |

---

## 7. 核心流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                        故事板页面流程                              │
└─────────────────────────────────────────────────────────────────┘

1. 首次加载
   ┌──────────────┐
   │ 加载后端数据  │ ──→ loadStoryData()
   │ (人物/关系/  │     ├── getStoryOutlineByName('人物小传')
   │  大纲/资产/  │     ├── getStoryOutlineByName('人物关系')
   │  分集列表)   │     ├── getStoryOutlineByName('故事大纲')
   └──────────────┘     ├── getImageList()
                        └── getEpisodeScriptList()

2. 上传剧本
   ┌──────────────┐
   │  文件上传    │ ──→ handleScriptUpload(file)
   │  (本地读取)  │     └── File.text() → setScriptContent
   └──────────────┘

3. AI 分析
   ┌──────────────┐
   │  AI 提取/   │ ──→ handleAIAnalyze()
   │  分析剧本    │     ├── extractAssets() 或 analyzeScript()
   │              │     ├── transformAssetResponse() / transformAnalysisResponse()
   └──────────────┘     ├── syncAssetsToBackend()
                            └── createImage() / getImageList()
                        └── syncStoryOutlineToBackend()
                            └── updateStoryOutline()

4. 选择分集
   ┌──────────────┐
   │  切换分集    │ ──→ handleEpisodeChange(episodeId)
   │              │     └── loadEpisodeData(episodeId)
   └──────────────┘           ├── getStoryboardScriptList()
                              ├── getEpisodeScript()
                              └── parseStoryboardScript()

5. 保存分镜
   ┌──────────────┐
   │  保存到后端  │ ──→ handleSaveShotGroups()
   │              │     ├── getStoryboardScriptList()
   └──────────────┘     └── createStoryboardScript() 或 updateStoryboardScript()
```
