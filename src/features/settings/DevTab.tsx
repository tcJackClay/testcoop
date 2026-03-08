import { useAuthStore } from '../../stores/authStore';

export default function DevTab() {
  const { isDevMode, toggleDevMode } = useAuthStore();

  const testApi = (name: string) => {
    console.log(`[DEV] 模拟${name}测试`);
    alert(`[DEV] 模拟${name}测试成功`);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-300">开发者选项</h3>
      
      <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
        <span className="text-sm text-gray-300">开发者模式</span>
        <button
          onClick={toggleDevMode}
          className={`w-12 h-6 rounded-full transition-colors ${isDevMode ? 'bg-blue-600' : 'bg-gray-600'}`}
        >
          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${isDevMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      <div className="space-y-2">
        <button onClick={() => testApi('API Key')} className="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600">
          测试 API
        </button>
        <button onClick={() => testApi('连接')} className="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600">
          测试连接
        </button>
      </div>
    </div>
  );
}
