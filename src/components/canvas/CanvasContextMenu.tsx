import { Image, Video, FileText, BookOpen, Wand2, Film, Eye, HardDrive, GitCompare, Sparkles, Clapperboard, Users, Mountain } from 'lucide-react';
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
  { type: 'imageInput', label: '图片输入', icon: <Image className="w-4 h-4" /> },
  { type: 'videoInput', label: '视频输入', icon: <Video className="w-4 h-4" /> },
  { type: 'textNode', label: '文字节点', icon: <FileText className="w-4 h-4" /> },
  { type: 'novelInput', label: '小说输入', icon: <BookOpen className="w-4 h-4" /> },
  { type: 'aiImage', label: 'AI 绘图', icon: <Wand2 className="w-4 h-4" /> },
  { type: 'aiVideo', label: 'AI 视频', icon: <Film className="w-4 h-4" /> },
  { type: 'storyboardNode', label: '智能分镜', icon: <Clapperboard className="w-4 h-4" /> },
  { type: 'videoAnalyze', label: '视频拆解', icon: <Sparkles className="w-4 h-4" /> },
  { type: 'characterDescription', label: '角色描述', icon: <Users className="w-4 h-4" /> },
  { type: 'sceneDescription', label: '场景描述', icon: <Mountain className="w-4 h-4" /> },
  { type: 'imageCompare', label: '图像对比', icon: <GitCompare className="w-4 h-4" /> },
  { type: 'preview', label: '预览窗口', icon: <Eye className="w-4 h-4" /> },
  { type: 'saveLocal', label: '保存到本地', icon: <HardDrive className="w-4 h-4" /> },
];

export default function CanvasContextMenu({ visible, x, y, onAddNode, onClose }: ContextMenuProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed z-50 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1"
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
