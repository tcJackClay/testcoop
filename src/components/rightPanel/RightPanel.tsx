import ChatPanel from '../../features/chat/ChatPanel';
import FilesPanel from '../../features/history/FilesPanel';

export type RightPanelType = 'chat' | 'history' | null;

interface RightPanelProps {
  type: RightPanelType;
  onClose: () => void;
}

export default function RightPanel({ type, onClose }: RightPanelProps) {
  if (!type) return null;

  return (
    <div className="shrink-0 border-l border-[var(--border-soft)] bg-[var(--surface-1)]">
      <div className="h-full w-[368px] bg-[color:rgba(17,22,29,0.92)] backdrop-blur-xl">
        {type === 'chat' && <ChatPanel onClose={onClose} />}
        {type === 'history' && <FilesPanel onClose={onClose} />}
      </div>
    </div>
  );
}
