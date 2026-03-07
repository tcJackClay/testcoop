import { useState } from 'react';
import { X, Globe, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';

interface SettingsModalProps {
  onClose: () => void;
}

type TabType = 'api' | 'language' | 'dev';

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('api');
  
  const { user, isDevMode, toggleDevMode } = useAuthStore();
  const isAdmin = user?.username === 'admin';

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const testApi = (apiName: string, response: string) => {
    console.log(`[DEV] 模拟${apiName}测试成功`);
    alert(`[DEV] 模拟${apiName}测试成功\n\n${response}`);
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-h-[80vh] bg-gray-800 rounded-xl shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">{t('settings.title')}</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('api')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'api'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {t('settings.apiConfig')}
          </button>
          <button
            onClick={() => setActiveTab('language')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'language'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4 inline mr-1" />
            {t('settings.language')}
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('dev')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'dev'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4 inline mr-1" />
              开发者
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'api' && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                API Configuration - Coming soon
              </p>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="space-y-2">
              <button
                onClick={() => handleLanguageChange('zh')}
                className={`w-full p-3 rounded-lg text-left flex items-center justify-between ${
                  i18n.language === 'zh'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span>中文 (简体)</span>
                {i18n.language === 'zh' && <span className="text-xs">✓</span>}
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`w-full p-3 rounded-lg text-left flex items-center justify-between ${
                  i18n.language === 'en'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span>English</span>
                {i18n.language === 'en' && <span className="text-xs">✓</span>}
              </button>
            </div>
          )}

          {activeTab === 'dev' && isAdmin && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <h3 className="font-medium">开发者模式</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    开启后可查看详细调用日志和模拟API测试
                  </p>
                </div>
                <button
                  onClick={toggleDevMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isDevMode ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDevMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {isDevMode && (
                <>
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">开发者模式已启用</h4>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>• API 调用将显示详细日志</li>
                      <li>• 可使用模拟信号测试 API 连通性</li>
                      <li>• 不会产生实际的 API 调用</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <h4 className="font-medium text-sm mb-3">模拟 API 测试</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => testApi('登录', 'Token: mock_token_123\nUser: mock_user')}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
                      >
                        测试登录 API
                      </button>
                      <button
                        onClick={() => testApi('获取用户信息', 'User: admin (admin@example.com)')}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
                      >
                        测试获取用户信息
                      </button>
                      <button
                        onClick={() => testApi('模型列表', 'Models: GPT-4, Claude, Midjourney')}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
                      >
                        测试模型列表
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-primary">
            {t('common.save')}
          </button>
        </div>
      </div>
    </>
  );
}
