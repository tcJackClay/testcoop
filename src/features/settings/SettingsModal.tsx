import { useState } from 'react';
import { X, Globe, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';

interface SettingsModalProps {
  onClose: () => void;
}

type TabType = 'api' | 'language' | 'dev' | 'register';

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('api');
  
  // 注册相关状态
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const { user, isDevMode, toggleDevMode } = useAuthStore();
  const isAdmin = user?.username === 'admin';

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const testApi = (apiName: string, response: string) => {
    console.log(`[DEV] 模拟${apiName}测试成功`);
    alert(`[DEV] 模拟${apiName}测试成功\n\n${response}`);
  };

  // 处理注册提交
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('两次输入的密码不一致');
      return;
    }
    
    if (registerPassword.length < 6) {
      setRegisterError('密码长度至少6位');
      return;
    }
    
    if (!isAdmin) {
      setRegisterError('只有管理员才能注册新用户');
      return;
    }
    
    setIsRegistering(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          username: registerUsername,
          password: registerPassword,
          name: registerUsername,
          email: '',
          phone: '',
          avatar: '',
          roleIds: [1],
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.code === 0) {
        setRegisterSuccess(true);
        setRegisterUsername('');
        setRegisterPassword('');
        setRegisterConfirmPassword('');
      } else {
        setRegisterError(result.msg || '注册失败');
      }
    } catch (err) {
      setRegisterError('网络错误，请稍后重试');
      console.error('注册错误:', err);
    } finally {
      setIsRegistering(false);
    }
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
          {isAdmin && (
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'register'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              用户注册
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

          {activeTab === 'register' && isAdmin && (
            <div className="space-y-4">
              {registerSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-green-400 text-3xl">✓</span>
                  </div>
                  <p className="text-green-400 font-medium mb-2">注册成功！</p>
                  <p className="text-gray-400 text-sm mb-4">请前往登录</p>
                  <button
                    onClick={() => {
                      setRegisterSuccess(false);
                      onClose();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    确定
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">用户名</label>
                    <input
                      type="text"
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="请输入用户名"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">密码</label>
                    <input
                      type="password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="请输入密码（至少6位）"
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">确认密码</label>
                    <input
                      type="password"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="请再次输入密码"
                      required
                      minLength={6}
                    />
                  </div>
                  {registerError && (
                    <p className="text-sm text-red-400">{registerError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isRegistering ? '注册中...' : '注册'}
                  </button>
                </form>
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
