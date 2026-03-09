import ChatPanel from '../../features/chat/ChatPanel';

export type RightPanelType = 'chat' | null;

interface RightPanelProps {
  type: RightPanelType;
  onClose: () => void;
}

export default function RightPanel({ type, onClose }: RightPanelProps) {
  if (!type) return null;

  return (
    <div className="w-80 border-l border-gray-700 bg-gray-800 shrink-0">
      {type === 'chat' && <ChatPanel onClose={onClose} />}
    </div>
  );
}
