import { useState } from 'react';
import { Settings, Zap, MessageSquare, Layers, Plus, LogIn, LogOut, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ViewMode } from '../../App';
import { useAuthStore } from '../../stores/authStore';

interface HeaderProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  onSettingsClick: () => void;
  onChatClick?: () => void;
  chatOpen?: boolean;
  onNewProject?: () => void;
  onProjectClick?: () => void;
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
  onNewProject,
  onProjectClick
}: HeaderProps) {
  const { t } = useTranslation();
  const [projectName] = useState('未命名项目');
  
  const { user, token, openLoginModal, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="h-12 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-50 shrink-0">
      {/* Left Section: Logo + Project Name */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-md flex items-center justify-center">
          <Layers size={16} className="text-white" />
        </div>
        <span className="font-bold text-sm text-gray-200 tracking-wide">
          Huanu Canvas
        </span>

        {/* Project Name (clickable to open projects) */}
        <span
          onClick={onProjectClick}
          className="ml-2 text-xs text-gray-500 cursor-pointer hover:underline"
          title="点击管理项目"
        >
          {projectName}
        </span>

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

      {/* Right Section: Performance + Chat + Settings + Auth */}
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

        {/* Login / User / Logout Button */}
        {token && user ? (
          <div className="flex items-center gap-1">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors"
              title={`当前用户: ${user.username}`}
            >
              <User size={12} />
              <span>{user.username}</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
              title="登出"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={openLoginModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            title="登录"
          >
            <LogIn size={12} />
            <span>登录</span>
          </button>
        )}
      </div>
    </header>
  );
}
