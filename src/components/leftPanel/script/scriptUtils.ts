/**
 * 剧本工具函数 - 前端实现
 */

export interface Episode {
  id: number;
  title: string;
  content: string;
  resourceName: string;
}

/**
 * 将剧本内容按集数分割
 * 支持的格式：第1集、第1幕、第1章 等
 */
export function splitScriptIntoEpisodes(content: string): Episode[] {
  const episodes: Episode[] = [];
  const episodePattern = /(?:^|\n)(第[一二三四五六七八九十百千0-9]+(?:集|幕|章|部|场)\s*[：:]*)/gi;
  const parts = content.split(episodePattern);
  
  if (parts.length <= 1) {
    return [{ id: 1, title: '第1集', content: content.trim(), resourceName: '第1集' }];
  }
  
  let currentIndex = 0;
  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i]?.trim() || `第${currentIndex + 1}集`;
    const episodeContent = parts[i + 1]?.trim() || '';
    const cleanTitle = title.replace(/[：:]*\s*$/, '');
    
    if (episodeContent || cleanTitle) {
      episodes.push({
        id: currentIndex + 1,
        title: cleanTitle,
        content: episodeContent,
        resourceName: cleanTitle
      });
      currentIndex++;
    }
  }
  
  return episodes.length > 0 ? episodes : 
    [{ id: 1, title: '第1集', content: content.trim(), resourceName: '第1集' }];
}

/**
 * 智能分集 - 基于内容长度均匀分割
 */
export function splitScriptByLength(content: string, episodeCount: number = 2): Episode[] {
  const totalLength = content.length;
  const episodeLength = Math.ceil(totalLength / episodeCount);
  const episodes: Episode[] = [];
  
  for (let i = 0; i < episodeCount; i++) {
    const start = i * episodeLength;
    const end = Math.min(start + episodeLength, totalLength);
    let episodeContent = content.slice(start, end);
    
    if (end < totalLength) {
      const lastNewline = episodeContent.lastIndexOf('\n');
      if (lastNewline > episodeLength * 0.8) {
        episodeContent = content.slice(start, start + lastNewline);
      }
    }
    
    episodes.push({
      id: i + 1,
      title: `第${i + 1}集`,
      content: episodeContent.trim(),
      resourceName: `第${i + 1}集`
    });
  }
  
  return episodes;
}
