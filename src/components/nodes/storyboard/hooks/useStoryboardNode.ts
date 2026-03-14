// src/components/nodes/storyboard/hooks/useStoryboardNode.ts - 故事板节点业务逻辑
import { useState, useCallback } from 'react';
import { storyboardScriptApi } from '../../../../api';
import { useProjectStore, useAuthStore } from '../../../../stores';
import { ShotGroup, Shot, Frame, StoryboardScript } from '../types';

// 解析分镜脚本
const parseStoryboardScript = (content: string): ShotGroup[] => {
  if (!content) return [];
  
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);
  const groups: ShotGroup[] = [];
  
  let currentGroup: ShotGroup | null = null;
  let currentShot: Shot | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // 检测场景标题
    if (trimmed.startsWith('【场景') || trimmed.startsWith('【场次')) {
      if (currentGroup) groups.push(currentGroup);
      const nameMatch = trimmed.match(/【场景\s*(\d+)】|(【.+?】)/);
      const name = nameMatch ? nameMatch[1] || nameMatch[2]?.replace(/【|】/g, '') : `场景 ${groups.length + 1}`;
      currentGroup = { id: `group_${groups.length}`, name, shots: [] };
      continue;
    }
    
    // 检测分镜标题
    if (trimmed.match(/^#【Shot\s*\d+[-]?\d*】?/)) {
      if (!currentGroup) currentGroup = { id: `group_${groups.length}`, name: '场景 1', shots: [] };
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
      continue;
    }
    
    // 检测画面描述
    if (trimmed.startsWith('【Frame')) {
      if (currentShot) {
        const frameMatch = trimmed.match(/【Frame\s*(\d+)s?】?(.*)/);
        if (frameMatch) {
          currentShot.frames.push({
            id: `frame_${Date.now()}_${currentShot.frames.length}`,
            frameNumber: String(currentShot.frames.length + 1).padStart(2, '0'),
            time: `${frameMatch[1]}s`,
            scale: '中景',
            description: frameMatch[2]?.trim() || '',
          });
        }
      }
      continue;
    }
    
    if (currentShot) {
      currentShot.description += trimmed + '\n';
    }
  }
  
  if (currentGroup) groups.push(currentGroup);
  return groups;
};

// 创建新场景
const createNewGroup = (index: number): ShotGroup => ({
  id: `group_${Date.now()}`,
  name: `场景 ${index + 1}`,
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
});

