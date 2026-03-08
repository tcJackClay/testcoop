import { useState } from 'react';
import { X, Globe, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import RegisterTab from './RegisterTab';
import DevTab from './DevTab';
import ApiTab from './ApiTab';
import LanguageTab from './LanguageTab';

interface SettingsModalProps {
  onClose: () => void;
}

type TabType = 'api' | 'language' | 'dev' | 'register';

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('api');
  const { user } = useAuthStore();
  const isAdmin = user?.username === 'admin';

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-h-[80vh] bg-gray-800 rounded-xl shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">{t('settings.title')}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button onClick={() => setActiveTab('api')} className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'api' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
            {t('settings.apiConfig')}
          </button>
          <button onClick={() => setActiveTab('language')} className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'language' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
            <Globe className="w-4 h-4 inline mr-1" />
            {t('settings.language')}
          </button>
          {isAdmin && (
            <button onClick={() => setActiveTab('dev')} className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'dev' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
              <Zap className="w-4 h-4 inline mr-1" />
              开发者
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setActiveTab('register')} className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'register' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
              注册用户
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'api' && <ApiTab />}
          {activeTab === 'language' && <LanguageTab onChange={handleLanguageChange} currentLang={i18n.language} />}
          {activeTab === 'dev' && <DevTab />}
          {activeTab === 'register' && <RegisterTab />}
        </div>
      </div>
    </>
  );
}
