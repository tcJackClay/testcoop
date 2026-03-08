export default function ApiTab() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-300">API 配置</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">API Key</label>
          <input type="password" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white" placeholder="sk-..." />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">API Endpoint</label>
          <input type="text" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white" placeholder="https://api.example.com/v1" />
        </div>
      </div>
      <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-500">保存配置</button>
    </div>
  );
}
