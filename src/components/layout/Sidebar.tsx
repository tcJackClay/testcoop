import { useState } from 'react';
import { 
  Layout,
  MousePointer2,
  History,
  Users,
  MessageSquare,
  Save,
  FolderOpen,
  Download,
  Image,
  Video,
  FileText,
  BookOpen,
  Wand2,
  Film,
  Eye,
  HardDrive,
  GitCompare,
  Sparkles,
  Clapperboard,
  Mountain,
  Plus
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ViewMode } from '../../App';
import type { NodeType } from '../../stores/canvasStore';

interface SidebarProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onAddNode?: (type: NodeType) => void;
  onHistoryClick?: () => void;
  onCharactersClick?: () => void;
  historyOpen?: boolean;
  charactersOpen?: boolean;
}

export default function Sidebar({ 
  viewMode, 
  onViewChange, 
  collapsed, 
  onToggleCollapse,
  onAddNode,
  onHistoryClick,
  onCharactersClick,
  historyOpen,
  charactersOpen
}: SidebarProps) {
  const { t } = useTranslation();
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleDragStart = (e: React.DragEvent, nodeType: NodeType) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleClick = (e: React.MouseEvent, nodeType: NodeType) => {
    e.preventDefault();
    if (onAddNode) {
      onAddNode(nodeType);
    }
  };

  const nodeTypes: { type: NodeType; icon: React.ReactNode; label: string }[] = [
    { type: 'imageInput', icon: <Image size={18} />, label: '图片输入' },
    { type: 'videoInput', icon: <Video size={18} />, label: '视频输入' },
    { type: 'textNode', icon: <FileText size={18} />, label: '文字节点' },
    { type: 'novelInput', icon: <BookOpen size={18} />, label: '小说输入' },
    { type: 'aiImage', icon: <Wand2 size={18} />, label: 'AI 绘图' },
    { type: 'aiVideo', icon: <Film size={18} />, label: 'AI 视频' },
    { type: 'storyboardNode', icon: <Clapperboard size={18} />, label: '智能分镜' },
    { type: 'videoAnalyze', icon: <Sparkles size={18} />, label: '视频拆解' },
    { type: 'characterDescription', icon: <Users size={18} />, label: '角色描述' },
    { type: 'sceneDescription', icon: <Mountain size={18} />, label: '场景描述' },
    { type: 'imageCompare', icon: <GitCompare size={18} />, label: '图像对比' },
    { type: 'preview', icon: <Eye size={18} />, label: '预览窗口' },
    { type: 'saveLocal', icon: <HardDrive size={18} />, label: '保存到本地' },
  ];

  return (
    <aside className="fixed left-4 top-1/2 -translate-y-1/2 bg-gray-800/95 backdrop-blur rounded-2xl shadow-2xl border border-gray-700 flex flex-col items-center py-3 gap-3 z-50 w-12 transition-all duration-200">
      {/* Add Node Button */}
      <div className="relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="p-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-all"
          title={t('添加节点')}
        >
          <Plus size={18} />
        </button>
        
        {/* Add Node Menu */}
        {showAddMenu && (
          <div 
            className="absolute left-full ml-2 top-0 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 z-50"
            onMouseLeave={() => setShowAddMenu(false)}
          >
            {nodeTypes.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => handleDragStart(e, item.type)}
                onClick={(e) => {
                  handleClick(e, item.type);
                  setShowAddMenu(false);
                }}
                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer transition-colors"
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="w-8 h-px bg-gray-700" />

      {/* Tool Buttons */}
      <button
        className="p-2.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
        title={t('自动整理节点')}
      >
        <Layout size={18} />
      </button>

      <button
        className="p-2.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
        title={t('选择工具')}
      >
        <MousePointer2 size={18} />
      </button>

      <button
        onClick={onHistoryClick}
        className={`p-2.5 rounded-lg transition-all ${
          historyOpen 
            ? 'bg-zinc-800 text-white' 
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
        }`}
        title={t('生成历史')}
      >
        <History size={18} />
      </button>

      <button
        onClick={onCharactersClick}
        className={`p-2.5 rounded-lg transition-all ${
          charactersOpen 
            ? 'bg-zinc-800 text-white' 
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
        }`}
        title={t('资产库')}
      >
        <Users size={18} />
      </button>

      <div className="flex-1" />

      {/* Bottom Tools */}
      <button
        className="p-2.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
        title={t('AI 对话')}
        onClick={() => {
          // Toggle chat - handled by parent
        }}
      >
        <MessageSquare size={18} />
      </button>

      <button
        className="p-2.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
        title={t('保存项目')}
      >
        <Save size={18} />
      </button>

      <button
        className="p-2.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
        title={t('加载项目')}
      >
        <FolderOpen size={18} />
      </button>

      <button
        className="p-2.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
        title={t('导入工作流')}
      >
        <Download size={18} />
      </button>
    </aside>
  );
}
