/**
 * Script Analysis Transformer Functions
 * 参考 huanu-workbench-frontend 实现
 */

import { ScriptAnalysisResult, CharacterBio, Relationship } from '../../../types/scriptAnalysis';

// ============================================
// JSON 清理和修复
// ============================================

/**
 * 清理 JSON 字符串
 */
export const cleanJsonString = (raw: string): string => {
  let cleaned = raw.trim();
  
  // 去除开头/结尾的反引号
  cleaned = cleaned.replace(/^`+/, '').replace(/`+$/, '');
  
  // 去除结尾残片
  cleaned = cleaned.replace(/[,\s]*`+$/, '');
  
  // 去除 markdown 代码块标记
  cleaned = cleaned.replace(/^```(?:json)?/, '').replace(/```$/, '');
  
  // 再次trim
  cleaned = cleaned.trim();
  
  // 处理转义字符
  cleaned = cleaned.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
  
  // 去除控制字符
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return cleaned.trim();
};

/**
 * 尝试修复不完整的 JSON
 */
export const tryFixIncompleteJson = (jsonStr: string): any => {
  let cleaned = cleanJsonString(jsonStr);
  
  // 尝试直接解析
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // continue
  }
  
  // 方法1: 找到最外层闭合的位置
  let lastEnd = -1;
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const prevChar = i > 0 ? cleaned[i - 1] : '';
    
    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
      continue;
    }
    
    if (inString && char === stringChar && prevChar !== '\\') {
      inString = false;
      stringChar = '';
      continue;
    }
    
    if (inString) continue;
    
    if (char === '{') braceCount++;
    else if (char === '}') braceCount--;
    else if (char === '[') bracketCount++;
    else if (char === ']') bracketCount--;
    
    if (braceCount === 0 && bracketCount === 0 && i > 10) {
      lastEnd = i;
    }
  }
  
  if (lastEnd > 1000) {
    const truncated = cleaned.substring(0, lastEnd + 1);
    try {
      return JSON.parse(truncated);
    } catch (e) {
      // continue
    }
  }
  
  // 方法2: 暴力修复
  let openBraces = (cleaned.match(/\{/g) || []).length;
  let closeBraces = (cleaned.match(/\}/g) || []).length;
  let openBrackets = (cleaned.match(/\[/g) || []).length;
  let closeBrackets = (cleaned.match(/\]/g) || []).length;
  
  let fixed = cleaned;
  for (let i = 0; i < openBraces - closeBraces; i++) fixed += '}';
  for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += ']';
  
  try {
    return JSON.parse(fixed);
  } catch (e) {
    // all methods failed
  }
  
  throw new Error('无法解析JSON');
};

// ============================================
// 资产提取响应转换 (type=1)
// ============================================

/**
 * 解析器1: 资产提取 (type=1)
 */
export const transformAssetResponse = (raw: any, currentProjectId: number): ScriptAnalysisResult => {
  // 提取数组字段，支持多种嵌套格式
  const extractArrayField = (obj: any, ...fieldNames: string[]): any[] => {
    const extractAllValues = (item: any): any[] => {
      if (!item) return [];
      if (Array.isArray(item)) {
        return item.flatMap(v => extractAllValues(v));
      }
      if (typeof item === 'object') {
        const values = Object.values(item);
        const arrays = values.filter(v => Array.isArray(v));
        if (arrays.length > 0) {
          return arrays.flatMap(v => extractAllValues(v));
        }
        const allObjects = values.every(v => v === null || typeof v === 'object');
        if (allObjects && values.length > 0) {
          return values.flatMap(v => extractAllValues(v));
        }
        return [item];
      }
      return [];
    };

    for (const name of fieldNames) {
      if (obj && typeof obj === 'object') {
        const value = obj[name];
        if (Array.isArray(value)) return value;
        if (value && typeof value === 'object') {
          if (Array.isArray(value.primary)) return value.primary;
          if (Array.isArray(value.主要)) return value.主要;
          if (Array.isArray(value.次要)) return value.次要;
          if (Array.isArray(value.secondary)) return value.secondary;
        }
      }
    }

    if (obj && typeof obj === 'object') {
      return extractAllValues(obj);
    }

    return [];
  };

  // 处理资产结构，保留primary/secondary信息
  const transformAssets = (assets: any) => {
    if (!assets) return { characters: [], scenes: [], props: [] };
    
    const extractPrimary = (data: any): any[] => {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (data.primary && Array.isArray(data.primary)) return data.primary;
      if (data.主要 && Array.isArray(data.主要)) return data.主要;
      if (data.main && Array.isArray(data.main)) return data.main;
      if (data.characters && Array.isArray(data.characters)) return data.characters;
      return [];
    };
    
    const extractSecondary = (data: any): any[] => {
      if (!data) return [];
      if (Array.isArray(data)) return [];
      if (data.secondary && Array.isArray(data.secondary)) return data.secondary;
      if (data.次要 && Array.isArray(data.次要)) return data.次要;
      if (data.characters_secondary && Array.isArray(data.characters_secondary)) return data.characters_secondary;
      return [];
    };
    
    return {
      characters: extractPrimary(assets.characters),
      scenes: extractPrimary(assets.scenes),
      props: extractPrimary(assets.props),
      secondaryCharacters: extractSecondary(assets.characters),
      secondaryScenes: extractSecondary(assets.scenes),
      secondaryProps: extractSecondary(assets.props)
    };
  };

  return {
    id: raw.id || `analysis_${Date.now()}`,
    projectId: raw.projectId || `project_${currentProjectId}`,
    assets: transformAssets(raw.assets),
  } as ScriptAnalysisResult;
};

// ============================================
// 剧本分析响应转换 (type=2)
// ============================================

/**
 * 解析器2: 剧本智能分析 (type=2)
 */
export const transformAnalysisResponse = (raw: any): ScriptAnalysisResult => {
  // 递归提取数组字段
  const extractArrayField = (obj: any, ...fieldNames: string[]): any[] => {
    const extractAllValues = (item: any): any[] => {
      if (!item) return [];
      if (Array.isArray(item)) {
        return item.flatMap(v => extractAllValues(v));
      }
      if (typeof item === 'object') {
        const values = Object.values(item);
        const arrays = values.filter(v => Array.isArray(v));
        if (arrays.length > 0) {
          return arrays.flatMap(v => extractAllValues(v));
        }
        const allObjects = values.every(v => v === null || typeof v === 'object');
        if (allObjects && values.length > 0) {
          return values.flatMap(v => extractAllValues(v));
        }
        return [item];
      }
      return [];
    };

    for (const name of fieldNames) {
      if (obj && typeof obj === 'object') {
        const value = obj[name];
        if (Array.isArray(value)) return value;
      }
    }

    if (obj && typeof obj === 'object') {
      return extractAllValues(obj);
    }
    return [];
  };

  // 提取大纲
  const extractOutline = (data: any): any => {
    if (!data) return null;
    let summary = '';
    let chapters: any[] = [];
    const outlineData = data.storyOutline || data.story_outline || data.大纲 || data.outline || data;
    if (typeof outlineData === 'string') {
      summary = outlineData;
    } else if (typeof outlineData === 'object') {
      summary = outlineData.summary || outlineData.概要 || '';
      chapters = extractArrayField(outlineData, 'chapters', '章节', 'chapter', 'sections');
    }
    return {
      title: data.title || data.标题 || '',
      genre: data.genre || data.类型 || '',
      summary,
      chapters
    };
  };

  // 提取人物小传
  const extractCharacterBios = (data: any): CharacterBio[] => {
    return extractArrayField(
      data,
      'characterBios', 'character_bios', '人物小传', '人物', 'characters', 'bios'
    ).map((char: any) => ({
      name: char.name || char.姓名 || char.名称 || '',
      age: char.age || char.年龄 || '',
      background: char.background || char.背景 || char.人物简介 || '',
      personality: char.personality || char.性格 || '',
      appearance: char.appearance || char.外貌 || char.外形 || '',
      role: char.role || char.角色 || char.定位 || ''
    }));
  };

  // 提取人物关系
  const extractRelationships = (data: any): Relationship[] => {
    return extractArrayField(
      data,
      'relationships', 'relationships', '人物关系', '关系', 'relations'
    ).map((rel: any) => ({
      from: rel.from || rel.人物A || '',
      to: rel.to || rel.人物B || '',
      type: rel.type || rel.关系类型 || '',
      description: rel.description || rel.描述 || rel.说明 || ''
    }));
  };

  // 提取资产
  let assets = null;
  if (raw.assets) {
    assets = transformAssetResponse(raw, 0).assets;
  }

  return {
    id: raw.id || `analysis_${Date.now()}`,
    projectId: raw.projectId || 'project_default',
    assets,
    storyOutline: extractOutline(raw),
    characterBios: extractCharacterBios(raw),
    relationships: extractRelationships(raw),
  } as ScriptAnalysisResult;
};
