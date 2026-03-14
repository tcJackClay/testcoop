// src/components/nodes/StoryboardNode.tsx - 故事板节点（精简版）
import { useEffect } from 'react';
import { Plus, Trash2, Sparkles, Loader2, Save } from 'lucide-react';
import { useProjectStore, useAuthStore, useEpisodeStore } from '../../stores';
import { useStoryboardNode } from './storyboard';

interface StoryboardNodeProps {
  nodeId: string;
  data: Record<string, unknown>;
  updateData: (key: string, value: unknown) => void;
}

export default function StoryboardNode({ nodeId, data, updateData }: StoryboardNodeProps) {
  const { currentProjectId } = useProjectStore();
  const { user } = useAuthStore();
  const { episodes, loading: episodesLoading } = useEpisodeStore();
  
  // 使用 storyboard node hook
  const {
    loading,
    generating,
    saving,
    currentGroupId,
    currentShotId,
    setCurrentGroupId,
    setCurrentShotId,
    shotGroups,
    selectedEpisodeId,
    loadStoryboard,
    generateStoryboard,
    handleSave,
    addGroup,
    deleteGroup,
    addShot,
    deleteShot,
    addFrame,
    deleteFrame,
    updateFrame,
    updateShot,
    updateGroup,
  } = useStoryboardNode(nodeId, data, updateData);

  const displaySelectedId = data.selectedEpisodeId as string || '';

  // 选择分集时加载
  const handleEpisodeChange = (episodeId: string) => {
    updateData('selectedEpisodeId', episodeId);
    if (episodeId) {
      loadStoryboard(parseInt(episodeId));
    }
  };

  // 初始加载
  useEffect(() => {
    if (displaySelectedId) {
      loadStoryboard(parseInt(displaySelectedId));
    }
  }, []);

  const totalShots = shotGroups.reduce((sum, g) => sum + g.shots.length, 0);

  return (
    <div className="w-[500px] bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-700 bg-gray-750 rounded-t-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-white">智能分镜</span>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={displaySelectedId}
            onChange={(e) => handleEpisodeChange(e.target.value)}
            disabled={episodesLoading || loading || generating}
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs text-white"
          >
            <option value="">选择分集</option>
            {episodes.map(ep => (
              <option key={ep.id} value={ep.id}>{ep.name || `第${ep.order}集`}</option>
            ))}
          </select>
          
          <button
            onClick={generateStoryboard}
            disabled={!displaySelectedId || generating}
            className="flex items-center gap-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-xs text-white"
          >
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            AI生成
          </button>
          <button
            onClick={handleSave}
            disabled={!displaySelectedId || saving || shotGroups.length === 0}
            className="flex items-center gap-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-xs text-white"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            保存
          </button>
        </div>
        
        {/* Status */}
        {loading ? (
          <div className="text-xs text-blue-400 mt-1">加载中...</div>
        ) : generating ? (
          <div className="text-xs text-yellow-400 mt-1">AI 生成分镜中...</div>
        ) : saving ? (
          <div className="text-xs text-green-400 mt-1">保存中...</div>
        ) : (
          <div className="text-xs text-gray-500 mt-1">
            {displaySelectedId ? `已选择: 第${displaySelectedId}集` : '请选择分集'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ maxHeight: '480px' }}>
        {shotGroups.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-xs text-gray-500 text-center">
              {displaySelectedId ? '点击"AI生成"创建分镜' : '请先选择分集'}
            </div>
          </div>
        ) : (
          <>
            {/* Main editing area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Shot list */}
              <div className="w-20 border-r border-gray-600 overflow-y-auto bg-gray-750 p-1">
                {currentGroupId && (
                  <div className="space-y-1">
                    {(() => {
                      const group = shotGroups.find(g => g.id === currentGroupId);
                      return group?.shots.map((shot, idx) => (
                        <div
                          key={shot.id}
                          onClick={() => setCurrentShotId(shot.id)}
                          className={`p-1.5 rounded cursor-pointer text-xs ${
                            currentShotId === shot.id ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>#{idx + 1}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('删除镜头?')) deleteShot(currentGroupId, shot.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-xs opacity-70">{shot.frames?.length || 0}帧</div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>

              {/* Frame editor */}
              <div className="flex-1 overflow-y-auto p-3 bg-gray-800">
                {currentGroupId && currentShotId ? (
                  (() => {
                    const group = shotGroups.find(g => g.id === currentGroupId);
                    const shot = group?.shots.find(s => s.id === currentShotId);
                    if (!shot) return null;
                    
                    return (
                      <div className="space-y-3">
                        {/* Group & Shot info */}
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-600">
                          <input
                            type="text"
                            value={group?.name || ''}
                            onChange={(e) => updateGroup(currentGroupId, e.target.value)}
                            className="flex-1 bg-transparent border border-gray-600 rounded px-2 py-1 text-xs text-white"
                            placeholder="场景名称"
                          />
                          <input
                            type="text"
                            value={shot.cameraWork}
                            onChange={(e) => updateShot(currentGroupId, shot.id, 'cameraWork', e.target.value)}
                            className="flex-1 bg-transparent border border-gray-600 rounded px-2 py-1 text-xs text-white"
                            placeholder="运镜"
                          />
                        </div>
                        
                        {/* Frames */}
                        <div className="space-y-2">
                          <div className="text-xs text-gray-400 flex justify-between">
                            <span>帧列表</span>
                            <button onClick={() => addFrame(currentGroupId, shot.id)} className="text-blue-400">
                              <Plus className="w-3 h-3" />添加
                            </button>
                          </div>
                          
                          {shot.frames?.map((frame) => (
                            <div key={frame.id} className="bg-gray-700 rounded-lg p-2 border border-gray-600">
                              <div className="flex items-center gap-1 mb-2">
                                <span className="text-xs font-bold text-blue-400">帧{frame.frameNumber}</span>
                                <input
                                  type="text"
                                  value={frame.time}
                                  onChange={(e) => updateFrame(currentGroupId, shot.id, frame.id, 'time', e.target.value)}
                                  className="w-12 bg-gray-600 rounded px-1 text-xs text-center"
                                  placeholder="时长"
                                />
                                <input
                                  type="text"
                                  value={frame.scale}
                                  onChange={(e) => updateFrame(currentGroupId, shot.id, frame.id, 'scale', e.target.value)}
                                  className="w-16 bg-gray-600 rounded px-1 text-xs text-center"
                                  placeholder="景别"
                                />
                                <div className="flex-1" />
                                <button onClick={() => addFrame(currentGroupId, shot.id, frame.id)}>
                                  <Plus className="w-3 h-3 text-gray-400 hover:text-blue-400" />
                                </button>
                                <button onClick={() => deleteFrame(currentGroupId, shot.id, frame.id)}>
                                  <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-400" />
                                </button>
                              </div>
                              <textarea
                                value={frame.description}
                                onChange={(e) => updateFrame(currentGroupId, shot.id, frame.id, 'description', e.target.value)}
                                rows={2}
                                className="w-full bg-transparent text-xs text-white resize-none"
                                placeholder="帧描述..."
                              />
                            </div>
                          ))}
                        </div>
                        
                        {/* Prompt */}
                        <div className="pt-2 border-t border-gray-600">
                          <div className="text-xs text-gray-400 mb-1">AI Prompt</div>
                          <textarea
                            value={shot.prompt || ''}
                            onChange={(e) => updateShot(currentGroupId, shot.id, 'prompt', e.target.value)}
                            rows={2}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white resize-none"
                            placeholder="AI绘图提示词..."
                          />
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-xs text-gray-500">选择场景和镜头</div>
                  </div>
                )}
              </div>
            </div>

            {/* Scene bar */}
            <div className="h-16 border-t border-gray-600 bg-gray-750 px-2 flex items-center gap-2 overflow-x-auto">
              <span className="text-xs text-gray-400 shrink-0">场景:</span>
              {shotGroups.map((group, idx) => (
                <div
                  key={group.id}
                  onClick={() => { setCurrentGroupId(group.id); if (group.shots[0]) setCurrentShotId(group.shots[0].id); }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer text-xs shrink-0 ${
                    currentGroupId === group.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span>{group.name || `场景 ${idx + 1}`}</span>
                  <span className="text-xs opacity-70">({group.shots.length}镜)</span>
                  <button onClick={(e) => { e.stopPropagation(); if (confirm('删除场景?')) deleteGroup(group.id); }}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button onClick={addGroup} className="flex items-center gap-1 px-2 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-400 shrink-0">
                <Plus className="w-3 h-3" />添加
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-2 py-1.5 border-t border-gray-600 text-xs text-gray-500 flex justify-between">
        <span>{shotGroups.length} 场景</span>
        <span>{totalShots} 镜头</span>
      </div>
    </div>
  );
}
