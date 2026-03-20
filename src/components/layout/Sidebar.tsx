import { 
  History,
  MessageSquare,
  BookOpen,
  Library
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LeftPanelType } from '../leftPanel/LeftPanel';
import type { RightPanelType } from '../rightPanel/RightPanel';

interface SidebarProps {
  leftPanel: LeftPanelType;
  rightPanel: RightPanelType;
  onLeftPanelChange: (type: LeftPanelType) => void;
  onRightPanelChange: (type: RightPanelType) => void;
}

export default function Sidebar({ 
  leftPanel,
  rightPanel,
  onLeftPanelChange,
  onRightPanelChange
}: SidebarProps) {
  const { t } = useTranslation();

  // Dynamic position: move right when leftPanel is open
  const sidebarLeft = leftPanel ? 'left-[324px]' : 'left-4';

  return (
    <aside className={`fixed ${sidebarLeft} top-1/2 -translate-y-1/2 bg-dark-surface/95 backdrop-blur rounded-2xl shadow-2xl border border-gray-700/50 flex flex-col items-center py-2.5 gap-1 z-50 w-10 transition-all duration-200 ease-out-expo`}>

      {/* ===== 左侧面板按钮（上方）=====*/}
      
      {/* 资产库 - Assets */}
      <button
        onClick={() => onLeftPanelChange(leftPanel === 'assets' ? null : 'assets')}
        className={`p-2.5 rounded-xl transition-all duration-150 ease-out-expo ${
          leftPanel === 'assets'
            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' 
            : 'text-gray-400 hover:text-primary-300 hover:bg-dark-elevated'
        }`}
        title={t('资产库')}
      >
        <Library size={18} />
      </button>

      {/* 剧本 - Script */}
      <button
        onClick={() => onLeftPanelChange(leftPanel === 'script' ? null : 'script')}
        className={`p-2.5 rounded-xl transition-all duration-150 ease-out-expo ${
          leftPanel === 'script'
            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' 
            : 'text-gray-400 hover:text-primary-300 hover:bg-dark-elevated'
        }`}
        title={t('剧本')}
      >
        <BookOpen size={18} />
      </button>

      <div className="flex-1" />

      {/* ===== 右侧面板按钮（下方）=====*/}

      {/* 文件 - Files (右侧) */}
      <button
        onClick={() => onRightPanelChange(rightPanel === 'history' ? null : 'history')}
        className={`p-2.5 rounded-xl transition-all duration-150 ease-out-expo ${
          rightPanel === 'history'
            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' 
            : 'text-gray-400 hover:text-primary-300 hover:bg-dark-elevated'
        }`}
        title={t('files')}
      >
        <History size={18} />
      </button>

      {/* 对话 - Chat (右侧) */}
      <button
        onClick={() => onRightPanelChange(rightPanel === 'chat' ? null : 'chat')}
        className={`p-2.5 rounded-xl transition-all duration-150 ease-out-expo ${
          rightPanel === 'chat'
            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' 
            : 'text-gray-400 hover:text-primary-300 hover:bg-dark-elevated'
        }`}
        title={t('对话')}
      >
        <MessageSquare size={18} />
      </button>

    </aside>
  );
}
