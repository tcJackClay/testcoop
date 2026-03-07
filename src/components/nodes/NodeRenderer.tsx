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
  Upload,
  X,
  Loader2
} from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';

// Generation node types that support execution
const generationNodeTypes = [
  'imageNode',
  'videoNode'
];

const nodeIcons: Record<NodeType, React.ReactNode> = {
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
};

const nodeColors: Record<string, string> = {
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
    
    case 'aiVideo':
    case 'generateCharacterVideo':
    case 'generateSceneVideo':
    case 'generateCharacterVideo':
    case 'generateSceneVideo':
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
    
    case 'imageNode': {
      const imageUrl = node.data.imageUrl as string;
      const prompt = node.data.prompt as string || '';
      const status = node.data.status as string || 'idle';
      const aspectRatio = node.data.aspectRatio as string || '1:1';
      const resolution = node.data.resolution as string || '1K';
      
      // 处理图片上传
      const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          const url = URL.createObjectURL(file);
          updateData('imageUrl', url);
        }
      };
      
      return (
        <div className="space-y-2 min-w-[240px]">

          {/* Image Upload/Preview */}
          <div className="px-2">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              id={`image-upload-${node.id}`}
              onChange={handleImageUpload}
            />
            {imageUrl ? (
              <label 
                htmlFor={`image-upload-${node.id}`}
                className="relative flex items-center justify-center rounded-lg overflow-hidden bg-gray-700 cursor-pointer hover:opacity-90 min-h-[160px]"


              >
                <img src={imageUrl} alt="Preview" className="max-w-full max-h-full object-contain" />

                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </label>
            ) : (
              <label 
                htmlFor={`image-upload-${node.id}`}
                className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 hover:bg-gray-600/30"
              >
                <Upload className="w-8 h-8 text-gray-500" />
                <span className="text-xs text-gray-500">点击或拖拽上传</span>
              </label>
            )}
          </div>
          
          {/* Prompt Input */}
          <div className="px-2">
            <textarea
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white resize-none"
              rows={2}
              placeholder="描述你想要生成的画面..."
              value={prompt}
              onChange={(e) => updateData('prompt', e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Settings + Generate Button */}
          <div className="px-2 flex gap-2 items-center">
            <select
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
              value={aspectRatio}
              onChange={(e) => updateData('aspectRatio', e.target.value)}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="1:1">1:1</option>
              <option value="16:9">16:9</option>
              <option value="9:16">9:16</option>
              <option value="4:3">4:3</option>
              <option value="3:4">3:4</option>
            </select>
            <select
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
              value={resolution}
              onChange={(e) => updateData('resolution', e.target.value)}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="1K">1K</option>
              <option value="2K">2K</option>
              <option value="4K">4K</option>
            </select>
            <button
              className={`flex-1 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 ${status === 'processing' ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600 text-white'}`}
              onClick={(e) => {
                e.stopPropagation();
                if (status !== 'processing') {
                  const store = useCanvasStore.getState();
                  if (store.executeNode) {
                    store.executeNode(node.id);
                  }
                }
              }}
              disabled={status === 'processing'}
            >
              {status === 'processing' ? <><span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />生成中</> : <><Sparkles className="w-3 h-3" />生成</>}
            </button>
          </div>
          {/* Status indicator */}
          {status === 'failed' && (
            <div className="px-2 text-[10px] text-red-400">生成失败</div>
          )}
          {status === 'completed' && (
            <div className="px-2 text-[10px] text-green-400">生成完成</div>
          )}
        </div>
      );
    }
    
    case 'videoNode': {
      const videoUrl = node.data.videoUrl as string;
      const prompt = node.data.prompt as string || '';
      const status = node.data.status as string || 'idle';
      
      return (
        <div className="space-y-2">
          {/* Video Preview / Upload Area */}
          <div 
            className="w-32 h-20 bg-gray-700 rounded flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-600"
            onClick={(e) => e.stopPropagation()}
            title="Click to upload video"
          >
            {videoUrl ? (
              <video src={videoUrl} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <Film className="w-6 h-6 text-gray-500 mx-auto" />
                <span className="text-[10px] text-gray-500">Upload</span>
              </div>
            )}
          </div>
          
          {/* Prompt Input */}
          <input
            type="text"
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
            placeholder="Enter prompt..."
            value={prompt}
            onChange={(e) => updateData('prompt', e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Status indicator */}
          {status === 'processing' && (
            <div className="text-[10px] text-yellow-400">Generating...</div>
          )}
        </div>
      );
    }
    
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
  const { selectNode, moveNode, selectedNodeIds, viewPort, deleteNode, executeNode } = useCanvasStore();
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
      className={`node absolute min-w-[180px] cursor-move select-none rounded-lg border-2 group ${colorClass} ${
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

      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteNode(node.id);
        }}
        className="absolute -top-2.5 -right-2.5 z-50 p-1 rounded-full shadow border opacity-0 group-hover:opacity-100 transition-opacity scale-90 hover:scale-100 bg-gray-800 text-gray-400 hover:text-red-500 border-gray-700 hover:bg-gray-700"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <X size={12} />
      </button>

      {/* Execute Button - Only for generation nodes */}
      {generationNodeTypes.includes(node.type) && (
        <button
          className="absolute -top-2.5 -right-8 z-50 p-1 rounded-full shadow border opacity-0 group-hover:opacity-100 transition-opacity scale-90 hover:scale-100 bg-gray-800 text-green-400 hover:text-green-300 border-gray-700 hover:bg-gray-700"
          onClick={(e) => {
            e.stopPropagation();
            executeNode(node.id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {node.data.status === 'processing' ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Play size={12} />
          )}
        </button>
      )}

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
