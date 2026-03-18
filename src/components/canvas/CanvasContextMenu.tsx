import { Image, Video, FileText, Wand2, Film, HardDrive, Sparkles, Clapperboard, BookOpen, Users, Mountain, GitCompare } from 'lucide-react';
import { type NodeType } from '../../stores/canvasStore';

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  worldX: number;
  worldY: number;
  onAddNode: (type: NodeType) => void;
  onClose: () => void;
}

const nodeTypeItems: Array<{ type: NodeType; label: string; icon: React.ReactNode }> = [
  { type: 'promptNode', label: '文本', icon: <Wand2 className="w-4 h-4" /> },
  { type: 'imageNode', label: '图片', icon: <Image className="w-4 h-4" /> },
  { type: 'videoNode', label: '视频', icon: <Film className="w-4 h-4" /> },
  { type: 'createAsset', label: '资产', icon: <Image className="w-4 h-4" /> },
  { type: 'storyboardNode', label: '分镜', icon: <Clapperboard className="w-4 h-4" /> },
];

export default function CanvasContextMenu({ visible, x, y, onAddNode, onClose }: ContextMenuProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed z-50 w-32 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {nodeTypeItems.map((item) => (
        <button
          key={item.type}
          onClick={() => { onAddNode(item.type); onClose(); }}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
