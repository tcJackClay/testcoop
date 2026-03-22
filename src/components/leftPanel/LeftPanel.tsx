import FilesPanel from '../../features/history/FilesPanel';
import CharactersPanel from '../../features/characters/CharactersPanel';
import ScriptPanel from './script/ScriptPanel';
import AssetLibraryPanel from '../../features/assets/AssetLibraryPanel';

export type LeftPanelType = 'history' | 'characters' | 'script' | 'assets' | null;

interface LeftPanelProps {
  type: LeftPanelType;
  onClose: () => void;
}

const shellClassName =
  'w-[368px] shrink-0 border-r border-[var(--border-soft)] bg-[var(--surface-1)] animate-in slide-in-from-left duration-200';

export default function LeftPanel({ type, onClose }: LeftPanelProps) {
  if (!type) return null;

  const content = (() => {
    switch (type) {
      case 'history':
        return <FilesPanel onClose={onClose} />;
      case 'characters':
        return <CharactersPanel onClose={onClose} />;
      case 'script':
        return <ScriptPanel onClose={onClose} />;
      case 'assets':
        return <AssetLibraryPanel onClose={onClose} />;
      default:
        return null;
    }
  })();

  if (!content) return null;

  return (
    <aside className={shellClassName}>
      <div className="h-full bg-[color:rgba(17,22,29,0.92)] backdrop-blur-xl">
        {content}
      </div>
    </aside>
  );
}
