import React from 'react';
import {
  Image,
  Video,
  Wand2,
  Film,
  Eye,
  HardDrive,
  FileText,
  BookOpen,
  Users,
  Mountain,
  Sparkles,
  Clapperboard,
  GitCompare,
  History,
} from 'lucide-react';
import type { NodeType } from '../../stores/canvasStore';

// 支持执行的节点类型
export const generationNodeTypes: NodeType[] = [
  'imageNode',
  'videoNode',
  'promptNode',
  'runninghub',
];

// 节点图标映射
export const nodeIcons: Record<NodeType, React.ReactNode> = {
  textNode: <FileText className="w-4 h-4" />,
  novelInput: <BookOpen className="w-4 h-4" />,
  characterDescription: <Users className="w-4 h-4" />,
  sceneDescription: <Mountain className="w-4 h-4" />,
  generateCharacterVideo: <Users className="w-4 h-4" />,
  generateSceneVideo: <Mountain className="w-4 h-4" />,
  createCharacter: <Users className="w-4 h-4" />,
  createScene: <Mountain className="w-4 h-4" />,
  videoAnalyze: <Sparkles className="w-4 h-4" />,
  storyboardNode: <Clapperboard className="w-4 h-4" />,
  aiVideo: <Film className="w-4 h-4" />,
  imageCompare: <GitCompare className="w-4 h-4" />,
  saveLocal: <HardDrive className="w-4 h-4" />,
  imageNode: <Image className="w-4 h-4" />,
  videoNode: <Film className="w-4 h-4" />,
  aiImage: <Wand2 className="w-4 h-4" />,
  createAsset: <Image className="w-4 h-4" />,
  generateCharacterImage: <Wand2 className="w-4 h-4" />,
  generateSceneImage: <Wand2 className="w-4 h-4" />,
  promptNode: <Wand2 className="w-4 h-4" />,
  runninghub: <Sparkles className="w-4 h-4" />,
  historyNode: <History className="w-4 h-4" />,
};

// 节点颜色映射
export const nodeColors: Record<string, string> = {
  textNode: 'border-gray-500 bg-gray-500/10',
  novelInput: 'border-amber-500 bg-amber-500/10',
  characterDescription: 'border-green-500 bg-green-500/10',
  sceneDescription: 'border-emerald-500 bg-emerald-500/10',
  generateCharacterVideo: 'border-green-300 bg-green-300/10',
  generateSceneVideo: 'border-emerald-300 bg-emerald-300/10',
  createCharacter: 'border-teal-500 bg-teal-500/10',
  createScene: 'border-teal-400 bg-teal-400/10',
  videoAnalyze: 'border-violet-500 bg-violet-500/10',
  storyboardNode: 'border-orange-500 bg-orange-500/10',
  aiVideo: 'border-red-500 bg-red-500/10',
  imageCompare: 'border-cyan-500 bg-cyan-500/10',
  saveLocal: 'border-yellow-500 bg-yellow-500/10',
  imageNode: 'border-pink-400 bg-pink-400/10',
  videoNode: 'border-red-400 bg-red-400/10',
  aiImage: 'border-blue-500 bg-blue-500/10',
  createAsset: 'border-teal-500 bg-teal-500/10',
  generateCharacterImage: 'border-pink-300 bg-pink-300/10',
  generateSceneImage: 'border-pink-300 bg-pink-300/10',
  promptNode: 'border-pink-500 bg-pink-500/10',
  runninghub: 'border-indigo-500 bg-indigo-500/10',
  historyNode: 'border-purple-500 bg-purple-500/10',
};

// 资产类型选项
export const assetTypeOptions = [
  { key: 'character_primary', label: '主要角色' },
  { key: 'scene_primary', label: '主要场景' },
  { key: 'prop_primary', label: '主要道具' },
  { key: 'character_secondary', label: '次要角色' },
  { key: 'scene_secondary', label: '次要场景' },
  { key: 'prop_secondary', label: '次要道具' },
];

// 宽高比选项
export const aspectRatioOptions = [
  { value: '1:1', label: '1:1' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
];

// 分辨率选项
export const resolutionOptions = [
  { value: '1K', label: '1K' },
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
];
