import HistoryPanel from '../../features/history/HistoryPanel';
import CharactersPanel from '../../features/characters/CharactersPanel';

export type LeftPanelType = 'history' | 'characters' | null;

interface LeftPanelProps {
  type: LeftPanelType;
  onClose: () => void;
}

export default function LeftPanel({ type, onClose }: LeftPanelProps) {
  if (!type) return null;

  const panelStyle = { width: '144px' }; // w-36 = 144px

  switch (type) {
    case 'history':
      return (
        <div style={panelStyle} className="bg-gray-800 border-r border-gray-700 flex flex-col animate-in slide-in-from-left">
          <HistoryPanel onClose={onClose} />
        </div>
      );
    case 'characters':
      return (
        <div style={panelStyle} className="bg-gray-800 border-l border-gray-700 flex flex-col animate-in slide-in-from-right">
          <CharactersPanel onClose={onClose} />
        </div>
      );
    default:
      return null;
  }
}
