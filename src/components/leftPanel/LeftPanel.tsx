import HistoryPanel from '../../features/history/HistoryPanel';
import CharactersPanel from '../../features/characters/CharactersPanel';

export type LeftPanelType = 'history' | 'characters' | null;

interface LeftPanelProps {
  type: LeftPanelType;
  onClose: () => void;
}

export default function LeftPanel({ type, onClose }: LeftPanelProps) {
  if (!type) return null;

  switch (type) {
    case 'history':
      return <HistoryPanel onClose={onClose} />;
    case 'characters':
      return <CharactersPanel onClose={onClose} />;
    default:
      return null;
  }
}
