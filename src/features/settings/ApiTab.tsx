import { useState, useEffect } from 'react';

type EngineType = 'none' | 'vector' | 'tencent';

const STORAGE_KEY = 'prompt-engine';

export default function ApiTab() {
  const [selectedEngine, setSelectedEngine] = useState<EngineType>('none');

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['none', 'vector', 'tencent'].includes(stored)) {
      setSelectedEngine(stored as EngineType);
    }
  }, []);

  const handleSelect = (engine: EngineType) => {
    setSelectedEngine(engine);
    localStorage.setItem(STORAGE_KEY, engine);
  };

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {/* 向量引擎 */}
        <button
          onClick={() => handleSelect('vector')}
          className={`w-full p-4 rounded-lg border text-left transition-all ${
            selectedEngine === 'vector'
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-white">向量引擎</h4>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 ${
              selectedEngine === 'vector' ? 'border-blue-500 bg-blue-500' : 'border-gray-500'
            }`}>
              {selectedEngine === 'vector' && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              )}
            </div>
          </div>
        </button>

        {/* 腾讯云 VOD */}
        <button
          onClick={() => handleSelect('tencent')}
          className={`w-full p-4 rounded-lg border text-left transition-all ${
            selectedEngine === 'tencent'
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-white">腾讯云 VOD</h4>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 ${
              selectedEngine === 'tencent' ? 'border-blue-500 bg-blue-500' : 'border-gray-500'
            }`}>
              {selectedEngine === 'tencent' && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              )}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

// Helper function to get selected engine
export const getPromptEngine = (): EngineType => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && ['none', 'vector', 'tencent'].includes(stored)) {
    return stored as EngineType;
  }
  return 'none';
};

// Helper functions
export const isVectorEngineEnabled = (): boolean => getPromptEngine() === 'vector';
export const isTencentCloudEnabled = (): boolean => getPromptEngine() === 'tencent';
