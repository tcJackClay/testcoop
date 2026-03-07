import { useRef, useState, useCallback, useEffect } from 'react';
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
  Upload
} from 'lucide-react';
import type { CanvasNode, NodeType } from '../../stores/canvasStore';
import { useCanvasStore } from '../../stores/canvasStore';

const nodeIcons: Record<NodeType, React.ReactNode> = {
  imageInput: <Image className="w-4 h-4" />,
  videoInput: <Video className="w-4 h-4" />,
  textNode: <FileText className="w-4 h-4" />,
  novelInput: <BookOpen className="w-4 h-4" />,
  characterDescription: <Users className="w-4 h-4" />,
  sceneDescription: <Mountain className="w-4 h-4" />,
  generateCharacterImage: <Users className="w-4 h-4" />,
  generateSceneImage: <Mountain className="w-4 h-4" />,
  generateCharacterVideo: <Users className="w-4 h-4" />,
  generateSceneVideo: <Mountain className="w-4 h-4" />,
  createCharacter: <Users className="w-4 h-4" />,
  createScene: <Mountain className="w-4 h-4" />,
  videoAnalyze: <Sparkles className="w-4 h-4" />,
  storyboardNode: <Clapperboard className="w-4 h-4" />,
  aiImage: <Wand2 className="w-4 h-4" />,
  aiVideo: <Film className="w-4 h-4" />,
  imageCompare: <GitCompare className="w-4 h-4" />,
  preview: <Eye className="w-4 h-4" />,
  saveLocal: <HardDrive className="w-4 h-4" />,
};

const nodeColors: Record<string, string> = {
  imageInput: 'border-blue-500 bg-blue-500/10',
  videoInput: 'border-purple-500 bg-purple-500/10',
  textNode: 'border-gray-500 bg-gray-500/10',
  novelInput: 'border-amber-500 bg-amber-500/10',
  characterDescription: 'border-green-500 bg-green-500/10',
  sceneDescription: 'border-emerald-500 bg-emerald-500/10',
  generateCharacterImage: 'border-green-400 bg-green-400/10',
  generateSceneImage: 'border-emerald-400 bg-emerald-400/10',
  generateCharacterVideo: 'border-green-300 bg-green-300/10',
  generateSceneVideo: 'border-emerald-300 bg-emerald-300/10',
  createCharacter: 'border-teal-500 bg-teal-500/10',
  createScene: 'border-teal-400 bg-teal-400/10',
  videoAnalyze: 'border-violet-500 bg-violet-500/10',
  storyboardNode: 'border-orange-500 bg-orange-500/10',
  aiImage: 'border-pink-500 bg-pink-500/10',
  aiVideo: 'border-red-500 bg-red-500/10',
  imageCompare: 'border-cyan-500 bg-cyan-500/10',
  preview: 'border-indigo-500 bg-indigo-500/10',
  saveLocal: 'border-yellow-500 bg-yellow-500/10',
};

interface NodeRendererProps {
  node: CanvasNode;
}

function updateNodeData(id: string, key: string, value: unknown) {
  const node = useCanvasStore.getState().nodes.find(n => n.id === id);
  if (node) {
    useCanvasStore.getState().updateNode(id, {
      data: { ...node.data, [key]: value },
    });
  }
}

