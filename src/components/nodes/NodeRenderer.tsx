import { useRef, useState, useCallback, useEffect } from 'react';
import { 
  Image, 
  Video, 
  Wand2, 
  Film, 
  Eye, 
  HardDrive,
  GripVertical
} from 'lucide-react';
import type { CanvasNode } from '../../stores/canvasStore';
import { useCanvasStore } from '../../stores/canvasStore';

const nodeIcons: Record<string, React.ReactNode> = {
  imageInput: <Image className="w-4 h-4" />,
  videoInput: <Video className="w-4 h-4" />,
  aiImage: <Wand2 className="w-4 h-4" />,
  aiVideo: <Film className="w-4 h-4" />,
  preview: <Eye className="w-4 h-4" />,
  saveLocal: <HardDrive className="w-4 h-4" />,
};

interface NodeRendererProps {
  node: CanvasNode;
}

export default function NodeRenderer({ node }: NodeRendererProps) {
  const { selectNode, moveNode, selectedNodeIds } = useCanvasStore();
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isSelected = selectedNodeIds.includes(node.id);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y,
    };
    selectNode(node.id, e.shiftKey);
  }, [node.position, node.id, selectNode]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      moveNode(node.id, { x: newX, y: newY });
    }
  }, [isDragging, node.id, moveNode]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse events for dragging
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
  useState(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  });

  const icon = nodeIcons[node.type] || <Wand2 className="w-4 h-4" />;
  const label = node.data.label as string || node.type;

  return (
    <div
      className={`node absolute min-w-[180px] cursor-move select-none ${
        isSelected ? 'selected' : ''
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="node-header flex items-center gap-2">
        <GripVertical className="w-3 h-3 text-gray-500" />
        <span className="text-gray-400">{icon}</span>
        <span className="text-sm font-medium truncate">{label}</span>
      </div>

      {/* Body */}
      <div className="node-body">
        {node.type === 'aiImage' && (
          <input
            type="text"
            placeholder="Enter prompt..."
            className="input text-sm"
            value={(node.data.prompt as string) || ''}
            onChange={(e) => {
              useCanvasStore.getState().updateNode(node.id, {
                data: { ...node.data, prompt: e.target.value },
              });
            }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {node.type === 'aiVideo' && (
          <input
            type="text"
            placeholder="Enter prompt..."
            className="input text-sm"
            value={(node.data.prompt as string) || ''}
            onChange={(e) => {
              useCanvasStore.getState().updateNode(node.id, {
                data: { ...node.data, prompt: e.target.value },
              });
            }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {node.type === 'preview' && (
          <div className="w-32 h-20 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs">
            No preview
          </div>
        )}
      </div>

      {/* Handles */}
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-600 rounded-full border-2 border-gray-400 hover:bg-blue-500 hover:border-blue-400 cursor-crosshair" />
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-600 rounded-full border-2 border-gray-400 hover:bg-blue-500 hover:border-blue-400 cursor-crosshair" />
    </div>
  );
}
