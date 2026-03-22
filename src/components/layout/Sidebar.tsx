import {
  History,
  MessageSquare,
  BookOpen,
  Library,
} from 'lucide-react';
import type { LeftPanelType } from '../leftPanel/LeftPanel';
import type { RightPanelType } from '../rightPanel/RightPanel';
import type { NodeType } from '../../stores/canvasStore';

interface SidebarProps {
  viewMode?: string;
  onViewChange?: (viewMode: 'canvas' | 'storyboard' | 'history' | 'models') => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onAddNode?: (type: NodeType) => void;
  leftPanel: LeftPanelType;
  rightPanel: RightPanelType;
  onLeftPanelChange: (type: LeftPanelType) => void;
  onRightPanelChange: (type: RightPanelType) => void;
}

const leftActions = [
  { key: 'assets' as const, title: '资产库', icon: Library },
  { key: 'script' as const, title: '脚本', icon: BookOpen },
];

const rightActions = [
  { key: 'history' as const, title: '文件', icon: History },
  { key: 'chat' as const, title: '对话', icon: MessageSquare },
];

export default function Sidebar({
  leftPanel,
  rightPanel,
  onLeftPanelChange,
  onRightPanelChange,
}: SidebarProps) {
  const sidebarLeft = leftPanel ? 'left-[380px]' : 'left-5';

  return (
    <aside
      className={`fixed ${sidebarLeft} top-1/2 z-40 flex w-14 -translate-y-1/2 flex-col items-center gap-2 rounded-[24px] border border-[var(--border-soft)] bg-[color:rgba(24,32,43,0.86)] px-2 py-3 shadow-2xl backdrop-blur-xl transition-all duration-200`}
    >
      {leftActions.map((action) => {
        const Icon = action.icon;
        const active = leftPanel === action.key;

        return (
          <button
            key={action.key}
            onClick={() => onLeftPanelChange(active ? null : action.key)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
              active
                ? 'border-primary-500/40 bg-primary-500 text-white shadow-brand'
                : 'border-transparent text-[var(--text-secondary)] hover:border-[var(--border-soft)] hover:bg-white/6 hover:text-[var(--text-primary)]'
            }`}
            title={action.title}
          >
            <Icon size={18} />
          </button>
        );
      })}

      <div className="my-1 h-px w-6 bg-[var(--border-soft)]" />

      {rightActions.map((action) => {
        const Icon = action.icon;
        const active = rightPanel === action.key;

        return (
          <button
            key={action.key}
            onClick={() => onRightPanelChange(active ? null : action.key)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
              active
                ? 'border-primary-500/40 bg-primary-500 text-white shadow-brand'
                : 'border-transparent text-[var(--text-secondary)] hover:border-[var(--border-soft)] hover:bg-white/6 hover:text-[var(--text-primary)]'
            }`}
            title={action.title}
          >
            <Icon size={18} />
          </button>
        );
      })}
    </aside>
  );
}