function renderNodeBody(node: CanvasNode) {
  const updateData = (key: string, value: unknown) => updateNodeData(node.id, key, value);
  
  switch (node.type) {
    case 'textNode':
    case 'novelInput':
      return (
        <textarea
          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white resize-none"
          rows={2}
          placeholder="Enter text..."
          value={(node.data.content as string) || ''}
          onChange={(e) => updateData('content', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      );
    
    case 'imageInput':
    case 'videoInput':
      return (
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
            placeholder={node.type === 'imageInput' ? 'Image URL...' : 'Video URL...'}
            value={(node.data.imageUrl || node.data.videoUrl || '') as string}
            onChange={(e) => updateData(node.type === 'imageInput' ? 'imageUrl' : 'videoUrl', e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <button 
            className="p-1 bg-gray-600 hover:bg-gray-500 rounded"
            onClick={(e) => e.stopPropagation()}
            title="Upload"
          >
            <Upload className="w-3 h-3" />
          </button>
        </div>
      );
    
    case 'aiImage':
    case 'aiVideo':
    case 'generateCharacterImage':
    case 'generateSceneImage':
    case 'generateCharacterVideo':
    case 'generateSceneVideo':
      return (
        <input
          type="text"
          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
          placeholder="Enter prompt..."
          value={(node.data.prompt as string) || ''}
          onChange={(e) => updateData('prompt', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      );
    
    case 'characterDescription':
    case 'sceneDescription':
    case 'createCharacter':
    case 'createScene':
      return (
        <div className="text-xs text-gray-400">
          {(node.data.description as string) || 'Click to edit...'}
        </div>
      );
    
    case 'videoAnalyze':
      return (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Sparkles className="w-3 h-3" />
          <span>Analyze video content</span>
        </div>
      );
    
    case 'storyboardNode':
      return (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clapperboard className="w-3 h-3" />
          <span>{((node.data.shots as string[]) || []).length || 0} shots</span>
        </div>
      );
    
    case 'imageCompare':
      return (
        <div className="flex gap-1">
          <div className="w-14 h-12 bg-gray-700 rounded flex items-center justify-center">
            <Image className="w-4 h-4 text-gray-500" />
          </div>
          <div className="w-14 h-12 bg-gray-700 rounded flex items-center justify-center">
            <Image className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      );
    
    case 'preview':
      return (
        <div className="w-32 h-20 bg-gray-700 rounded flex items-center justify-center">
          <Play className="w-8 h-8 text-gray-500" />
        </div>
      );
    
    case 'saveLocal':
      return (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Save className="w-3 h-3" />
          <span>{node.data.autoSave ? 'Auto-save enabled' : 'Manual save'}</span>
        </div>
      );
    
    default:
      return null;
  }
}

export default function NodeRenderer({ node }: NodeRendererProps) {
  const { selectNode, moveNode, selectedNodeIds, viewPort } = useCanvasStore();
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isSelected = selectedNodeIds.includes(node.id);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start drag if clicking on input or textarea
    if ((e.target as HTMLElement).tagName === 'INPUT' || 
        (e.target as HTMLElement).tagName === 'TEXTAREA') {
      return;
    }
    
    e.stopPropagation();
    setIsDragging(true);
    
    // Get the canvas container
    const canvasContainer = document.querySelector('.canvas-content') as HTMLElement;
    if (canvasContainer) {
      const rect = canvasContainer.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - viewPort.x) / viewPort.zoom;
      const mouseY = (e.clientY - rect.top - viewPort.y) / viewPort.zoom;
      dragOffset.current = {
        x: mouseX - node.position.x,
        y: mouseY - node.position.y,
      };
    }
    
    selectNode(node.id, e.shiftKey);
  }, [node.position, node.id, selectNode, viewPort]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const canvasContainer = document.querySelector('.canvas-content') as HTMLElement;
    if (canvasContainer) {
      const rect = canvasContainer.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - viewPort.x) / viewPort.zoom;
      const mouseY = (e.clientY - rect.top - viewPort.y) / viewPort.zoom;
      const newX = mouseX - dragOffset.current.x;
      const newY = mouseY - dragOffset.current.y;
      moveNode(node.id, { x: newX, y: newY });
    }
  }, [isDragging, node.id, moveNode, viewPort]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const icon = nodeIcons[node.type] || <Wand2 className="w-4 h-4" />;
  const label = (node.data.label as string) || node.type;
  const colorClass = nodeColors[node.type] || 'border-gray-500 bg-gray-500/10';

  return (
    <div
      ref={containerRef}
      className={`node absolute min-w-[180px] cursor-move select-none rounded-lg border-2 ${colorClass} ${
        isSelected ? 'ring-2 ring-white/50' : ''
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
        <GripVertical className="w-3 h-3 text-gray-500" />
        <span className="text-gray-400">{icon}</span>
        <span className="text-sm font-medium truncate">{label}</span>
      </div>

      {/* Body */}
      <div className="p-3">
        {renderNodeBody(node)}
      </div>

      {/* Handles */}
      <div 
        className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-600 rounded-full border-2 border-gray-400 hover:bg-blue-500 hover:border-blue-400 cursor-crosshair"
        data-handle="source"
      />
      <div 
        className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-600 rounded-full border-2 border-gray-400 hover:bg-blue-500 hover:border-blue-400 cursor-crosshair"
        data-handle="target"
      />
    </div>
  );
}
