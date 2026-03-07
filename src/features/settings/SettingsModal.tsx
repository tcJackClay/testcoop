import { useState } from 'react';
import { X, Globe, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'api' | 'theme' | 'language'>('api');

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
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'api' && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                API Configuration - Coming soon
              </p>
              {/* API config form will be added here */}
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
