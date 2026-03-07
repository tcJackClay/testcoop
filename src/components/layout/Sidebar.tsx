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
import type { LeftPanelType } from '../leftPanel/LeftPanel';
import type { RightPanelType } from '../rightPanel/RightPanel';

interface SidebarProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onAddNode?: (type: NodeType) => void;
  leftPanel: LeftPanelType;
  rightPanel: RightPanelType;
  onLeftPanelChange: (type: LeftPanelType) => void;
  onRightPanelChange: (type: RightPanelType) => void;
}

export default function Sidebar({ 
  viewMode, 
  onViewChange, 
  collapsed, 
  onToggleCollapse,
  onAddNode,
  leftPanel,
  rightPanel,
  onLeftPanelChange,
  onRightPanelChange
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
    { type: 'imageInput', icon: <Image size={16} />, label: '图片输入' },
    { type: 'videoInput', icon: <Video size={16} />, label: '视频输入' },
    { type: 'textNode', icon: <FileText size={16} />, label: '文字节点' },
    { type: 'novelInput', icon: <BookOpen size={16} />, label: '小说输入' },
    { type: 'aiImage', icon: <Wand2 size={16} />, label: 'AI 绘图' },
    { type: 'aiVideo', icon: <Film size={16} />, label: 'AI 视频' },
    { type: 'storyboardNode', icon: <Clapperboard size={16} />, label: '智能分镜' },
    { type: 'videoAnalyze', icon: <Sparkles size={16} />, label: '视频拆解' },
    { type: 'characterDescription', icon: <Users size={16} />, label: '角色描述' },
    { type: 'sceneDescription', icon: <Mountain size={16} />, label: '场景描述' },
    { type: 'imageCompare', icon: <GitCompare size={16} />, label: '图像对比' },
    { type: 'preview', icon: <Eye size={16} />, label: '预览窗口' },
    { type: 'saveLocal', icon: <HardDrive size={16} />, label: '保存到本地' },
  ];

  // Dynamic position: move right when leftPanel is open
  const sidebarLeft = leftPanel ? 'left-30' : 'left-4';

  return (
    <aside className={`fixed ${sidebarLeft} top-1/2 -translate-y-1/2 bg-gray-800/95 backdrop-blur rounded-2xl shadow-2xl border border-gray-700 flex flex-col items-center py-2 gap-1 z-50 w-8 transition-all duration-200`}>
      {/* Add Node Button */}
      <div className="relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-all"
          title={t('添加节点')}
        >
          <Plus size={16} />
        </button>
        
        {/* Add Node Menu */}
        {showAddMenu && (
          <div 
            className="absolute left-full ml-2 top-0 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 z-50"
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
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer transition-colors"
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tool Buttons */}
      <button
        className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
        title={t('自动整理')}
      >
        <Layout size={16} />
      </button>

      <button
        className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
        title={t('选择')}
      >
        <MousePointer2 size={16} />
      </button>

      <button
        onClick={() => onLeftPanelChange('history')}
        className={`p-2 rounded-lg transition-all ${
          leftPanel === 'history'
            ? 'bg-zinc-800 text-white' 
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
        }`}
        title={t('历史')}
      >
        <History size={16} />
      </button>

      <div className="flex-1" />

      {/* Right Panel Buttons */}
      <button
        onClick={() => onRightPanelChange('chat')}
        className={`p-2 rounded-lg transition-all ${
          rightPanel === 'chat'
            ? 'bg-zinc-800 text-white' 
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
        }`}
        title={t('对话')}
      >
        <MessageSquare size={16} />
      </button>

      <button
        onClick={() => onRightPanelChange('characters')}
        className={`p-2 rounded-lg transition-all ${
          rightPanel === 'characters'
            ? 'bg-zinc-800 text-white' 
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
        }`}
        title={t('资产库')}
      >
        <Users size={16} />
      </button>

      <div className="flex-1" />

      {/* Bottom Tools */}
      <button
        className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
        title={t('保存')}
      >
        <Save size={16} />
      </button>

      <button
        className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
        title={t('加载')}
      >
        <FolderOpen size={16} />
      </button>

      <button
        className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
        title={t('导入')}
      >
        <Download size={16} />
      </button>
    </aside>
  );
}
