// Canvas Node Defaults - 节点默认配置
import type { NodeType, CanvasNode } from './canvasTypes';

export const nodeDefaults: Record<NodeType, Partial<CanvasNode>> = {
  textNode: { type: 'textNode', width: 200, height: 80, data: { label: 'Text', content: '' } },
  novelInput: { type: 'novelInput', width: 200, height: 120, data: { label: 'Novel Input', content: '' } },
  characterDescription: { type: 'characterDescription', width: 200, height: 100, data: { label: 'Character Description' } },
  sceneDescription: { type: 'sceneDescription', width: 200, height: 100, data: { label: 'Scene Description' } },
  generateCharacterVideo: { type: 'generateCharacterVideo', width: 200, height: 120, data: { label: 'Generate Character Video', prompt: '' } },
  generateSceneVideo: { type: 'generateSceneVideo', width: 200, height: 120, data: { label: 'Generate Scene Video', prompt: '' } },
  createCharacter: { type: 'createCharacter', width: 200, height: 100, data: { label: 'Create Character' } },
  createScene: { type: 'createScene', width: 200, height: 100, data: { label: 'Create Scene' } },
  videoAnalyze: { type: 'videoAnalyze', width: 200, height: 100, data: { label: 'Video Analyze' } },
  storyboardNode: { type: 'storyboardNode', width: 520, height: 620, data: { label: 'Storyboard', shots: [] } },
  aiVideo: { type: 'aiVideo', width: 200, height: 120, data: { label: 'AI Video', prompt: '', modelId: '' } },
  imageCompare: { type: 'imageCompare', width: 200, height: 120, data: { label: 'Image Compare', imageA: '', imageB: '' } },
  imageNode: { 
    type: 'imageNode', 
    width: 200, height: 120,
    data: { 
      label: 'Image', 
      imageUrl: '',
      prompt: '',
      aspectRatio: '1:1',
      resolution: '1K',
      status: 'idle'
    } 
  },
  videoNode: { 
    type: 'videoNode', 
    width: 200, height: 140,
    data: { 
      label: 'Video', 
      videoUrl: '',
      prompt: '',
      status: 'idle'
    } 
  },
  createAsset: {
    type: 'createAsset',
    width: 200, height: 160,
    data: {
      label: 'Create Asset',
      name: '',
      assetType: 'character_primary',
      isVariant: false,
      parentAssetId: null,
      description: '',
      imageUrl: '',
      status: 'idle'
    }
  },
  aiImage: { type: 'aiImage', width: 200, height: 120, data: { label: 'AI Image', prompt: '', modelId: '' } },
  generateCharacterImage: { type: 'generateCharacterImage', width: 200, height: 120, data: { label: 'Generate Character Image', prompt: '' } },
  generateSceneImage: { type: 'generateSceneImage', width: 200, height: 120, data: { label: 'Generate Scene Image', prompt: '' } },
  saveLocal: { type: 'saveLocal', width: 180, height: 80, data: { label: 'Save Local' } },
  promptNode: { type: 'promptNode', width: 200, height: 100, data: { label: 'Prompt' } },
  historyNode: { type: 'historyNode', width: 220, height: 140, data: { label: 'History', status: 'idle' } },
  runninghub: { type: 'runninghub', width: 200, height: 120, data: { label: 'RunningHub' } },
};

let nodeIdCounter = 0;
export const generateNodeId = () => `node_${++nodeIdCounter}`;

// 设置节点 ID 计数器（用于从存储恢复时避免 ID 冲突）
export const setNodeIdCounter = (maxId: number) => {
  nodeIdCounter = maxId;
};

// 获取当前节点 ID 计数器
export const getNodeIdCounter = () => nodeIdCounter;
