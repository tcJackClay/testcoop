import { Settings, LogIn, LogOut, User, FolderKanban } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';

export type HeaderViewMode = 'canvas' | 'storyboard' | 'history' | 'models';

interface HeaderProps {
  viewMode: HeaderViewMode;
  onViewChange: (mode: HeaderViewMode) => void;
  onSettingsClick: () => void;
  onProjectClick?: () => void;
  onLogout?: () => void;
}

const navItems: { key: HeaderViewMode; label: string }[] = [
  { key: 'canvas', label: '画布' },
  { key: 'history', label: '生成历史' },
];

export default function Header({
  viewMode,
  onViewChange,
  onSettingsClick,
  onProjectClick,
  onLogout,
}: HeaderProps) {
  useTranslation();
  const { user, token, openLoginModal, logout: storeLogout } = useAuthStore();
  const { currentProject } = useProjectStore();

  const canNavigate = !!currentProject;

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }

    await storeLogout();
  };

  return (
    <header className="relative z-50 shrink-0 border-b border-[var(--border-soft)] bg-[color:rgba(11,13,18,0.88)] backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />
      <div className="flex h-16 items-center justify-between gap-4 px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-soft">
            <img src="/logo.png" alt="Huanu" className="h-7 w-auto object-contain" />
          </div>

          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-tertiary)]">Huanu Workbench</p>
            <div className="mt-1 flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-semibold text-[var(--text-primary)]">AI 协同创作工作台</span>
              <button
                onClick={onProjectClick}
                className={`inline-flex min-w-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition ${
                  currentProject
                    ? 'border-primary-500/30 bg-primary-500/12 text-primary-300 hover:border-primary-500/50 hover:bg-primary-500/18'
                    : 'border-amber-400/20 bg-amber-400/10 text-amber-300 hover:border-amber-400/35 hover:bg-amber-400/14'
                }`}
                title={currentProject ? '查看项目列表' : '请先选择项目'}
              >
                <FolderKanban size={12} />
                <span className="truncate">{currentProject ? currentProject.name : '未选择项目'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="hidden items-center rounded-2xl border border-[var(--border-soft)] bg-white/5 p-1 md:flex">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => onViewChange(item.key)}
              disabled={!canNavigate}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                viewMode === item.key
                  ? 'bg-primary-500 text-white shadow-brand'
                  : canNavigate
                    ? 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
                    : 'cursor-not-allowed text-[var(--text-tertiary)]'
              }`}
              title={!canNavigate ? '请先选择项目' : item.label}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSettingsClick}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-white/5 text-[var(--text-secondary)] transition hover:border-primary-500/30 hover:bg-white/8 hover:text-[var(--text-primary)]"
            title="设置"
          >
            <Settings size={16} />
          </button>

          {token && user ? (
            <>
              <div
                className="hidden items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-white/5 px-3 py-2 text-sm text-[var(--text-secondary)] md:flex"
                title={`当前用户：${user.username}`}
              >
                <User size={14} />
                <span className="max-w-32 truncate">{user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-white/5 text-[var(--text-secondary)] transition hover:border-primary-500/30 hover:bg-white/8 hover:text-[var(--text-primary)]"
                title="退出登录"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={openLoginModal}
              className="btn btn-primary h-10 px-4 text-sm"
              title="登录"
            >
              <LogIn size={14} />
              <span>登录</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
