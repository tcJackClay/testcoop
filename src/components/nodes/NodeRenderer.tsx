import { useRef, useState, useCallback, useEffect } from 'react';
import { GripVertical, X, Loader2, Play, Sparkles } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';
import type { CanvasNode } from '../../stores/canvasTypes';
import { nodeIcons, nodeColors, generationNodeTypes } from './nodeConstants';
import ImageNode from './ImageNode';
import VideoNode from './VideoNode';
import CreateAssetNode from './CreateAssetNode';
import PromptNode from './PromptNode';
import RunningHubNode from './RunningHubNode';
import StoryboardNode from './StoryboardNode';

interface NodeRendererProps {
  node: CanvasNode;
  connectingSource?: string | null;
  connectingTarget?: string | null;
  mousePos?: { x: number; y: number };
  onStartConnect?: (nodeId: string, handle: 'source' | 'target') => void;
  onEndConnect?: (nodeId: string, handle: 'source' | 'target') => void;
  onMouseMove?: (worldPos: { x: number; y: number }) => void;
  onDeleteConnection?: (connectionId: string) => void;
}


// 更新节点数据的辅助函数
function updateNodeData(id: string, key: string, value: unknown) {
  const node = useCanvasStore.getState().nodes.find((n) => n.id === id);
  if (node) {
    useCanvasStore.getState().updateNode(id, {
      data: { ...node.data, [key]: value },
    });
  }
}

// 根据节点类型渲染不同的内容
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
    case 'aiImage':
    case 'generateCharacterImage':
    case 'generateSceneImage':
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
      return <StoryboardNode nodeId={node.id} data={node.data} updateData={updateData} />;

    case 'imageCompare':
      return (
        <div className="flex gap-1">
          <div className="w-14 h-12 bg-gray-700 rounded flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-gray-500" />
          </div>
          <div className="w-14 h-12 bg-gray-700 rounded flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      );

    case 'imageNode':
      return <ImageNode nodeId={node.id} data={node.data} updateData={updateData} />;

    case 'videoNode':
      return <VideoNode nodeId={node.id} data={node.data} updateData={updateData} />;

    case 'createAsset':
      return <CreateAssetNode nodeId={node.id} data={node.data} updateData={updateData} />;

    case 'promptNode':
      return <PromptNode nodeId={node.id} data={node.data} updateData={updateData} />;

    case 'runninghub':
      return <RunningHubNode nodeId={node.id} data={node.data} updateData={updateData} />;

    case 'saveLocal':
      return (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Sparkles className="w-3 h-3" />
          <span>{node.data.autoSave ? 'Auto-save enabled' : 'Manual save'}</span>
        </div>
      );

    default:
      return null;
  }
}

export default function NodeRenderer({ 
  node, 
  connectingSource,
  onStartConnect,
  onEndConnect 
}: NodeRendererProps) {
  const { selectNode, moveNode, selectedNodeIds, viewPort, deleteNode, executeNode } = useCanvasStore();
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isSelected = selectedNodeIds.includes(node.id);

  // 检查节点连接状态
  const connections = useCanvasStore((state) => state.connections);
  const hasInputConnection = connections.some((c) => c.targetId === node.id);
  const hasOutputConnection = connections.some((c) => c.sourceId === node.id);
  const isConnectingSource = connectingSource === node.id;

  // 节点拖拽处理
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (connectingSource) return;
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      e.stopPropagation();
      setIsDragging(true);

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
    },
    [node.position, node.id, selectNode, viewPort, connectingSource]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
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
    },
    [isDragging, node.id, moveNode, viewPort]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, {});

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

  // 连接点点击处理
  const handleSourceClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isConnectingSource) {
      onStartConnect?.('', 'source');
    } else {
      onStartConnect?.(node.id, 'source');
    }
  }, [node.id, isConnectingSource, onStartConnect]);

  const handleTargetClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (connectingSource && connectingSource !== node.id) {
      onEndConnect?.(node.id, 'target');
    }
  }, [node.id, connectingSource, onEndConnect]);

  // 拖拽式连接 - 输出连接点
  const handleSourceMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onStartConnect?.(node.id, 'source');
  }, [node.id, onStartConnect]);

  // 拖拽式连接 - 输入连接点
  const handleTargetMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (connectingSource && connectingSource !== node.id) {
      onEndConnect?.(node.id, 'target');
    }
  }, [node.id, connectingSource, onEndConnect]);

  const icon = nodeIcons[node.type];
  const label = (node.data.label as string) || node.type;
  const colorClass = nodeColors[node.type] || 'border-gray-500 bg-gray-500/10';

  // 连接点样式 - TapNow-Studio 风格
  const sourceHandleStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    right: '-0.45rem',
    width: '0.9rem',
    height: '0.9rem',
    backgroundColor: connectingSource === node.id ? '#d4d4d8' : '#27272a',
    border: '1px solid #71717a',
    borderRadius: '50%',
    cursor: 'crosshair',
    zIndex: 30,
    opacity: connectingSource === node.id ? 1 : 0.5,
    pointerEvents: 'auto',
    transform: 'translateY(-50%)',
  };

  const targetHandleStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '-0.25rem',
    width: '0.5rem',
    height: '0.5rem',
    backgroundColor: hasInputConnection ? '#60a5fa' : '#52525b',
    borderRadius: '50%',
    zIndex: 20,
    pointerEvents: 'auto',
    transform: 'translateY(-50%)',
  };
  const sourceHandleClass = isConnectingSource
    ? 'bg-green-400 border-green-300 scale-125 animate-pulse'
    : hasOutputConnection
    ? 'bg-green-500 border-green-400'
    : 'bg-gray-600 border-gray-400 hover:bg-green-500 hover:border-green-400';
    
  const targetHandleClass = connectingSource && connectingSource !== node.id
    ? 'bg-blue-400 border-blue-300 scale-125 animate-pulse'
    : hasInputConnection
    ? 'bg-blue-500 border-blue-400'
    : 'bg-gray-600 border-gray-400 hover:bg-blue-500 hover:border-blue-400';

  return (
    <div
      ref={containerRef}
      className={`node absolute min-w-[180px] cursor-move select-none rounded-lg border-2 group ${colorClass} ${
        isSelected ? 'ring-2 ring-white/50' : ''
      } ${isConnectingSource ? 'ring-2 ring-green-400/50' : ''}`}
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
            executeNode?.(node.id);
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
      <div className="p-3">{renderNodeBody(node)}</div>

      {/* Source Handle (Left) - Output */}
      <div
        className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-12 cursor-pointer"
        onClick={handleSourceClick}
        onMouseDown={(e) => e.stopPropagation()}
      />
      <div
        className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 transition-all pointer-events-none ${sourceHandleClass}`}
        title={isConnectingSource ? "点击取消连接" : "点击选择输出节点"}
      />
      {/* Target Handle (Right) - Input */}

      <div
        className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-12 cursor-pointer"
        onClick={handleTargetClick}
        onMouseDown={(e) => e.stopPropagation()}
      />
      <div
        className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 transition-all pointer-events-none ${targetHandleClass}`}
        title={connectingSource && connectingSource !== node.id ? "点击连接" : (hasInputConnection ? "已连接" : "点击选择输入节点")}
      />
    </div>
  );
}
