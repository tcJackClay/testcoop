import React from 'react';
import {
  Image, 
  Video, 
  Wand2, 
  Film, 
  Eye, 
  HardDrive,
  GripVertical,
  FileText,
  BookOpen,
  Users,
  Mountain,
  Sparkles,
  Clapperboard,
  GitCompare,
  Play,
  Save,
  Upload,
  X,
  Loader2
} from 'lucide-react';
import type { NodeType } from '../../stores/canvasStore';

// Node type icons
export const nodeIcons: Record<NodeType, React.ReactNode> = {
  videoInput: <Video className="w-4 h-4" />,
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
  preview: <Eye className="w-4 h-4" />,
  imageInput: <Image className="w-4 h-4" />,
};

// Node type colors
export const nodeColors: Record<string, string> = {
  videoInput: 'border-purple-500 bg-purple-500/10',
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
  preview: 'border-indigo-500 bg-indigo-500/10',
  imageInput: 'border-pink-500 bg-pink-500/10',
};
