// src/pages/CanvasPage.tsx - 画布页面
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Canvas from '../components/canvas/Canvas';
import SettingsModal from '../features/settings/SettingsModal';
import LoginModal from '../components/auth/LoginModal';
import Storyboard from '../features/storyboard/Storyboard';
import History from '../features/history/History';
import Models from '../features/models/Models';
import LeftPanel, { type LeftPanelType } from '../components/leftPanel/LeftPanel';
import RightPanel, { type RightPanelType } from '../components/rightPanel/RightPanel';
import { useCanvasStore, type NodeType } from '../stores/canvasStore';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';

export type ViewMode = 'canvas' | 'storyboard' | 'history' | 'models';

export default function CanvasPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('canvas');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [leftPanel, setLeftPanel] = useState<LeftPanelType>(null);
  const [rightPanel, setRightPanel] = useState<RightPanelType>(null);
  
  const { addNode } = useCanvasStore();
  const { logout } = useAuthStore();
  const { currentProject } = useProjectStore();

  // 未选择项目时跳转到项目列表
  useEffect(() => {
    if (!currentProject) {
      navigate('/projects', { replace: true });
    }
  }, [currentProject, navigate]);

  const handleViewChange = useCallback((mode: 'canvas' | 'storyboard' | 'history' | 'models') => {
    setViewMode(mode);
  }, []);

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

  const handleProjectClick = () => {
    navigate('/projects');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const showSidebar = viewMode === 'canvas';

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      <Header
        viewMode={viewMode}
        onViewChange={handleViewChange}
        onSettingsClick={() => setShowSettings(true)}
        onChatClick={() => handleRightPanelChange('chat')}
        chatOpen={rightPanel === 'chat'}
        onProjectClick={handleProjectClick}
        onLogout={handleLogout}
      />
      
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
      
      {/* 测试按钮 */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={async () => {
            try {
              const { imageApi } = await import('../api/image');
              const images = await imageApi.getAll(1024);
              
              const targetImage = images.find(img => 
                img.name === '叶枭' || img.resourceName === '叶枭'
              );
              
              if (!targetImage) {
                alert('未找到 "叶枭"\n可用: ' + images.slice(0, 3).map(i => i.name).join(', '));
                return;
              }
              
              const imageId = targetImage.id!;
              
              // 设置分支结构: A → B1/B2 → C1/C2/C3
              // A (1031) → B1(1032), B2(1034)
              const ext2_A = JSON.stringify([
                { type: '高清放大', sourceId: imageId, targetId: imageId + 1 },
                { type: '风格转换', sourceId: imageId, targetId: imageId + 3 }
              ]);
              await imageApi.put(imageId, { ext2: ext2_A });
              
              // B1 (1032) → C1(1033)
              const ext2_B1 = JSON.stringify([
                { type: '去水印', sourceId: imageId + 1, targetId: imageId + 2 }
              ]);
              await imageApi.put(imageId + 1, { ext2: ext2_B1 });
              
              // B2 (1034) → C2(1035)
              const ext2_B2 = JSON.stringify([
                { type: '滤镜', sourceId: imageId + 3, targetId: imageId + 4 }
              ]);
              await imageApi.put(imageId + 3, { ext2: ext2_B2 });
              
              alert(`✅ 已设置分支结构！\n\n` + 
                `A(1031) → B1(1032), B2(1034)\n` +
                `B1(1032) → C1(1033)\n` +
                `B2(1034) → C2(1035)\n\n` +
                `请刷新页面后拖拽 A 测试`);
            } catch (err) {
              alert('❌ ' + err);
            }
          }}
          className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-50"
        >
          🧪 分支
        </button>
      )}
    </div>
  );
}