// 主 Hook
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useStoryboardNode = (_nodeId: string, data: Record<string, unknown>, updateData: (key: string, value: unknown) => void) => {
  const { currentProjectId } = useProjectStore();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [currentShotId, setCurrentShotId] = useState<string | null>(null);

  // 获取数据
  const shotGroups = (data.shotGroups as ShotGroup[]) || [];
  const selectedEpisodeId = data.selectedEpisodeId as string | undefined;
  const existingStoryboard = data.existingStoryboard as StoryboardScript | undefined;

  // 加载已有分镜
  const loadStoryboard = useCallback(async (episodeId: number) => {
    if (!currentProjectId) return;
    setLoading(true);
    
    try {
      const resp = await storyboardScriptApi.getAll(undefined, currentProjectId);
      if (resp.code === 0 && resp.data) {
        const matched = resp.data.find((sb: StoryboardScript) => {
          if (sb.ext1) {
            try {
              const ext1Data = JSON.parse(sb.ext1);
              return ext1Data.episodeId === episodeId;
            } catch {}
          }
          if (sb.resourceName) {
            const match = sb.resourceName.match(/第(\d+)集分镜/);
            return match && parseInt(match[1]) === episodeId;
          }
          return false;
        });
        
        if (matched) {
          const content = matched.resourceContent || '';
          let parsedContent = content;
          try { parsedContent = JSON.parse(content).content || content; } catch {}
          
          const parsed = parseStoryboardScript(parsedContent);
          updateData('shotGroups', parsed);
          updateData('existingStoryboard', matched);
          
          if (parsed.length > 0) {
            setCurrentGroupId(parsed[0].id);
            if (parsed[0].shots.length > 0) {
              setCurrentShotId(parsed[0].shots[0].id);
            }
          }
        } else {
          updateData('shotGroups', []);
          updateData('existingStoryboard', null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [currentProjectId, updateData]);

  // 保存分镜
  const saveStoryboard = useCallback(async (episodeId: number, content?: string) => {
    if (!currentProjectId) return;
    
    const userId = user?.id || 1;
    const username = user?.username || 'system';
    const now = new Date().toISOString();
    
    // 序列化内容
    let scriptContent = content;
    if (!scriptContent) {
      scriptContent = '';
      shotGroups.forEach(group => {
        scriptContent += `#【Shot ${group.name}】\n`;
        group.shots.forEach(shot => {
          if (shot.frames?.length) {
            shot.frames.forEach(frame => {
              scriptContent += `【Frame ${frame.time}】【${frame.scale}】${frame.description}\n`;
            });
          } else {
            scriptContent += `【Frame 3s】【中景】${shot.description || ''}\n`;
          }
        });
      });
    }
    
    try {
      const existingId = existingStoryboard?.id;
      if (existingId) {
        await storyboardScriptApi.update(existingId, {
          resourceContent: JSON.stringify({ content: scriptContent }),
          updatedBy: username,
          updatedTime: now,
        });
      } else {
        const result = await storyboardScriptApi.create({
          resourceName: `第${episodeId}集分镜`,
          resourceType: 'storyboard_script',
          resourceContent: JSON.stringify({ content: scriptContent }),
          projectId: currentProjectId,
          userId,
          status: 1,
          createdBy: username,
          updatedBy: username,
          ext1: JSON.stringify({ episodeId, type: 'storyboard' }),
        });
        if (result.code === 0 && result.data) {
          updateData('existingStoryboard', { id: result.data.id });
        }
      }
    } catch (error) {
      console.error('保存失败:', error);
    }
  }, [currentProjectId, user, shotGroups, existingStoryboard, updateData]);

  // AI 生成 (需要后端 API 支持)
  const generateStoryboard = useCallback(async () => {
    // TODO: 实现 AI 生成分镜功能
    // 需要调用后端 API: vectorApi.analyzeScript
    console.warn('AI 生成功能需要配置后端 API');
    setGenerating(false);
  }, []);

  // 添加场景
  const addGroup = useCallback(() => {
    const newGroup = createNewGroup(shotGroups.length);
    updateData('shotGroups', [...shotGroups, newGroup]);
    setCurrentGroupId(newGroup.id);
    setCurrentShotId(newGroup.shots[0]?.id || null);
  }, [shotGroups, updateData]);

  // 删除场景
  const deleteGroup = useCallback((groupId: string) => {
    updateData('shotGroups', shotGroups.filter(g => g.id !== groupId));
    if (currentGroupId === groupId) {
      setCurrentGroupId(null);
      setCurrentShotId(null);
    }
  }, [shotGroups, currentGroupId, updateData]);

  // 添加 Shot
  const addShot = useCallback((groupId: string) => {
    const newShot: Shot = {
      id: `shot_${Date.now()}`,
      index: 0,
      shotNumber: 1,
      cameraWork: '',
      description: '',
      frames: [],
      prompt: '',
      status: 'pending',
    };
    
    updateData('shotGroups', shotGroups.map(g => {
      if (g.id !== groupId) return g;
      newShot.index = g.shots.length;
      newShot.shotNumber = g.shots.length + 1;
      return { ...g, shots: [...g.shots, newShot] };
    }));
    setCurrentGroupId(groupId);
    setCurrentShotId(newShot.id);
  }, [shotGroups, updateData]);

  // 删除 Shot
  const deleteShot = useCallback((groupId: string, shotId: string) => {
    updateData('shotGroups', shotGroups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        shots: g.shots.filter(s => s.id !== shotId).map((s, i) => ({ ...s, shotNumber: i + 1, index: i }))
      };
    }));
    if (currentShotId === shotId) setCurrentShotId(null);
  }, [shotGroups, currentShotId, updateData]);

  // 添加 Frame
  const addFrame = useCallback((groupId: string, shotId: string, afterFrameId?: string) => {
    const newFrame: Frame = {
      id: `frame_${Date.now()}`,
      frameNumber: '01',
      time: '3s',
      scale: '中景',
      description: '',
    };
    
    updateData('shotGroups', shotGroups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        shots: g.shots.map(s => {
          if (s.id !== shotId) return s;
          let frames = [...s.frames];
          if (afterFrameId) {
            const idx = frames.findIndex(f => f.id === afterFrameId);
            idx >= 0 ? frames.splice(idx + 1, 0, newFrame) : frames.push(newFrame);
          } else {
            frames.push(newFrame);
          }
          return { ...s, frames: frames.map((f, i) => ({ ...f, frameNumber: String(i + 1).padStart(2, '0') })) };
        }),
      };
    }));
  }, [shotGroups, updateData]);

  // 删除 Frame
  const deleteFrame = useCallback((groupId: string, shotId: string, frameId: string) => {
    updateData('shotGroups', shotGroups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        shots: g.shots.map(s => {
          if (s.id !== shotId) return s;
          return { ...s, frames: s.frames.filter(f => f.id !== frameId).map((f, i) => ({ ...f, frameNumber: String(i + 1).padStart(2, '0') })) };
        }),
      };
    }));
  }, [shotGroups, updateData]);

  // 更新 Frame
  const updateFrame = useCallback((groupId: string, shotId: string, frameId: string, field: keyof Frame, value: string) => {
    updateData('shotGroups', shotGroups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        shots: g.shots.map(s => {
          if (s.id !== shotId) return s;
          return { ...s, frames: s.frames.map(f => f.id === frameId ? { ...f, [field]: value } : f) };
        }),
      };
    }));
  }, [shotGroups, updateData]);

  // 更新 Shot
  const updateShot = useCallback((groupId: string, shotId: string, field: string, value: string) => {
    updateData('shotGroups', shotGroups.map(g => {
      if (g.id !== groupId) return g;
      return { ...g, shots: g.shots.map(s => s.id === shotId ? { ...s, [field]: value } : s) };
    }));
  }, [shotGroups, updateData]);

  // 更新场景
  const updateGroup = useCallback((groupId: string, name: string) => {
    updateData('shotGroups', shotGroups.map(g => g.id === groupId ? { ...g, name } : g));
  }, [shotGroups, updateData]);

  // 手动保存
  const handleSave = useCallback(async () => {
    if (!selectedEpisodeId || !currentProjectId || shotGroups.length === 0) return;
    setSaving(true);
    try {
      await saveStoryboard(parseInt(selectedEpisodeId));
    } finally {
      setSaving(false);
    }
  }, [selectedEpisodeId, currentProjectId, shotGroups.length, saveStoryboard]);

  return {
    // State
    loading,
    generating,
    saving,
    currentGroupId,
    currentShotId,
    setCurrentGroupId,
    setCurrentShotId,
    
    // Data
    shotGroups,
    selectedEpisodeId,
    
    // Actions
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
  };
};
