// Canvas Node Defaults - 节点默认配置
import type { NodeType, CanvasNode } from './canvasTypes';

export const nodeDefaults: Record<NodeType, Partial<CanvasNode>> = {
  textNode: { type: 'textNode', data: { label: 'Text', content: '' } },
  novelInput: { type: 'novelInput', data: { label: 'Novel Input', content: '' } },
  characterDescription: { type: 'characterDescription', data: { label: 'Character Description' } },
  sceneDescription: { type: 'sceneDescription', data: { label: 'Scene Description' } },
  generateCharacterVideo: { type: 'generateCharacterVideo', data: { label: 'Generate Character Video', prompt: '' } },
  generateSceneVideo: { type: 'generateSceneVideo', data: { label: 'Generate Scene Video', prompt: '' } },
  createCharacter: { type: 'createCharacter', data: { label: 'Create Character' } },
  createScene: { type: 'createScene', data: { label: 'Create Scene' } },
  videoAnalyze: { type: 'videoAnalyze', data: { label: 'Video Analyze' } },
  storyboardNode: { type: 'storyboardNode', data: { label: 'Storyboard', shots: [] } },
  aiVideo: { type: 'aiVideo', data: { label: 'AI Video', prompt: '', modelId: '' } },
  imageCompare: { type: 'imageCompare', data: { label: 'Image Compare', imageA: '', imageB: '' } },
  imageNode: { 
    type: 'imageNode', 
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
    data: { 
      label: 'Video', 
      videoUrl: '',
      prompt: '',
      status: 'idle'
    } 
  },
  createAsset: {
    type: 'createAsset',
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
  aiImage: { type: 'aiImage', data: { label: 'AI Image', prompt: '', modelId: '' } },
  generateCharacterImage: { type: 'generateCharacterImage', data: { label: 'Generate Character Image', prompt: '' } },
  generateSceneImage: { type: 'generateSceneImage', data: { label: 'Generate Scene Image', prompt: '' } },
  saveLocal: { type: 'saveLocal', data: { label: 'Save Local' } },
  promptNode: { type: 'promptNode', data: { label: 'Prompt' } },
  runninghub: { type: 'runninghub', data: { label: 'RunningHub' } },
};

let nodeIdCounter = 0;
export const generateNodeId = () => `node_${++nodeIdCounter}`;
