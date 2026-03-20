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
    <div className="w-80 border-l border-gray-700 bg-dark-surface shrink-0">
      {type === 'chat' && <ChatPanel onClose={onClose} />}
      {type === 'history' && <FilesPanel onClose={onClose} />}
    </div>
  );
}
