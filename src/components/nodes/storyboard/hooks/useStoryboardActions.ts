// src/components/nodes/storyboard/hooks/useStoryboardActions.ts - 故事板操作逻辑
import { useCallback } from 'react';
import { ShotGroup, Shot, Frame } from '../types';

// 添加新场景
export const useStoryboardActions = () => {
  const createNewGroup = useCallback((): ShotGroup => {
    return {
      id: `group_${Date.now()}`,
      name: `场景 ${Date.now() % 1000}`,
      shots: [createNewShot(0)],
    };
  }, []);

  const createNewShot = (index: number): Shot => {
    return {
      id: `shot_${Date.now()}`,
      index,
      shotNumber: index + 1,
      cameraWork: '',
      description: '',
      frames: [createNewFrame(0)],
      prompt: '',
      status: 'pending',
    };
  };

  const createNewFrame = (index: number): Frame => {
    return {
      id: `frame_${Date.now()}_${index}`,
      frameNumber: String(index + 1).padStart(2, '0'),
      time: '3s',
      scale: '中景',
      description: '',
    };
  };

  // 添加帧
  const addFrame = (
    groups: ShotGroup[],
    groupId: string,
    shotId: string,
    insertAfterFrameId?: string
  ): ShotGroup[] => {
    const newFrame = createNewFrame(0);
    
    return groups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        shots: g.shots.map(s => {
          if (s.id !== shotId) return s;
          
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
          newFrames = newFrames.map((f, i) => ({
            ...f,
            frameNumber: String(i + 1).padStart(2, '0'),
          }));
          
          return { ...s, frames: newFrames };
        }),
      };
    });
  };

  // 删除帧
  const deleteFrame = (
    groups: ShotGroup[],
    groupId: string,
    shotId: string,
    frameId: string
  ): ShotGroup[] => {
    return groups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        shots: g.shots.map(s => {
          if (s.id !== shotId) return s;
          const newFrames = s.frames
            .filter(f => f.id !== frameId)
            .map((f, i) => ({
              ...f,
              frameNumber: String(i + 1).padStart(2, '0'),
            }));
          return { ...s, frames: newFrames };
        }),
      };
    });
  };

  // 更新帧
  const updateFrame = (
    groups: ShotGroup[],
    groupId: string,
    shotId: string,
    frameId: string,
    field: keyof Frame,
    value: string
  ): ShotGroup[] => {
    return groups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        shots: g.shots.map(s => {
          if (s.id !== shotId) return s;
          const newFrames = s.frames.map(f =>
            f.id === frameId ? { ...f, [field]: value } : f
          );
          return { ...s, frames: newFrames };
        }),
      };
    });
  };

  // 添加 Shot
  const addShot = (groups: ShotGroup[], groupId: string): ShotGroup[] => {
    return groups.map(g => {
      if (g.id !== groupId) return g;
      const newShot = createNewShot(g.shots.length);
      return { ...g, shots: [...g.shots, newShot] };
    });
  };

  // 删除 Shot
  const deleteShot = (groups: ShotGroup[], groupId: string, shotId: string): ShotGroup[] => {
    return groups.map(g => {
      if (g.id !== groupId) return g;
      const newShots = g.shots
        .filter(s => s.id !== shotId)
        .map((s, i) => ({ ...s, shotNumber: i + 1, index: i }));
      return { ...g, shots: newShots };
    });
  };

  // 更新 Shot
  const updateShot = (
    groups: ShotGroup[],
    groupId: string,
    shotId: string,
    field: string,
    value: string
  ): ShotGroup[] => {
    return groups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        shots: g.shots.map(s =>
          s.id === shotId ? { ...s, [field]: value } : s
        ),
      };
    });
  };

  // 添加场景
  const addGroup = (groups: ShotGroup[]): ShotGroup[] => {
    return [...groups, createNewGroup()];
  };

  // 删除场景
  const deleteGroup = (groups: ShotGroup[], groupId: string): ShotGroup[] => {
    return groups.filter(g => g.id !== groupId);
  };

  // 更新场景名称
  const updateGroupName = (
    groups: ShotGroup[],
    groupId: string,
    name: string
  ): ShotGroup[] => {
    return groups.map(g =>
      g.id === groupId ? { ...g, name } : g
    );
  };

  // 序列化保存
  const serializeStoryboard = (groups: ShotGroup[]): string => {
    let content = '';
    groups.forEach(group => {
      content += `#【Shot ${group.name}】\n`;
      group.shots.forEach(shot => {
        if (shot.frames && shot.frames.length > 0) {
          shot.frames.forEach(frame => {
            content += `【Frame ${frame.time}】【${frame.scale}】${frame.description}\n`;
          });
        } else {
          content += `【Frame 3s】【中景】${shot.description || ''}\n`;
        }
      });
    });
    return content;
  };

  return {
    createNewGroup,
    createNewShot,
    createNewFrame,
    addFrame,
    deleteFrame,
    updateFrame,
    addShot,
    deleteShot,
    updateShot,
    addGroup,
    deleteGroup,
    updateGroupName,
    serializeStoryboard,
  };
};
