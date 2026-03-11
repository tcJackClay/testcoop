import { useState, useEffect } from 'react';
import { Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { episodeScriptApi, storyboardScriptApi, vectorApi } from '../../api';
import { useProjectStore } from '../../stores/projectStore';

interface Shot {
  id: string;
  index: number;
  shotNumber: number;
  description: string;
  prompt?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

interface ShotGroup {
  id: string;
  name: string;
  shots: Shot[];
}

interface EpisodeScript {
  id: number;
  name: string;
  content: string;
  episodeNumber: number;
}

interface StoryboardScript {
  id: number;
  name: string;
  content: string;
}

interface StoryboardNodeProps {
  nodeId: string;
  data: Record<string, unknown>;
  updateData: (key: string, value: unknown) => void;
}

export default function StoryboardNode({ nodeId, data, updateData }: StoryboardNodeProps) {
  const { currentProjectId } = useProjectStore();
  
  const episodes = (data.episodes as EpisodeScript[]) || [];
  const selectedEpisodeId = (data.selectedEpisodeId as string) || '';
  const shotGroups = (data.shotGroups as ShotGroup[]) || [];
  const storyboardContent = (data.storyboardContent as string) || '';
  const isGenerating = (data.isGenerating as boolean) || false;
  const existingStoryboard = (data.existingStoryboard as StoryboardScript) || null;

  const [localEpisodes, setLocalEpisodes] = useState<EpisodeScript[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [localGenerating, setLocalGenerating] = useState(false);


  // 加载已有分镜
  const loadExistingStoryboard = async (episodeId: number) => {
    if (!currentProjectId) return;
    
    try {
      const response = await storyboardScriptApi.getAll(undefined, currentProjectId);
      if (response.code === 0 && response.data) {
        // 查找关联当前分集的的分镜
        const matched = response.data.find((sb: StoryboardScript) => 
          sb.name.includes(`第${episodeId}集`) || sb.name.includes(`集${episodeId}`)
        );
        if (matched) {
          updateData('existingStoryboard', matched);
          updateData('storyboardContent', matched.content);
          // 解析内容到 shotGroups
          const parsed = parseStoryboardScript(matched.content);
          updateData('shotGroups', parsed);
        }
      }
    } catch (error) {
      console.error('加载分镜失败:', error);
    }
  };

  // 选择分集时加载已有分镜
  const handleEpisodeChange = (episodeId: string) => {
    updateData('selectedEpisodeId', episodeId);
    if (episodeId) {
      loadExistingStoryboard(parseInt(episodeId));
    }
  };

  // AI 生成分镜
  const handleGenerate = async () => {
    if (!selectedEpisodeId || !currentProjectId) return;
    
    const episode = localEpisodes.find(ep => ep.id === parseInt(selectedEpisodeId));
    if (!episode?.content) {
      console.error('分集内容为空');
      return;
    }

    setLocalGenerating(true);
    updateData('isGenerating', true);
    
    try {
      const response = await vectorApi.chatCompletion({
        messages: [{ role: 'user', content: episode.content }],
        type: 3, // 转分镜
      });
      
      if (response.code === 0 && response.data) {
        const content = response.data;
        updateData('storyboardContent', content);
        
        // 解析 AI 返回的分镜内容
        const parsed = parseStoryboardScript(content);
        updateData('shotGroups', parsed);
        
        // 保存到后端
        await saveStoryboard(parseInt(selectedEpisodeId), content);
      }
    } catch (error) {
      console.error('AI 生成分镜失败:', error);
    } finally {
      setLocalGenerating(false);
      updateData('isGenerating', false);
    }
  };

  // 保存分镜到后端
  const saveStoryboard = async (episodeId: number, content: string) => {
    if (!currentProjectId) return;
    
    try {
      if (existingStoryboard) {
        // 更新
        await storyboardScriptApi.update(existingStoryboard.id, { content });
      } else {
        // 创建
        await storyboardScriptApi.create({
          name: `第${episodeId}集分镜`,
          content,
          projectId: currentProjectId,
        });
      }
    } catch (error) {
      console.error('保存分镜失败:', error);
    }
  };

  // 解析分镜脚本为 shotGroups
  const parseStoryboardScript = (content: string): ShotGroup[] => {
    if (!content) return [];
    
    try {
      // 尝试解析 JSON 格式
      if (content.startsWith('{') || content.startsWith('[')) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          return parsed.map((group: any, idx: number) => ({
            id: group.id || `group_${idx}`,
            name: group.name || group.sceneName || `场景 ${idx + 1}`,
            shots: (group.shots || group.frames || []).map((shot: any, sIdx: number) => ({
              id: shot.id || `shot_${sIdx}`,
              index: sIdx,
              shotNumber: sIdx + 1,
              description: shot.description || shot.content || shot.prompt || '',
              prompt: shot.prompt || shot.loraPrompt || '',
              status: 'pending' as const,
            })),
          }));
        }
      }
    } catch {
      // 解析文本格式
      const groups: ShotGroup[] = [];
      const lines = content.split('\n');
      let currentGroup: ShotGroup | null = null;
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        // 检测场景标题
        if (trimmed.match(/^【?[场景场]?(?:\d+|序)[】:：]/)) {
          if (currentGroup) groups.push(currentGroup);
          currentGroup = {
            id: `group_${groups.length}`,
            name: trimmed.replace(/【|】|:|：/g, '').substring(0, 20),
            shots: [],
          };
          return;
        }
        
        // 检测分镜标题
        if (trimmed.match(/^【?[镜Shot]?[头]?\d+['】:：]/)) {
          if (!currentGroup) {
            currentGroup = { id: `group_0`, name: '场景 1', shots: [] };
          }
          currentGroup.shots.push({
            id: `shot_${currentGroup.shots.length}`,
            index: currentGroup.shots.length,
            shotNumber: currentGroup.shots.length + 1,
            description: trimmed.replace(/【|】|:|：|\d+/g, '').substring(0, 200),
            prompt: '',
            status: 'pending',
          });
          return;
        }
        
        // 普通描述添加到当前分镜
        if (currentGroup && currentGroup.shots.length > 0) {
          const lastShot = currentGroup.shots[currentGroup.shots.length - 1];
          if (lastShot.description) {
            lastShot.description += ' ' + trimmed.substring(0, 100);
          } else {
            lastShot.description = trimmed.substring(0, 200);
          }
        }
      });
      
      if (currentGroup) groups.push(currentGroup);
      
      return groups;
    }
    
    return [];
  };

  const handleAddShot = () => {
    const newGroup: ShotGroup = {
      id: `group_${Date.now()}`,
      name: `场景 ${shotGroups.length + 1}`,
      shots: [{
        id: `shot_${Date.now()}`,
        index: 0,
        shotNumber: 1,
        description: '',
        prompt: '',
        status: 'pending',
      }],
    };
    updateData('shotGroups', [...shotGroups, newGroup]);
  };

  const handleDeleteGroup = (groupId: string) => {
    updateData('shotGroups', shotGroups.filter(g => g.id !== groupId));
  };

  const handleUpdateShot = (groupId: string, shotId: string, field: string, value: string) => {
    const newGroups = shotGroups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        shots: g.shots.map(s => s.id === shotId ? { ...s, [field]: value } : s),
      };
    });
    updateData('shotGroups', newGroups);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'generating': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const totalShots = shotGroups.reduce((sum, g) => sum + g.shots.length, 0);

  return (
    <div className="min-w-[280px] flex flex-col bg-gray-800 rounded-lg">
      {/* 分集选择 */}
      <div className="px-2 py-2 border-b border-gray-600 bg-gray-750">
        <div className="flex items-center gap-2">
          <select
            value={selectedEpisodeId}
            onChange={(e) => handleEpisodeChange(e.target.value)}
            disabled={loadingEpisodes || localGenerating}
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">选择分集...</option>
            {localEpisodes.map(ep => (
              <option key={ep.id} value={ep.id}>
                {ep.name || `第${ep.episodeNumber}集`}
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={!selectedEpisodeId || localGenerating}
            className="flex items-center gap-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-xs text-white"
          >
            {localGenerating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            AI生成
          </button>
        </div>
        {loadingEpisodes && (
          <div className="text-xs text-gray-500 mt-1">加载分集中...</div>
        )}
      </div>

      {/* 分镜列表 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 max-h-64">
        {shotGroups.length === 0 ? (
          <div className="text-xs text-gray-500 text-center py-6">
            {selectedEpisodeId ? '点击"AI生成"创建分镜' : '请先选择分集'}
          </div>
        ) : (
          shotGroups.map(group => (
            <div key={group.id} className="bg-gray-700 rounded-lg p-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-300">{group.name}</span>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="p-1 text-gray-500 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              {group.shots.map((shot, idx) => (
                <div key={shot.id} className="bg-gray-600 rounded p-2 space-y-1 ml-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">#{idx + 1}</span>
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(shot.status)}`} />
                    <input
                      type="text"
                      value={shot.description}
                      onChange={(e) => handleUpdateShot(group.id, shot.id, 'description', e.target.value)}
                      placeholder="分镜描述..."
                      className="flex-1 bg-transparent border-none text-xs text-white placeholder-gray-500 focus:outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={shot.prompt || ''}
                    onChange={(e) => handleUpdateShot(group.id, shot.id, 'prompt', e.target.value)}
                    placeholder="Prompt (可选)..."
                    className="w-full bg-gray-500 rounded px-2 py-1 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* 添加场景按钮 */}
      {shotGroups.length > 0 && (
        <div className="px-2 py-2 border-t border-gray-600">
          <button
            onClick={handleAddShot}
            className="w-full flex items-center justify-center gap-1 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-400"
          >
            <Plus className="w-3 h-3" />
            添加场景
          </button>
        </div>
      )}

      {/* 统计信息 */}
      <div className="px-2 py-1.5 border-t border-gray-600 text-xs text-gray-500 flex justify-between">
        <span>{shotGroups.length} 个场景</span>
        <span>{totalShots} 个分镜</span>
      </div>
    </div>
  );
}
