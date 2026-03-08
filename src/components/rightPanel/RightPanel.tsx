import AssetLibraryPanel from '../../features/assets/AssetLibraryPanel';
import ChatPanel from '../../features/chat/ChatPanel';

export type RightPanelType = 'characters' | 'chat' | null;

interface RightPanelProps {
  type: RightPanelType;
  onClose: () => void;
}

export default function RightPanel({ type, onClose }: RightPanelProps) {
  if (!type) return null;

  return (
    <div className="w-80 border-l border-gray-700 bg-gray-800 shrink-0">
      {type === 'characters' && <AssetLibraryPanel onClose={onClose} />}
      {type === 'chat' && <ChatPanel onClose={onClose} />}
    </div>
  );
}
