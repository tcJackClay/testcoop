import HistoryPanel from '../../features/history/HistoryPanel';
import CharactersPanel from '../../features/characters/CharactersPanel';
import ScriptPanel from './script/ScriptPanel';
import AssetLibraryPanel from '../../features/assets/AssetLibraryPanel';

export type LeftPanelType = 'history' | 'characters' | 'script' | 'assets' | null;

interface LeftPanelProps {
  type: LeftPanelType;
  onClose: () => void;
}

export default function LeftPanel({ type, onClose }: LeftPanelProps) {
  if (!type) return null;

  const panelClasses = "w-80 border-r border-gray-700 flex flex-col animate-in slide-in-from-left duration-200 ease-out-expo";

  switch (type) {
    case 'history':
      return (
        <div className={`${panelClasses} bg-dark-surface`}>
          <HistoryPanel onClose={onClose} />
        </div>
      );
    case 'characters':
      return (
        <div className={`${panelClasses.replace('border-r', 'border-l')} bg-dark-surface`}>
          <CharactersPanel onClose={onClose} />
        </div>
      );
    case 'script':
      return (
        <div className={`${panelClasses} bg-dark-surface`}>
          <ScriptPanel onClose={onClose} />
        </div>
      );
    case 'assets':
      return (
        <div className={`${panelClasses} bg-dark-surface`}>
          <AssetLibraryPanel onClose={onClose} />
        </div>
      );
    default:
      return null;
  }
}
