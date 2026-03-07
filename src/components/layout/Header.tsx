import { useState, useRef, useEffect } from 'react';
import { Settings, Zap, MessageSquare, Layers, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ViewMode } from '../../App';

interface HeaderProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  onSettingsClick: () => void;
  onChatClick?: () => void;
  chatOpen?: boolean;
  onNewProject?: () => void;
}

const navItems: { key: ViewMode; labelKey: string }[] = [
  { key: 'canvas', labelKey: 'nav.canvas' },
  { key: 'storyboard', labelKey: 'nav.storyboard' },
  { key: 'history', labelKey: 'nav.history' },
  { key: 'models', labelKey: 'nav.models' },
];

export default function Header({ 
  viewMode, 
  onViewChange, 
  onSettingsClick, 
  onChatClick, 
  chatOpen,
  onNewProject
}: HeaderProps) {
  const { t } = useTranslation();
  const [projectName, setProjectName] = useState('未命名项目');
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('project_name');
    if (saved) setProjectName(saved);
  }, []);

  const handleBlur = () => {
    setIsEditing(false);
    localStorage.setItem('project_name', projectName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      localStorage.setItem('project_name', projectName);
    }
  };

  return (
    <header className="h-12 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-50 shrink-0">
      {/* Left Section: Logo + Project Name */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-md flex items-center justify-center">
          <Layers size={16} className="text-white" />
        </div>
        
        {/* App Name */}
        <span className="font-bold text-sm text-gray-200 tracking-wide">
          Tapnow Studio
        </span>

        {/* Project Name (editable) */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="ml-2 px-2 py-0.5 text-xs bg-gray-800 border border-gray-700 text-gray-200 rounded outline-none"
            style={{ minWidth: '100px', maxWidth: '200px' }}
            autoFocus
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className="ml-2 text-xs text-gray-500 cursor-pointer hover:underline"
            title="点击编辑项目名称"
          >
            {projectName}
          </span>
        )}

        {/* New Project Button */}
        <button
          onClick={onNewProject}
          className="p-1 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
          title="新建空项目"
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Center Section: Navigation Tabs */}
      <div className="flex items-center gap-1">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onViewChange(item.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === item.key
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      {/* Right Section: Performance + Chat + Settings */}
      <div className="flex items-center gap-2">
        {/* Performance Mode */}
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors"
          title="性能模式"
        >
          <Zap size={12} />
          <span>正常</span>
        </button>

        {/* Chat Button */}
        {onChatClick && (
          <button
            onClick={onChatClick}
            className={`p-2 rounded-md transition-colors ${
              chatOpen
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title="AI 对话"
          >
            <MessageSquare size={16} />
          </button>
        )}
        
        {/* Settings Button */}
        <button
          onClick={onSettingsClick}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
          title="设置"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
