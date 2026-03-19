import { Settings, Layers, LogIn, LogOut, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ViewMode } from '../../App';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';

interface HeaderProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  onSettingsClick: () => void;
  onProjectClick?: () => void;
  onLogout?: () => void;
}

const navItems: { key: ViewMode; labelKey: string }[] = [
  { key: 'canvas', labelKey: 'nav.canvas' },
  { key: 'history', labelKey: 'nav.history' },
];

export default function Header({ 
  viewMode, 
  onViewChange, 
  onSettingsClick, 
  onProjectClick,
  onLogout
}: HeaderProps) {
  const { t } = useTranslation();
  
  const { user, token, openLoginModal, logout: storeLogout } = useAuthStore();
  const { currentProject } = useProjectStore();

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await storeLogout();
    }
  };

  // 检查是否可以切换视图（需要先选择项目）
  const canNavigate = !!currentProject;

  const handleNavClick = (mode: ViewMode) => {
    if (canNavigate || mode === 'projects') {
      onViewChange(mode);
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
        <span className="font-bold text-sm text-gray-200 tracking-wide">
          Huanu Canvas
        </span>

        {/* Project Name (clickable to open projects) */}
        <span
          onClick={onProjectClick}
          className={`ml-2 px-2 py-0.5 rounded text-xs cursor-pointer hover:underline ${
            currentProject ? 'bg-blue-600/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}
          title={currentProject ? '点击管理项目' : '请先选择项目'}
        >
          {currentProject ? currentProject.name : '未选择项目'}
        </span>
      </div>

      {/* Center Section: Navigation Tabs */}
      <div className="flex items-center gap-1">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => handleNavClick(item.key)}
            disabled={!canNavigate && item.key !== 'projects'}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === item.key
                ? 'bg-blue-600 text-white'
                : canNavigate || item.key === 'projects'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 cursor-not-allowed'
            }`}
            title={!canNavigate && item.key !== 'projects' ? '请先选择项目' : ''}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      {/* Right Section: Settings + Auth */}
      <div className="flex items-center gap-2">
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
