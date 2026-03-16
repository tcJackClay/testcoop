// src/components/leftPanel/script/ScriptPanel.tsx - 脚本面板
import { useEffect } from 'react';
import { Upload, Loader2, X, ChevronDown, Sparkles, Package, Users, Network, BookOpen, ScrollText, File, Check, Wand2, ListOrdered, FileText } from 'lucide-react';
import { useProjectStore } from '../../../stores';
import { useScriptPanel } from './hooks';

interface ScriptPanelProps {
  onClose?: () => void;
}

// 操作选项 - 带图标
const actionOptions = [
  { key: 'extractAssets', label: '提取资产', icon: Package, desc: '提取角色、场景、道具' },
  { key: 'analyzeScript', label: '剧本分析', icon: Wand2, desc: '生成大纲、人物小传' },
  { key: 'splitEpisodes', label: '剧集分集', icon: ListOrdered, desc: '智能分集、剧情概要' },
  { key: 'splitScenes', label: '拆分为多场景', icon: FileText, desc: '将剧本拆分为多个场景' },
  { key: 'generateShots', label: '生成AI分镜', icon: BookOpen, desc: '生成详细的AI分镜描述' },
  { key: 'transformScript', label: '格式转换', icon: ScrollText, desc: '转换为其他格式' },
];

// 5个选项卡：资产、人物、关系、大纲、剧本
const resultTabs = [
  { key: 'assets', label: '资产', icon: Package },
  { key: 'bios', label: '人物', icon: Users },
  { key: 'relationships', label: '关系', icon: Network },
  { key: 'outline', label: '大纲', icon: BookOpen },
  { key: 'script', label: '剧本', icon: ScrollText },
];

