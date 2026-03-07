import { Settings, Zap, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ViewMode } from '../../App';

interface HeaderProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  onSettingsClick: () => void;
  onChatClick?: () => void;
  chatOpen?: boolean;
}

const navItems: { key: ViewMode; labelKey: string }[] = [
  { key: 'canvas', labelKey: 'nav.canvas' },
  { key: 'storyboard', labelKey: 'nav.storyboard' },
  { key: 'history', labelKey: 'nav.history' },
  { key: 'models', labelKey: 'nav.models' },
];

export default function Header({ viewMode, onViewChange, onSettingsClick, onChatClick, chatOpen }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-blue-500" />
          <span className="text-lg font-semibold">AIGC Coop</span>
        </div>
        
        <nav className="flex items-center gap-1 ml-8">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => onViewChange(item.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === item.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {/* Chat Button */}
        {onChatClick && (
          <button
            onClick={onChatClick}
            className={`p-2 rounded-md transition-colors ${
              chatOpen
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title={t('nav.chat') || 'AI 对话'}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        )}
        
        {/* Settings Button */}
        <button
          onClick={onSettingsClick}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          title={t('nav.settings')}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
