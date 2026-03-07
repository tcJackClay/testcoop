import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, TestTube, Check, X, Key, Server, Cpu } from 'lucide-react';
import { useModelStore } from '../../stores/modelStore';

export default function Models() {
  const { t } = useTranslation();
  const { models, addModel, updateModel, deleteModel, testModel } = useModelStore();
  const [editingModel, setEditingModel] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'image',
    provider: '',
    modelId: '',
    baseUrl: '',
    apiKey: '',
  });
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const handleAdd = () => {
    setEditingModel('new');
    setFormData({
      name: '',
      type: 'image',
      provider: '',
      modelId: '',
      baseUrl: '',
      apiKey: '',
    });
  };

  const handleEdit = (model: typeof models[0]) => {
    setEditingModel(model.id);
    setFormData({
      name: model.name,
      type: model.type,
      provider: model.provider,
      modelId: model.modelId,
      baseUrl: model.baseUrl,
      apiKey: model.apiKey,
    });
  };

  const handleSave = () => {
    if (editingModel === 'new') {
      addModel(formData);
    } else {
      updateModel(editingModel, formData);
    }
    setEditingModel(null);
  };

  const handleTest = async (model: typeof models[0]) => {
    setTesting(model.id);
    try {
      const result = await testModel(model.id);
      setTestResults((prev) => ({ ...prev, [model.id]: result }));
    } catch {
      setTestResults((prev) => ({ ...prev, [model.id]: false }));
    }
    setTesting(null);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('models.confirmDelete'))) {
      deleteModel(id);
    }
  };

  return (
    <div className="h-full flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
          <h2 className="text-lg font-medium">{t('models.title')}</h2>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            <Plus className="w-4 h-4" />
            {t('models.addModel')}
          </button>
        </div>

        {/* Model List */}
        <div className="flex-1 overflow-auto p-4">
          {models.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Server className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t('models.empty')}</p>
                <button
                  onClick={handleAdd}
                  className="mt-2 text-blue-400 hover:text-blue-300"
                >
                  {t('models.addModel')}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {models.map((model) => (
                <div
                  key={model.id}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-blue-400" />
                      <div>
                        <h3 className="font-medium">{model.name}</h3>
                        <p className="text-xs text-gray-500">{model.provider}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        model.type === 'image'
                          ? 'bg-purple-900 text-purple-400'
                          : 'bg-red-900 text-red-400'
                      }`}
                    >
                      {model.type}
                    </span>
                  </div>

                  <div className="text-sm text-gray-400 mb-3">
                    <p>Model: {model.modelId}</p>
                    <p className="truncate">URL: {model.baseUrl || 'Default'}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTest(model)}
                      disabled={testing === model.id}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                    >
                      <TestTube className="w-3 h-3" />
                      {testing === model.id ? '...' : t('models.testModel')}
                    </button>
                    {testResults[model.id] !== undefined && (
                      <span
                        className={`flex items-center gap-1 text-xs ${
                          testResults[model.id]
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}
                      >
                        {testResults[model.id] ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                      </span>
                    )}
                    <div className="flex-1" />
                    <button
                      onClick={() => handleEdit(model)}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(model.id)}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Panel */}
      {editingModel && (
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-medium">
              {editingModel === 'new' ? t('models.addModel') : t('models.editModel')}
            </h3>
            <button
              onClick={() => setEditingModel(null)}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {t('models.name')}
              </label>
              <input
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {t('models.type')}
              </label>
              <select
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="image">{t('models.typeImage')}</option>
                <option value="video">{t('models.typeVideo')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {t('models.provider')}
              </label>
              <input
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                placeholder="e.g., OpenAI, Anthropic, Local"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {t('models.modelId')}
              </label>
              <input
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                value={formData.modelId}
                onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                placeholder="e.g., gpt-4-vision-preview"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {t('models.baseUrl')}
              </label>
              <input
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                <Key className="w-4 h-4 inline mr-1" />
                {t('models.apiKey')}
              </label>
              <input
                type="password"
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="sk-..."
              />
            </div>
          </div>

          <div className="p-4 border-t border-gray-700 flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              {t('common.save')}
            </button>
            <button
              onClick={() => setEditingModel(null)}
              className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
