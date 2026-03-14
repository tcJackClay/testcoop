// src/components/nodes/storyboard/hooks/useStoryboardParse.ts - 故事板解析逻辑
import { ShotGroup, Shot, Frame } from '../types';

// 从描述中提取 Frame 信息
export const extractFrames = (description: string): Array<{ time: string; desc: string }> => {
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

// 解析分镜脚本为 ShotGroup[]
export const parseStoryboardScript = (content: string): ShotGroup[] => {
  if (!content) return [];
  
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);
  const groups: ShotGroup[] = [];
  
  let currentGroup: ShotGroup | null = null;
  let currentShot: Shot | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // 跳过空行
    if (!trimmed) continue;
    
    // 检测场景标题: 【场景 1】或【场景描述】
    if (trimmed.startsWith('【场景') || trimmed.startsWith('【场次')) {
      if (currentGroup && groups.indexOf(currentGroup) === -1) {
        groups.push(currentGroup);
      }
      const nameMatch = trimmed.match(/【场景\s*(\d+)】|(【.+?】)/);
      const name = nameMatch ? nameMatch[1] || nameMatch[2]?.replace(/【|】/g, '') : `场景 ${groups.length + 1}`;
      currentGroup = {
        id: `group_${groups.length}`,
        name,
        shots: []
      };
      continue;
    }
    
    // 检测分镜编号作为标题
    if (trimmed.match(/^#【Shot\s*\d+[-]?\d*】?/)) {
      if (!currentGroup) {
        currentGroup = { id: `group_${groups.length}`, name: '场景 1', shots: [] };
      }
      
      const shotMatch = trimmed.match(/Shot\s*(\d+)[-](\d+)/);
      
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
      continue;
    }
    
    // 检测画面描述
    if (trimmed.startsWith('画面描述：') || trimmed.startsWith('【Frame')) {
      if (currentShot) {
        const frameMatch = trimmed.match(/【Frame\s*(\d+)s?】?(.*)/);
        if (frameMatch) {
          const frameNum = frameMatch[1];
          const frameDesc = frameMatch[2]?.trim() || '';
          currentShot.description += `[${frameNum}s] ` + frameDesc + '\n';
        } else {
          currentShot.description += trimmed.replace('画面描述：', '') + '\n';
        }
      }
      continue;
    }
    
    // 如果不是特殊行，作为普通描述处理
    if (currentShot && trimmed.length > 0) {
      currentShot.description += trimmed + '\n';
    }
  }
  
  // 添加最后一个组
  if (currentGroup) {
    groups.push(currentGroup);
  }
  
  return groups;
};
