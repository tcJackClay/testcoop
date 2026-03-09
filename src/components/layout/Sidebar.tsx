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


  // Dynamic position: move right when leftPanel is open (after 200px leftPanel)
  const sidebarLeft = leftPanel ? 'left-[324px]' : 'left-4';

  return (
    <aside className={`fixed ${sidebarLeft} top-1/2 -translate-y-1/2 bg-gray-800/95 backdrop-blur rounded-2xl shadow-2xl border border-gray-700 flex flex-col items-center py-2 gap-1 z-50 w-10 transition-all duration-200`}>


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

      {/* Left Panel Buttons */}
      <button
        onClick={() => onLeftPanelChange('assets')}
        className={`p-2 rounded-lg transition-all ${
          leftPanel === 'assets'
            ? 'bg-zinc-800 text-white' 
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
        }`}
        title={t('资产库')}
      >
        <Users size={16} />
      </button>

      <div className="flex-1" />

      {/* Bottom Tools */}
      {/* 剧本按钮 */}
      <button
        onClick={() => onLeftPanelChange('script')}
        className={`p-2 rounded-lg transition-all ${
          leftPanel === 'script'
            ? 'bg-zinc-800 text-white' 
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
        }`}
        title={t('剧本')}
      >
        <BookOpen size={16} />
      </button>

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
