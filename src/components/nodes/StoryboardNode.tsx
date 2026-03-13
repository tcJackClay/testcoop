import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Sparkles, Loader2, Save } from 'lucide-react';
import { storyboardScriptApi, vectorApi } from '../../api';
import { useProjectStore } from '../../stores/projectStore';
import { useAuthStore } from '../../stores/authStore';
import { useEpisodeStore, Episode } from '../../stores/episodeStore';

// Frame - 帧
interface Frame {
  id: string;
  frameNumber: string;
  time: string;
  scale: string;
  description: string;
}

// Shot - 镜头
interface Shot {
  id: string;
  index: number;
  shotNumber: number;
  cameraWork: string;
  description: string;
  frames: Frame[];
  prompt?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

// ShotGroup - 场景/镜头组
interface ShotGroup {
  id: string;
  name: string;
  shots: Shot[];
}

// 从描述中提取 Frame 信息
const extractFrames = (description: string): Array<{ time: string; desc: string }> => {
  if (!description) return [];
  
  const frames: Array<{ time: string; desc: string }> = [];
  const frameRegex = /【Frame\s*(\d+)s?】?\s*(.*?)(?=(?:【Frame\s*\d+s?】)|$)/g;
  let match;
  
  while ((match = frameRegex.exec(description)) !== null) {
    frames.push({
      time: `${match[1]}s`,
      desc: match[2].trim()
    });
  }
  
  return frames;
};

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

export default function StoryboardNode({ nodeId: _nodeId, data, updateData }: StoryboardNodeProps) {
  const { currentProjectId } = useProjectStore();
  const { user } = useAuthStore();
  const { episodes, selectedEpisodeId, setSelectedEpisodeId, loadEpisodes, loading } = useEpisodeStore();
  
  // 内部状态，用于节点级别的临时状态
  const [localEpisodes] = useState<Episode[]>([]);
  const [localSelectedId, setLocalSelectedId] = useState<string>('');
  const [localGenerating, setLocalGenerating] = useState(false);
  const [localSaving, setLocalSaving] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  
  // 当前选中的场景和 shot
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [currentShotId, setCurrentShotId] = useState<string | null>(null);

  // 同步 store 中的 episodes 到本地，加载完成后检查是否需要加载已有分镜
  useEffect(() => {
    if (currentProjectId) {
      loadEpisodes(currentProjectId).then(() => {
        const savedEpisodeId = data.selectedEpisodeId as string;
        if (savedEpisodeId) {
          loadExistingStoryboard(parseInt(savedEpisodeId));
        }
      });
    }
  }, [currentProjectId, loadEpisodes]);

  // 当 store 中的 selectedEpisodeId 变化时，同步到本地，并加载已有分镜
  useEffect(() => {
    if (selectedEpisodeId) {
      setLocalSelectedId(selectedEpisodeId);
      loadExistingStoryboard(parseInt(selectedEpisodeId));
    }
  }, [selectedEpisodeId]);

  // 使用本地状态或 store 状态
  const displayEpisodes = episodes.length > 0 ? episodes : localEpisodes;
  const displaySelectedId = selectedEpisodeId || localSelectedId;

  // 从 node data 中获取已有的分镜
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const existingStoryboard = (data.existingStoryboard as StoryboardScript) || null;

  // 加载已有分镜
  const loadExistingStoryboard = async (episodeId: number) => {
    if (!currentProjectId) return;
    
    console.log('[StoryboardNode] 加载已有分镜, episodeId:', episodeId, 'projectId:', currentProjectId);
    setLocalLoading(true);
    
    try {
      // 直接使用当前 projectId 查询（后端已修复 null projectId 的问题）
      const resp = await storyboardScriptApi.getAll(undefined, currentProjectId);
      
      if (resp.code === 0 && resp.data) {
        console.log('[StoryboardNode] 找到', resp.data.length, '条分镜');
        
        // 匹配分镜：优先通过 ext1.episodeId，其次通过名称（如"第6集分镜"）
        const matched = resp.data.find((sb: any) => {
          // 方式1: 通过 ext1.episodeId 匹配
          if (sb.ext1) {
            try {
              const ext1Data = JSON.parse(sb.ext1);
              if (ext1Data.episodeId === episodeId) {
                return true;
              }
            } catch {}
          }
          // 方式2: 通过 resourceName 匹配（如"第6集分镜"）
          if (sb.resourceName) {
            const nameMatch = sb.resourceName.match(/第(\d+)集分镜/);
            if (nameMatch && parseInt(nameMatch[1]) === episodeId) {
              return true;
            }
          }
          return false;
        });
        
        if (matched) {
          console.log('[StoryboardNode] 匹配到已有分镜, id:', matched.id, 'resourceName:', matched.resourceName);
          const storyboardContent = matched.resourceContent || matched.content || '';
          
          // 解析 resourceContent（可能是 JSON 包装格式）
          let parsedContent = storyboardContent;
          try {
            const parsed = JSON.parse(storyboardContent);
            if (parsed.content) {
              parsedContent = parsed.content;
            }
          } catch {}
          
          const parsed = parseStoryboardScript(parsedContent);
          
          // 设置选中第一个场景和镜头
          if (parsed.length > 0) {
            setCurrentGroupId(parsed[0].id);
            if (parsed[0].shots.length > 0) {
              setCurrentShotId(parsed[0].shots[0].id);
            }
          }
          
          updateData('existingStoryboard', matched);
          updateData('storyboardContent', parsedContent);
          updateData('shotGroups', parsed);
          console.log('[StoryboardNode] 加载完成, 场景数:', parsed.length);
          setLocalLoading(false);
          return;
        } else {
          console.log('[StoryboardNode] 未匹配到 episodeId:', episodeId);
        }
      }
    } catch (error) {
      console.error('[StoryboardNode] 加载分镜失败:', error);
    }
    
    console.log('[StoryboardNode] 未找到分镜');
    updateData('existingStoryboard', null);
    updateData('storyboardContent', '');
    updateData('shotGroups', []);
    setLocalLoading(false);
  };

  // 选择分集时更新 store（同步到 ScriptPanel）
  const handleEpisodeChange = (episodeId: string) => {
    setSelectedEpisodeId(episodeId);  // 更新 store，ScriptPanel 也会同步
    updateData('selectedEpisodeId', episodeId);
    if (episodeId) {
      loadExistingStoryboard(parseInt(episodeId));
    }
  };

  // AI 生成分镜
  const handleGenerate = async () => {
    if (!displaySelectedId) {
      alert('请先选择分集');
      return;
    }
    
    if (!currentProjectId) {
      alert('请先选择项目');
      return;
    }
    
    const episode = displayEpisodes.find(ep => ep.id === parseInt(displaySelectedId));
    if (!episode?.content) {
      alert('分集内容为空，请先在剧本面板创建分集');
      return;
    }

    console.log('[StoryboardNode] 开始AI生成, episodeId:', displaySelectedId);
    setLocalGenerating(true);
    updateData('isGenerating', true);
    
    try {
      const response = await vectorApi.chatCompletion({
        prompt: episode.content,
        type: 3, // 转分镜
      }, 180000);
      
      console.log('[StoryboardNode] AI返回, code:', response.code);
      
      if (response.code === 0 && response.data) {
        const content = response.data;
        console.log('[StoryboardNode] AI返回内容预览:', content.substring(0, 500));
        console.log('[StoryboardNode] AI返回内容长度:', content.length);
        
        // 更新节点数据
        updateData('storyboardContent', content);
        
        // 解析分镜内容
        const parsed = parseStoryboardScript(content);
        updateData('shotGroups', parsed);
        console.log('[StoryboardNode] 解析完成, 场景数:', parsed.length, '镜头数:', parsed.reduce((sum, g) => sum + g.shots.length, 0));
        
        // 设置选中第一个场景和镜头
        if (parsed.length > 0) {
          setCurrentGroupId(parsed[0].id);
          if (parsed[0].shots.length > 0) {
            setCurrentShotId(parsed[0].shots[0].id);
          }
        }
        
        // 保存到后端 (使用 huanu 格式)
        await saveStoryboard(parseInt(displaySelectedId), content);
      } else {
        alert('AI 生成分镜失败: ' + (response.message || '未知错误'));
        setLocalGenerating(false);
        updateData('isGenerating', false);
      }
    } catch (error) {
      console.error('[StoryboardNode] AI生成失败:', error);
      alert('AI 生成分镜失败: ' + error);
      setLocalGenerating(false);
      updateData('isGenerating', false);
    }
  };

  // 保存分镜到后端 (参考 huanu-workbench-frontend 格式)
  // 格式: 【场次概述】xxx \n #【Shot 01】【Frame 3s】【中景】描述
  const saveStoryboard = async (episodeId: number, content?: string) => {
    const currentExistingStoryboard = (data.existingStoryboard as StoryboardScript) || null;
    await saveStoryboardWithContent(episodeId, content, currentExistingStoryboard);
  };
  
  // 保存分镜到后端 (内部函数)
  const saveStoryboardWithContent = async (episodeId: number, content: string | undefined, existingStoryboard: StoryboardScript | null) => {
    if (!currentProjectId) return;
    
    const userId = user?.id || 1;
    const username = user?.username || 'system';
    const now = new Date().toISOString();
    
    // 使用传入的 content 或从 shotGroups 序列化
    let scriptContent = content;
    if (!scriptContent) {
      // 序列化 shotGroups 为文本格式 (参考 huanu-workbench-frontend)
      scriptContent = '';
      const currentShotGroups = (data.shotGroups as ShotGroup[]) || [];
      currentShotGroups.forEach((group) => {
        scriptContent += `#【Shot ${group.name}】`;
        group.shots.forEach((shot) => {
          // 提取 Frame 信息
          const frames = extractFrames(shot.description);
          if (frames.length > 0) {
            frames.forEach((frame) => {
              scriptContent += `【Frame ${frame.time}】【中景】${frame.desc}`;
            });
          } else {
            // 没有 Frame 格式，直接保存描述
            scriptContent += `【Frame 3s】【中景】${shot.description || ''}`;
          }
        });
        scriptContent += '\n';
      });
    }
    
    console.log('[StoryboardNode] 保存分镜到后端, episodeId:', episodeId, 'projectId:', currentProjectId, 'existingStoryboard:', !!existingStoryboard, 'id:', existingStoryboard?.id, 'content长度:', scriptContent?.length);
    
    try {
      // 直接使用传入的 existingStoryboard
      if (existingStoryboard?.id) {
        // 更新 - 使用 huanu 格式: { content: scriptContent }
        console.log('[StoryboardNode] 更新分镜, id:', existingStoryboard.id, 'projectId:', currentProjectId);
        
        const updateDataFormat = {
          resourceName: `第${episodeId}集分镜`,
          resourceType: 'storyboard_script',
          resourceContent: JSON.stringify({ content: scriptContent }), // JSON 包装格式
          resourceStatus: 'official',
          status: 1,
          updatedBy: username,
          updatedTime: now,
          ext1: JSON.stringify({ episodeId, type: 'storyboard' }),
        };
        
        const updateResult = await storyboardScriptApi.update(existingStoryboard.id, updateDataFormat);
        console.log('[StoryboardNode] 更新结果, code:', updateResult.code, 'id:', updateResult.data?.id);
        
        if (updateResult.code === 0) {
          updateData('existingStoryboard', { ...existingStoryboard, resourceContent: scriptContent });
        }
      } else {
        // 创建新分镜 - 使用 huanu 格式
        console.log('[StoryboardNode] 创建新分镜');
        const saveData = {
          resourceName: `第${episodeId}集分镜`,
          resourceType: 'storyboard',
          resourceContent: JSON.stringify({ content: scriptContent }), // JSON 包装格式
          resourceStatus: 'official',
          projectId: currentProjectId,
          userId,
          status: 1,
          createdBy: username,
          updatedBy: username,
          createdTime: now,
          updatedTime: now,
          ext1: JSON.stringify({ episodeId, type: 'storyboard' }),
          ext2: undefined,
        };
        
        const createResult = await storyboardScriptApi.create(saveData);
        console.log('[StoryboardNode] 创建结果, code:', createResult.code, 'data:', createResult.data);
        
        if (createResult.code === 0 && createResult.data) {
          updateData('existingStoryboard', {
            id: createResult.data.id,
            name: saveData.resourceName,
            content: scriptContent
          });
        }
      }
    } catch (error) {
      console.error('[StoryboardNode] 保存失败:', error);
    }
  };

  // 手动保存分镜
  const handleSave = useCallback(async () => {
    const currentShotGroups = (data.shotGroups as ShotGroup[]) || [];
    const currentExistingStoryboard = (data.existingStoryboard as StoryboardScript) || null;
    
    if (!displaySelectedId) {
      console.warn('[StoryboardNode] 未选择分集');
      return;
    }
    
    if (!currentProjectId) {
      console.warn('[StoryboardNode] 未选择项目');
      return;
    }
    
    if (currentShotGroups.length === 0) {
      console.warn('[StoryboardNode] 没有可保存的分镜数据');
      return;
    }
    
    console.log('[StoryboardNode] 手动保存分镜, episodeId:', displaySelectedId, 'existingId:', currentExistingStoryboard?.id, 'groups:', currentShotGroups.length);
    setLocalSaving(true);
    
    try {
      // 序列化当前的 shotGroups
      let scriptContent = '';
      currentShotGroups.forEach((group) => {
        scriptContent += `#【Shot ${group.name}】\n`;
        group.shots.forEach((shot) => {
          // 使用新的 Frame 数组结构
          if (shot.frames && shot.frames.length > 0) {
            shot.frames.forEach((frame) => {
              scriptContent += `【Frame ${frame.time}】【${frame.scale}】${frame.description}\n`;
            });
          } else {
            // 兼容旧格式
            scriptContent += `【Frame 3s】【中景】${shot.description || ''}\n`;
          }
        });
      });
      
      console.log('[StoryboardNode] 序列化内容长度:', scriptContent.length);
      
      // 直接保存
      await saveStoryboardWithContent(parseInt(displaySelectedId), scriptContent, currentExistingStoryboard);
      console.log('[StoryboardNode] 保存完成');
    } catch (error) {
      console.error('[StoryboardNode] 保存失败:', error);
    } finally {
      setLocalSaving(false);
    }
  }, [displaySelectedId, currentProjectId, data.shotGroups, data.existingStoryboard, saveStoryboard]);

  // 解析分镜脚本为 shotGroups
  const parseStoryboardScript = (content: string): ShotGroup[] => {
    if (!content) return [];
    
    console.log('[StoryboardNode] 开始解析, 首字符:', content[0], '是否JSON:', content.startsWith('{') || content.startsWith('['));
    
    try {
      // 尝试解析 JSON 格式
      if (content.startsWith('{') || content.startsWith('[')) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          console.log('[StoryboardNode] JSON解析成功, 数组长度:', parsed.length);
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
    } catch (e) {
      console.log('[StoryboardNode] JSON解析失败:', e);
    }
    
    // 解析 AI 返回的自定义格式
    // 格式: 第一场 xxx / #【Shot 1-1】/ 画面描述：/ 承接描述：
    const groups: ShotGroup[] = [];
    const lines = content.split('\n');
    console.log('[StoryboardNode] 文本解析, 行数:', lines.length);
    
    let currentGroup: ShotGroup | null = null;
    let currentShot: Shot | null = null;
    let currentField: 'description' | 'prompt' = 'description';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      // 检测场景标题: 第一场 / 第二场 / 第三场...
      if (trimmed.match(/^第[一二三四五六七八九十\d]+场/)) {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = {
          id: `group_${groups.length}`,
          name: trimmed.substring(0, 30),
          shots: [],
        };
        currentShot = null;
        return;
      }
      
      // 检测场次概述: 【场次概述】
      if (trimmed.includes('【场次概述】')) {
        return;
      }
      
      // 检测时间/地点/角色
      if (trimmed.startsWith('时间：') || trimmed.startsWith('地点：') || trimmed.startsWith('角色：')) {
        if (currentGroup && !currentShot) {
          currentGroup.name += ' ' + trimmed;
        }
        return;
      }
      
      // 检测概述
      if (trimmed.startsWith('概述：')) {
        if (currentGroup && !currentShot) {
          currentGroup.name += ' ' + trimmed.substring(0, 50);
        }
        return;
      }
      
      // 检测分镜标题: #【Shot 1-1】 或 #【Shot 2-1】
      if (trimmed.match(/^#?【?Shot\s*\d+[-]?\d*】?/)) {
        if (!currentGroup) {
          currentGroup = { id: `group_${groups.length}`, name: '场景 1', shots: [] };
        }
        // 提取分镜编号（暂未使用）
        const shotMatch = trimmed.match(/Shot\s*(\d+)[-](\d+)/);
        const _shotNum = shotMatch ? `${shotMatch[1]}-${shotMatch[2]}` : `${currentGroup.shots.length + 1}`;
        
        currentShot = {
          id: `shot_${Date.now()}_${currentGroup.shots.length}`,
          index: currentGroup.shots.length,
          shotNumber: currentGroup.shots.length + 1,
          cameraWork: '',
          description: '',
          frames: [],
          prompt: '',
          status: 'pending',
        };
        if (currentGroup && currentShot) {
          currentGroup.shots.push(currentShot);
        }
        currentField = 'description';
        return;
      }
      
      // 检测画面描述
      if (trimmed.startsWith('画面描述：') || trimmed.startsWith('【Frame')) {
        if (currentShot) {
          // 提取 Frame 信息
          const frameMatch = trimmed.match(/【Frame\s*(\d+)s?】?\s*【?(.*?)】?(.*)/);
          if (frameMatch) {
            const time = `${frameMatch[1]}s`;
            const scale = frameMatch[2]?.trim() || '中景';
            const desc = frameMatch[3]?.trim() || '';
            // 添加到 frames 数组
            currentShot.frames.push({
              id: `frame_${Date.now()}_${currentShot.frames.length}`,
              frameNumber: String(currentShot.frames.length + 1).padStart(2, '0'),
              time,
              scale,
              description: desc,
            });
          } else {
            // 兼容旧格式，添加到 description
            currentShot.description += trimmed.replace('画面描述：', '') + '\n';
          }
        }
        return;
      }
      
      // 检测承接描述
      if (trimmed.startsWith('承接描述：')) {
        if (currentShot) {
          currentShot.prompt = trimmed.replace('承接描述：', '').trim();
          currentField = 'prompt';
        }
        return;
      }
      
      // 检测音效/对白
      if (trimmed.startsWith('音效/对白：')) {
        if (currentShot) {
          currentShot.description += '\n' + trimmed;
        }
        return;
      }
      
      // 检测分镜编号作为标题
      if (trimmed.match(/^#【Shot\s*\d+[-]?\d*】?/)) {
        if (!currentGroup) {
          currentGroup = { id: `group_${groups.length}`, name: '场景 1', shots: [] };
        }
        currentShot = {
          id: `shot_${Date.now()}_${currentGroup.shots.length}`,
          index: currentGroup.shots.length,
          shotNumber: currentGroup.shots.length + 1,
          cameraWork: '',
          description: '',
          frames: [],
          prompt: '',
          status: 'pending',
        };
        currentGroup.shots.push(currentShot);
        return;
      }
      
      // 跳过其他标记行
      if (trimmed.startsWith('---') || trimmed.startsWith('# ') || trimmed.startsWith('**')) {
        return;
      }
      
      // 其他内容添加到当前分镜描述
      if (currentShot && trimmed.length > 0) {
        if (currentField === 'description') {
          currentShot.description += trimmed + '\n';
        }
      }
    });
    
    if (currentGroup) groups.push(currentGroup);
    
    console.log('[StoryboardNode] 解析结果:', groups);
    return groups;
  };

  const handleAddShot = () => {
    const newGroup: ShotGroup = {
      id: `group_${Date.now()}`,
      name: `场景 ${shotGroups.length + 1}`,
      shots: [{
        id: `shot_${Date.now()}`,
        index: 0,
        shotNumber: 1,
        cameraWork: '',
        description: '',
        frames: [{
          id: `frame_${Date.now()}_0`,
          frameNumber: '01',
          time: '3s',
          scale: '中景',
          description: '',
        }],
        prompt: '',
        status: 'pending',
      }],
    };
    updateData('shotGroups', [...shotGroups, newGroup]);
    // 自动选中新添加的场景和 shot
    setCurrentGroupId(newGroup.id);
    setCurrentShotId(newGroup.shots[0].id);
  };

  const handleDeleteGroup = (groupId: string) => {
    updateData('shotGroups', shotGroups.filter(g => g.id !== groupId));
    // 如果删除的是当前选中的，清除选中状态
    if (currentGroupId === groupId) {
      setCurrentGroupId(null);
      setCurrentShotId(null);
    }
  };

  // 添加 Shot 到场景
  const handleAddShotToGroup = (groupId: string) => {
    const group = shotGroups.find(g => g.id === groupId);
    const newShot: Shot = {
      id: `shot_${Date.now()}`,
      index: group?.shots.length || 0,
      shotNumber: (group?.shots.length || 0) + 1,
      cameraWork: '',
      description: '',
      frames: [{
        id: `frame_${Date.now()}_0`,
        frameNumber: '01',
        time: '3s',
        scale: '中景',
        description: '',
      }],
      prompt: '',
      status: 'pending',
    };
    
    const newGroups = shotGroups.map(g => {
      if (g.id !== groupId) return g;
      return { ...g, shots: [...g.shots, newShot] };
    });
    updateData('shotGroups', newGroups);
    // 选中新添加的 shot
    setCurrentGroupId(groupId);
    setCurrentShotId(newShot.id);
  };

  // 删除 Shot
  const handleDeleteShot = (groupId: string, shotId: string) => {
    const newGroups = shotGroups.map(g => {
      if (g.id !== groupId) return g;
      const newShots = g.shots.filter(s => s.id !== shotId).map((s, i) => ({ ...s, shotNumber: i + 1, index: i }));
      return { ...g, shots: newShots };
    });
    updateData('shotGroups', newGroups);
    // 如果删除的是当前选中的，清除选中状态
    if (currentShotId === shotId) {
      setCurrentShotId(null);
    }
  };

  // 添加 Frame 到 Shot
  const handleAddFrame = (groupId: string, shotId: string, insertAfterFrameId?: string) => {
    const newFrame: Frame = {
      id: `frame_${Date.now()}`,
      frameNumber: '01',
      time: '3s',
      scale: '中景',
      description: '',
    };
    
    const newGroups = shotGroups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        shots: g.shots.map(s => {
          if (s.id !== shotId) return s;
          // 找到插入位置
          let newFrames = [...s.frames];
          if (insertAfterFrameId) {
            const insertIdx = newFrames.findIndex(f => f.id === insertAfterFrameId);
            if (insertIdx >= 0) {
              newFrames.splice(insertIdx + 1, 0, newFrame);
            } else {
              newFrames.push(newFrame);
            }
          } else {
            newFrames.push(newFrame);
          }
          // 重新编号
          newFrames = newFrames.map((f, i) => ({ ...f, frameNumber: String(i + 1).padStart(2, '0') }));
          return { ...s, frames: newFrames };
        }),
      };
    });
    updateData('shotGroups', newGroups);
  };

  // 删除 Frame
  const handleDeleteFrame = (groupId: string, shotId: string, frameId: string) => {
    const newGroups = shotGroups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        shots: g.shots.map(s => {
          if (s.id !== shotId) return s;
          const newFrames = s.frames.filter(f => f.id !== frameId).map((f, i) => ({ ...f, frameNumber: String(i + 1).padStart(2, '0') }));
          return { ...s, frames: newFrames };
        }),
      };
    });
    updateData('shotGroups', newGroups);
  };

  // 更新 Frame
  const handleUpdateFrame = (groupId: string, shotId: string, frameId: string, field: keyof Frame, value: string) => {
    const newGroups = shotGroups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        shots: g.shots.map(s => {
          if (s.id !== shotId) return s;
          const newFrames = s.frames.map(f => f.id === frameId ? { ...f, [field]: value } : f);
          return { ...s, frames: newFrames };
        }),
      };
    });
    updateData('shotGroups', newGroups);
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

  // 更新 Group 名称
  const handleUpdateGroup = (groupId: string, name: string) => {
    const newGroups = shotGroups.map(g => g.id === groupId ? { ...g, name } : g);
    updateData('shotGroups', newGroups);
  };

  const shotGroups = (data.shotGroups as ShotGroup[]) || [];
  const totalShots = shotGroups.reduce((sum, g) => sum + g.shots.length, 0);

  return (
    <div className="w-[500px] min-h-[600px] flex flex-col bg-gray-800 rounded-lg shadow-xl">
      {/* 分集选择 */}
      <div className="px-2 py-2 border-b border-gray-600 bg-gray-750">
        <div className="flex items-center gap-2">
          <select
            value={displaySelectedId}
            onChange={(e) => handleEpisodeChange(e.target.value)}
            disabled={loading || localGenerating || localLoading || localSaving}
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">选择分集...</option>
            {displayEpisodes.map(ep => (
              <option key={ep.id} value={ep.id}>
                {ep.title || ep.name || `第${ep.episodeNumber}集`}
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={!displaySelectedId || localGenerating}
            className="flex items-center gap-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-xs text-white"
          >
            {localGenerating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            AI生成
          </button>
          <button
            onClick={handleSave}
            disabled={!displaySelectedId || localSaving || shotGroups.length === 0}
            className="flex items-center gap-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-xs text-white"
            title="手动保存分镜"
          >
            {localSaving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            保存
          </button>
        </div>
        {loading || localLoading ? (
          <div className="text-xs text-blue-400 mt-1">加载中...</div>
        ) : localGenerating ? (
          <div className="text-xs text-yellow-400 mt-1">AI 生成分镜中...</div>
        ) : localSaving ? (
          <div className="text-xs text-green-400 mt-1">保存中...</div>
        ) : (
          <div className="text-xs text-gray-500 mt-1">已选择: {displaySelectedId ? `第${displaySelectedId}集` : '未选择'}</div>
        )}
      </div>

      {/* 分镜内容区域 - 两栏结构：上方帧编辑 + 下方场景/镜头选择 */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ maxHeight: '480px' }}>
        {shotGroups.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-xs text-gray-500 text-center">
              {displaySelectedId ? '点击"AI生成"创建分镜' : '请先选择分集'}
            </div>
          </div>
        ) : (
          <>
            {/* 上方 - 主要编辑区域 */}
            <div className="flex-1 flex overflow-hidden">
              {/* 左侧 - Shot 列表（缩小宽度） */}
              <div className="w-24 border-r border-gray-600 overflow-y-auto bg-gray-750">
                {currentGroupId ? (
                  <div className="p-1 space-y-1">
                    <div className="text-xs text-gray-400 px-1 mb-1">
                      镜头
                      <button
                        onClick={() => handleAddShotToGroup(currentGroupId)}
                        className="ml-1 text-blue-400 hover:text-blue-300"
                      >
                        <Plus className="w-3 h-3 inline" />
                      </button>
                    </div>
                    {(() => {
                      const group = shotGroups.find(g => g.id === currentGroupId);
                      return group?.shots.map((shot, shotIdx) => (
                        <div
                          key={shot.id}
                          onClick={() => setCurrentShotId(shot.id)}
                          className={`p-1.5 rounded cursor-pointer text-xs ${
                            currentShotId === shot.id
                              ? 'bg-yellow-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">#{shotIdx + 1}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('确定要删除这个镜头吗？')) {
                                  handleDeleteShot(currentGroupId, shot.id);
                                }
                              }}
                              className="text-gray-400 hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-xs opacity-70">{shot.frames?.length || 0} 帧</div>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <div className="p-2 text-xs text-gray-500 text-center">选择场景</div>
                )}
              </div>

              {/* 右侧 - Frame 编辑区域 */}
              <div className="flex-1 overflow-y-auto p-3 bg-gray-800">
                {currentGroupId && currentShotId ? (
                  (() => {
                    const group = shotGroups.find(g => g.id === currentGroupId);
                    const shot = group?.shots.find(s => s.id === currentShotId);
                    if (!shot) return null;
                    
                    return (
                      <div className="space-y-3">
                        {/* 场景/镜头信息 */}
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-600">
                          <span className="text-xs text-gray-400">场景:</span>
                          <input
                            type="text"
                            value={group?.name || ''}
                            onChange={(e) => currentGroupId && handleUpdateGroup(currentGroupId, e.target.value)}
                            placeholder="场景名称..."
                            className="flex-1 bg-transparent border border-gray-600 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                          />
                          <span className="text-xs text-gray-400">运镜:</span>
                          <input
                            type="text"
                            value={shot.cameraWork}
                            onChange={(e) => handleUpdateShot(currentGroupId!, shot.id, 'cameraWork', e.target.value)}
                            placeholder="运镜描述..."
                            className="flex-1 bg-transparent border border-gray-600 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        
                        {/* Frames */}
                        <div className="space-y-2">
                          <div className="text-xs text-gray-400 flex items-center justify-between">
                            <span>帧列表</span>
                            <button
                              onClick={() => handleAddFrame(currentGroupId!, shot.id)}
                              className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />添加帧
                            </button>
                          </div>
                          
                          <div className="space-y-2">
                            {shot.frames?.map((frame, frameIdx) => (
                              <div key={frame.id} className="bg-gray-700 rounded-lg p-2 border border-gray-600">
                                <div className="flex items-center gap-1 mb-2">
                                  <span className="text-xs font-bold text-blue-400">帧 {frame.frameNumber}</span>
                                  <input
                                    type="text"
                                    value={frame.time}
                                    onChange={(e) => handleUpdateFrame(currentGroupId!, shot.id, frame.id, 'time', e.target.value)}
                                    placeholder="时长"
                                    className="w-12 bg-gray-600 border border-gray-500 rounded px-1 text-xs text-white text-center"
                                  />
                                  <input
                                    type="text"
                                    value={frame.scale}
                                    onChange={(e) => handleUpdateFrame(currentGroupId!, shot.id, frame.id, 'scale', e.target.value)}
                                    placeholder="景别"
                                    className="w-16 bg-gray-600 border border-gray-500 rounded px-1 text-xs text-white text-center"
                                  />
                                  <div className="flex-1" />
                                  <button
                                    onClick={() => {
                                      if (confirm('确定要在这个帧后面插入新帧吗？')) {
                                        handleAddFrame(currentGroupId!, shot.id, frame.id);
                                      }
                                    }}
                                    className="text-gray-400 hover:text-blue-400 p-1"
                                    title="在后面插入帧"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('确定要删除这一帧吗？')) {
                                        handleDeleteFrame(currentGroupId!, shot.id, frame.id);
                                      }
                                    }}
                                    className="text-gray-400 hover:text-red-400 p-1"
                                    title="删除帧"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <textarea
                                  value={frame.description}
                                  onChange={(e) => handleUpdateFrame(currentGroupId!, shot.id, frame.id, 'description', e.target.value)}
                                  placeholder="帧描述..."
                                  rows={2}
                                  className="w-full bg-transparent border-none text-xs text-white placeholder-gray-500 focus:outline-none resize-none"
                                />
                              </div>
                            ))}
                            
                            {(!shot.frames || shot.frames.length === 0) && (
                              <div className="text-xs text-gray-500 text-center py-4">
                                暂无帧，点击上方添加
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* AI Prompt */}
                        <div className="pt-2 border-t border-gray-600">
                          <div className="text-xs text-gray-400 mb-1">AI 绘图 Prompt</div>
                          <textarea
                            value={shot.prompt || ''}
                            onChange={(e) => handleUpdateShot(currentGroupId!, shot.id, 'prompt', e.target.value)}
                            placeholder="输入 AI 绘图提示词..."
                            rows={2}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                          />
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-xs text-gray-500 text-center">
                      选择一个场景和镜头<br/>查看和编辑帧
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 下方 - 场景选择栏 */}
            <div className="h-16 border-t border-gray-600 bg-gray-750 px-2 flex items-center gap-2 overflow-x-auto">
              <span className="text-xs text-gray-400 shrink-0">场景:</span>
              {shotGroups.map((group, groupIdx) => (
                <div
                  key={group.id}
                  onClick={() => {
                    setCurrentGroupId(group.id);
                    if (group.shots.length > 0 && !currentShotId) {
                      setCurrentShotId(group.shots[0].id);
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer text-xs shrink-0 ${
                    currentGroupId === group.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span className="font-medium">{group.name || `场景 ${groupIdx + 1}`}</span>
                  <span className="text-xs opacity-70">({group.shots.length}镜)</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('确定要删除这个场景吗？')) {
                        handleDeleteGroup(group.id);
                      }
                    }}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddShot}
                className="flex items-center gap-1 px-2 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-400 shrink-0"
              >
                <Plus className="w-3 h-3" />添加
              </button>
            </div>
          </>
        )}
      </div>

      {/* 统计信息 */}
      <div className="px-2 py-1.5 border-t border-gray-600 text-xs text-gray-500 flex justify-between">
        <span>{shotGroups.length} 个场景</span>
        <span>{totalShots} 个镜头</span>
      </div>
    </div>
  );
}

// 全局调试函数 - 在控制台输入 window.testCreateStoryboard() 调用
;(window as any).testCreateStoryboard = async function(projectId = 1, episodeId = 999, resourceStatus = 'draft') {
  const { storyboardScriptApi } = await import('../../api');
  const testData = {
    resourceName: `第${episodeId}集分镜_测试_status=${resourceStatus}`,
    resourceType: 'storyboard',
    resourceContent: '这是测试内容',
    resourceStatus: resourceStatus,
    projectId: projectId,
    userId: 1,
    status: 1,
    createdBy: 'test',
    updatedBy: 'test',
    createdTime: new Date().toISOString(),
    updatedTime: new Date().toISOString(),
    ext1: JSON.stringify({ episodeId, type: 'storyboard' }),
    ext2: undefined,
  };
  console.log('=== 测试创建分镜 ===', testData);
  try {
    const resp = await storyboardScriptApi.create(testData);
    console.log('创建结果:', resp);
    return resp;
  } catch (e) {
    console.error('创建失败:', e);
    return null;
  }
};

// 测试不同 status
;(window as any).testCreateDraft = () => window.testCreateStoryboard(1, 998, 'draft');
;(window as any).testCreateOfficial = () => window.testCreateStoryboard(1, 997, 'official');
;(window as any).testCreateWorking = () => window.testCreateStoryboard(1, 996, 'working');

// 通过ID查询测试
;(window as any).testGetById = async function(id = 1) {
  const { storyboardScriptApi } = await import('../../api');
  console.log('=== 通过ID查询 ===', id);
  try {
    const resp = await storyboardScriptApi.getById(id);
    console.log('查询结果:', resp);
    return resp;
  } catch (e) {
    console.error('查询失败:', e);
    return null;
  }
};

// 打印创建返回的完整信息
;(window as any).testCreateAndCheck = async function() {
  const { storyboardScriptApi } = await import('../../api');
  const testData = {
    resourceName: `第1000集分镜_完整测试`,
    resourceType: 'storyboard',
    resourceContent: '完整测试内容',
    resourceStatus: 'draft',
    projectId: 1,
    userId: 1,
    status: 1,
    createdBy: 'test',
    updatedBy: 'test',
    createdTime: new Date().toISOString(),
    updatedTime: new Date().toISOString(),
    ext1: JSON.stringify({ episodeId: 1000, type: 'storyboard' }),
    ext2: undefined,
  };
  console.log('=== 创建并查询 ===');
  const resp = await storyboardScriptApi.create(testData);
  console.log('创建响应: ID=', resp.data?.id);
  console.log('创建返回的data:', resp.data);
  const newId = resp.data?.id;
  
  if (newId) {
    // 等待2秒后再查询
    console.log('等待2秒...');
    await new Promise(r => setTimeout(r, 2000));
    
    // 尝试通过ID查询
    console.log('2秒后查询ID:', newId);
    const getResp = await storyboardScriptApi.getById(newId);
    console.log('2秒后查询结果:', getResp);
    
    // 尝试用列表查询
    console.log('通过列表查询projectId=1...');
    const listResp = await storyboardScriptApi.getAll(undefined, 1);
    console.log('列表结果:', listResp.code, listResp.data?.length);
    // 检查是否有新创建的
    const found = listResp.data?.find((sb: any) => sb.id === newId);
    console.log('列表中是否包含新ID:', found);
  }
};

// 全局调试函数 - 在控制台输入 window.searchAllStoryboards() 调用
;(window as any).searchAllStoryboards = async function() {
  console.log('=== 搜索所有分镜脚本 ===');
  const projectIds = [1, 2, 3, 4, 5, 10, 20, 50, 100, 200, 500, 1024];
  let allData: any[] = [];
  
  for (const pid of projectIds) {
    try {
      const resp = await storyboardScriptApi.getAll(undefined, pid);
      if (resp.code === 0 && resp.data && resp.data.length > 0) {
        console.log(`projectId=${pid}: ${resp.data.length}条`);
        allData = allData.concat(resp.data);
      } else if (resp.code !== 0) {
        console.log(`projectId=${pid}: 错误 ${resp.code} ${resp.message}`);
      }
    } catch (e) {
      console.log(`projectId=${pid}: 异常`, e);
    }
  }
  
  console.log('总计:', allData.length, '条');
  // 按id排序，打印最新的10条
  const sorted = allData.sort((a, b) => b.id - a.id).slice(0, 10);
  console.log('最新10条:');
  sorted.forEach((sb: any) => {
    console.log(`  id=${sb.id}, name=${sb.resourceName}, projectId=${sb.projectId}, ext1=${sb.ext1}`);
  });
  return allData;
};