export default function ScriptPanel({ onClose }: ScriptPanelProps) {
  const { currentProjectId } = useProjectStore();
  
  const {
    episodes,
    currentEpisode,
    localSelectedEpisodeId,
    setLocalSelectedEpisodeId,
    scriptFile,
    scriptContent,
    setScriptContent,
    isAnalyzing,
    analysisProgress,
    currentAnalysisStep,
    analysisError,
    selectedAction,
    setSelectedAction,
    activeResultTab,
    setActiveResultTab,
    showActionDropdown,
    setShowActionDropdown,
    analysisResult,
    backendAssets,
    loadEpisodes,
    loadEpisodeScript,
    handleFileUpload,
    handleAnalyze,
    clearResult,
  } = useScriptPanel({ onClose });

  // 加载选中的分集剧本
  useEffect(() => {
    if (localSelectedEpisodeId) {
      loadEpisodeScript(parseInt(localSelectedEpisodeId));
    }
  }, [localSelectedEpisodeId, loadEpisodeScript]);

  const selectedOption = actionOptions.find(o => o.key === selectedAction);

  // 渲染Tab内容
  const renderTabContent = () => {
    // 资产Tab - 优先显示后端资产
    if (activeResultTab === 'assets') {
      const assetsToShow = backendAssets || analysisResult?.assets;
      
      if (assetsToShow) {
        const { characters = [], scenes = [], props = [] } = assetsToShow as any;
        
        // 分离主要和次要
        const primaryChars = characters.filter((c: any) => !c.type?.includes('secondary'));
        const secondaryChars = characters.filter((c: any) => c.type?.includes('secondary'));
        const primaryScenes = scenes.filter((s: any) => !s.type?.includes('secondary'));
        const secondaryScenes = scenes.filter((s: any) => s.type?.includes('secondary'));
        const primaryProps = props.filter((p: any) => !p.type?.includes('secondary'));
        const secondaryProps = props.filter((p: any) => p.type?.includes('secondary'));
        
        const hasAssets = primaryChars.length + secondaryChars.length + 
                        primaryScenes.length + secondaryScenes.length + 
                        primaryProps.length + secondaryProps.length > 0;
        
        if (!hasAssets) {
          return <div className="text-gray-500 text-xs text-center py-4">上传剧本后提取资产</div>;
        }
        
        return (
          <div className="space-y-3 text-[10px] max-h-96 overflow-y-auto">
            {/* 主要角色 */}
            {primaryChars.length > 0 && (
              <div>
                <div className="text-blue-400 font-medium mb-1">主要角色 ({primaryChars.length})</div>
                <div className="space-y-1 pl-2">
                  {primaryChars.map((char: any, i: number) => (
                    <div key={`primary-${i}`} className="bg-gray-800 p-2 rounded">
                      <div className="text-gray-200 font-medium">{char.name}</div>
                      {char.description && (
                        <div className="text-gray-500 text-[9px] mt-1">{char.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 次要角色 */}
            {secondaryChars.length > 0 && (
              <div>
                <div className="text-blue-300 font-medium mb-1">次要角色 ({secondaryChars.length})</div>
                <div className="space-y-1 pl-2">
                  {secondaryChars.map((char: any, i: number) => (
                    <div key={`secondary-${i}`} className="bg-gray-800 p-2 rounded opacity-70">
                      <div className="text-gray-300 font-medium">{char.name}</div>
                      {char.description && (
                        <div className="text-gray-500 text-[9px] mt-1">{char.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 主要场景 */}
            {primaryScenes.length > 0 && (
              <div>
                <div className="text-green-400 font-medium mb-1">主要场景 ({primaryScenes.length})</div>
                <div className="space-y-1 pl-2">
                  {primaryScenes.map((scene: any, i: number) => (
                    <div key={`scene-${i}`} className="bg-gray-800 p-2 rounded">
                      <div className="text-gray-200 font-medium">{scene.name}</div>
                      {scene.description && (
                        <div className="text-gray-500 text-[9px] mt-1">{scene.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 次要场景 */}
            {secondaryScenes.length > 0 && (
              <div>
                <div className="text-green-300 font-medium mb-1">次要场景 ({secondaryScenes.length})</div>
                <div className="space-y-1 pl-2">
                  {secondaryScenes.map((scene: any, i: number) => (
                    <div key={`sec-scene-${i}`} className="bg-gray-800 p-2 rounded opacity-70">
                      <div className="text-gray-300 font-medium">{scene.name}</div>
                      {scene.description && (
                        <div className="text-gray-500 text-[9px] mt-1">{scene.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 道具 */}
            {(primaryProps.length + secondaryProps.length) > 0 && (
              <div>
                <div className="text-yellow-400 font-medium mb-1">道具 ({(primaryProps as any[]).length + (secondaryProps as any[]).length})</div>
                <div className="space-y-1 pl-2">
                  {[...primaryProps, ...secondaryProps].map((prop: any, i: number) => (
                    <div key={`prop-${i}`} className={`bg-gray-800 p-2 rounded ${prop.type?.includes('secondary') ? 'opacity-70' : ''}`}>
                      <div className="text-gray-200 font-medium">{prop.name}</div>
                      {prop.description && (
                        <div className="text-gray-500 text-[9px] mt-1">{prop.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
      
      return <div className="text-gray-500 text-xs text-center py-4">上传剧本后提取资产</div>;
    }
    
    // 人物Tab
    if (activeResultTab === 'bios' && analysisResult?.characterBios) {
      return (
        <div className="space-y-2 text-[10px] max-h-80 overflow-y-auto">
          {analysisResult.characterBios.map((bio, i) => (
            <div key={i} className="bg-gray-800 p-2 rounded">
              <div className="text-blue-300 font-medium">{bio.name}</div>
              {bio.age && <div className="text-gray-500">年龄: {bio.age}</div>}
              {bio.background && <div className="text-gray-400 mt-1">{bio.background}</div>}
              {bio.role && <div className="text-gray-500">角色: {bio.role}</div>}
            </div>
          ))}
          {analysisResult.characterBios.length === 0 && (
            <div className="text-gray-500 text-center py-4">未提取到人物小传</div>
          )}
        </div>
      );
    }
    
    // 关系Tab
    if (activeResultTab === 'relationships' && analysisResult?.relationships) {
      return (
        <div className="space-y-2 text-[10px] max-h-80 overflow-y-auto">
          {analysisResult.relationships.map((rel, i) => (
            <div key={i} className="bg-gray-800 p-2 rounded">
              <div className="text-blue-300">{rel.from}</div>
              <div className="text-gray-500 text-center text-[8px]">— {rel.type} —</div>
              <div className="text-green-300">{rel.to}</div>
              {rel.description && <div className="text-gray-400 mt-1">{rel.description}</div>}
            </div>
          ))}
          {analysisResult.relationships.length === 0 && (
            <div className="text-gray-500 text-center py-4">未提取到人物关系</div>
          )}
        </div>
      );
    }
    
    // 大纲Tab
    if (activeResultTab === 'outline' && analysisResult?.storyOutline) {
      const { storyOutline } = analysisResult;
      return (
        <div className="space-y-2 text-[10px] max-h-80 overflow-y-auto">
          {storyOutline.title && (
            <div className="text-lg text-blue-300 font-medium">{storyOutline.title}</div>
          )}
          {storyOutline.genre && (
            <div className="text-gray-500">类型: {storyOutline.genre}</div>
          )}
          {storyOutline.summary && (
            <div className="text-gray-300 mt-2">{storyOutline.summary}</div>
          )}
          {storyOutline.chapters && storyOutline.chapters.length > 0 && (
            <div className="mt-2">
              <div className="text-gray-400 font-medium">章节:</div>
              {storyOutline.chapters.map((ch, i) => (
                <div key={i} className="text-gray-300 pl-2">{ch}</div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    // 剧本Tab - 显示分集剧本
    if (activeResultTab === 'script') {
      if (episodes.length > 0) {
        return (
          <div className="space-y-2">
            <select
              value={localSelectedEpisodeId || ''}
              onChange={(e) => setLocalSelectedEpisodeId(e.target.value)}
              className="w-full px-2 py-1.5 text-[10px] bg-gray-800 border border-gray-600 rounded text-gray-300 focus:outline-none focus:border-blue-500"
            >
              {episodes.map((ep) => (
                <option key={ep.id} value={ep.id}>{ep.name || `第${ep.order}集`}</option>
              ))}
            </select>
            <pre className="text-[9px] text-gray-400 whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">
              {currentEpisode?.content || '暂无内容'}
            </pre>
            <div className="px-1 flex items-center gap-3 text-[8px] text-gray-500">
              <span>共 {episodes.length} 集</span>
              <span>{currentEpisode?.content?.length || 0} 字</span>
            </div>
          </div>
        );
      }
      
      return (
        <div className="text-[10px] text-gray-500 text-center py-4">
          {scriptFile ? '点击"开始分析"生成分集剧本' : '上传剧本文件后进行分集'}
        </div>
      );
    }
    
    return <div className="text-gray-500 text-xs text-center py-4">暂无内容</div>;
  };

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-blue-400" />
          <span className="text-xs font-medium">剧本管理</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-700 transition-colors">
          <X size={12} />
        </button>
      </div>

      {/* 标签页 */}
      <div className="border-b border-gray-700 shrink-0">
        <div className="flex">
          {resultTabs.slice(0, 3).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveResultTab(tab.key as any)}
              className={`flex-1 py-1.5 text-[9px] flex items-center justify-center gap-1 transition-colors ${
                activeResultTab === tab.key
                  ? 'bg-blue-500/20 text-blue-300 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <tab.icon size={10} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="flex">
          {resultTabs.slice(3).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveResultTab(tab.key as any)}
              className={`flex-1 py-1.5 text-[9px] flex items-center justify-center gap-1 transition-colors ${
                activeResultTab === tab.key
                  ? 'bg-blue-500/20 text-blue-300 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <tab.icon size={10} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 进度条 */}
      {isAnalyzing && (
        <div className="px-3 py-1 bg-gray-800 shrink-0">
          <div className="text-[8px] text-gray-400 mb-1">{currentAnalysisStep}</div>
          <div className="h-1 bg-gray-700 rounded overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {analysisError && (
        <div className="px-3 py-2 bg-red-900/30 border-b border-red-700 shrink-0">
          <div className="text-[10px] text-red-400">{analysisError}</div>
        </div>
      )}

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-2">
        {renderTabContent()}
      </div>

      {/* 底部操作区 */}
      <div className="p-2 border-t border-gray-700 space-y-2 shrink-0">
        {/* 操作选择 */}
        <div className="relative">
          <button
            onClick={() => setShowActionDropdown(!showActionDropdown)}
            className="w-full p-2 rounded-lg border border-gray-600 bg-gray-800/50 flex items-center gap-2 text-left hover:border-gray-500 transition-colors"
          >
            <div className="p-1 rounded bg-gray-700 text-gray-400">
              {selectedOption && <selectedOption.icon size={12} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-gray-300">{selectedOption?.label}</div>
              <div className="text-[8px] text-gray-500 truncate">{selectedOption?.desc}</div>
            </div>
            <ChevronDown size={12} className={`text-gray-500 transition-transform ${showActionDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showActionDropdown && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 overflow-hidden">
              {actionOptions.map(option => (
                <button
                  key={option.key}
                  onClick={() => {
                    setSelectedAction(option.key as any);
                    setShowActionDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-[10px] text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                >
                  {selectedAction === option.key && <Check size={10} className="text-blue-400" />}
                  <option.icon size={12} className={selectedAction === option.key ? 'text-blue-400' : 'text-gray-500'} />
                  <span className={selectedAction === option.key ? 'text-blue-300' : ''}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 文件上传 */}
        <div className={`border-2 border-dashed rounded-lg p-2 text-center transition-colors ${
          scriptFile ? 'border-green-500/50 bg-green-500/10' : 'border-gray-600 hover:border-blue-500/50'
        }`}>
          <input
            type="file"
            accept=".txt,.md,.json"
            onChange={handleFileUpload}
            className="hidden"
            id="script-upload-panel"
          />
          <label htmlFor="script-upload-panel" className="cursor-pointer flex flex-col items-center gap-1">
            {scriptFile ? (
              <>
                <File size={14} className="text-green-400" />
                <span className="text-[10px] text-green-300 font-medium truncate max-w-full">{scriptFile.name}</span>
              </>
            ) : (
              <>
                <Upload size={14} className="text-gray-500" />
                <span className="text-[10px] text-gray-400">上传剧本文件</span>
              </>
            )}
          </label>
        </div>

        {/* 执行按钮 */}
        <button
          onClick={handleAnalyze}
          disabled={!scriptFile || isAnalyzing}
          className="w-full py-2 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-500"
        >
          {isAnalyzing ? (
            <><Sparkles size={12} className="animate-pulse" />{analysisProgress}%</>
          ) : (
            <><Sparkles size={12} />{selectedAction === 'splitEpisodes' ? '开始分集' : '开始处理'}</>
          )}
        </button>
      </div>
    </div>
  );
}
