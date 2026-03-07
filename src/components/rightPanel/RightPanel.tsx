import CharactersPanel from '../../features/characters/CharactersPanel';
import ChatPanel from '../../features/chat/ChatPanel';

export type RightPanelType = 'characters' | 'chat' | null;

interface RightPanelProps {
  type: RightPanelType;
  onClose: () => void;
}

export default function RightPanel({ type, onClose }: RightPanelProps) {
  if (!type) return null;

  switch (type) {
    case 'characters':
      return <CharactersPanel onClose={onClose} />;
    case 'chat':
      return <ChatPanel onClose={onClose} />;
    default:
      return null;
  }
}
