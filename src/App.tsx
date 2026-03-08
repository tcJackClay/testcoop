import { useState, useCallback, useEffect } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Canvas from './components/canvas/Canvas';
import SettingsModal from './features/settings/SettingsModal';
import LoginModal from './components/auth/LoginModal';
import LoginPage from './components/auth/LoginPage';
import Storyboard from './features/storyboard/Storyboard';
import History from './features/history/History';
import Models from './features/models/Models';
import ProjectPanel from './features/projects/ProjectPanel';
import LeftPanel, { type LeftPanelType } from './components/leftPanel/LeftPanel';
import RightPanel, { type RightPanelType } from './components/rightPanel/RightPanel';
import { useCanvasStore, type NodeType } from './stores/canvasStore';
import { useAuthStore } from './stores/authStore';
import { useProjectStore } from './stores/projectStore';

export type ViewMode = 'login' | 'canvas' | 'storyboard' | 'history' | 'models' | 'projects';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('projects');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [leftPanel, setLeftPanel] = useState<LeftPanelType>(null);
  const [rightPanel, setRightPanel] = useState<RightPanelType>(null);
  
  const { nodes, deleteNode, clearSelection, addNode } = useCanvasStore();
  const { token } = useAuthStore();
  const { currentProject } = useProjectStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化后监听登录状态和项目选择状态，自动切换视图
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    
    if (!token) {
      // 未登录，跳转到登录页面
      setViewMode('login');
    } else if (!currentProject) {
      // 已登录但未选择项目，停留在项目列表
      setViewMode('projects');
    }
    // 已登录且已选择项目，可以进入其他视图
  }, [token, currentProject, isInitialized]);

  const handleViewChange = useCallback((mode: ViewMode) => {
    // 只有登录后才能切换到项目视图
    if (mode === 'login' || token) {
      setViewMode(mode);
    }
  }, [token]);

  const handleAddNode = useCallback((type: NodeType) => {
    const x = 100 + Math.random() * 200;
    const y = 100 + Math.random() * 200;
    addNode(type, { x, y });
    setViewMode('canvas');
  }, [addNode]);

  const handleLeftPanelChange = useCallback((type: LeftPanelType) => {
    setLeftPanel(prev => prev === type ? null : type);
  }, []);

  const handleRightPanelChange = useCallback((type: RightPanelType) => {
    setRightPanel(prev => prev === type ? null : type);
  }, []);

  // 判断是否显示 sidebar（只在 canvas 模式下显示）
  const showSidebar = viewMode === 'canvas';
  const showHeader = viewMode !== 'login';

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      {showHeader && (
        <Header
          viewMode={viewMode}
          onViewChange={handleViewChange}
          onSettingsClick={() => setShowSettings(true)}
          onChatClick={() => handleRightPanelChange('chat')}
          chatOpen={rightPanel === 'chat'}
          onProjectClick={() => setViewMode('projects')}
        />
      )}
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - 只在 canvas 模式下显示 */}
        {showSidebar && (
          <Sidebar
            viewMode={viewMode}
            onViewChange={handleViewChange}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            onAddNode={handleAddNode}
            leftPanel={leftPanel}
            rightPanel={rightPanel}
            onLeftPanelChange={handleLeftPanelChange}
            onRightPanelChange={handleRightPanelChange}
          />
        )}
        
        {/* Left Panel */}
        {leftPanel && viewMode === 'canvas' && (
          <LeftPanel type={leftPanel} onClose={() => setLeftPanel(null)} />
        )}

        <main className="flex-1 flex overflow-hidden">
          {viewMode === 'login' && (
            <div className="flex-1 flex items-center justify-center">
              <LoginPage />
            </div>
          )}
          {viewMode === 'canvas' && (
            <div className="flex-1 flex">
              <div className="flex-1">
                <Canvas />
              </div>
            </div>
          )}
          {viewMode === 'storyboard' && <Storyboard />}
          {viewMode === 'history' && <History />}
          {viewMode === 'models' && <Models />}
          {viewMode === 'projects' && <ProjectPanel onBackToCanvas={() => setViewMode('canvas')} />}
        </main>

        {/* Right Panel */}
        {rightPanel && viewMode === 'canvas' && (
          <RightPanel type={rightPanel} onClose={() => setRightPanel(null)} />
        )}
      </div>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      <LoginModal />
    </div>
  );
}
