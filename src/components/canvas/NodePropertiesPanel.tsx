import { useTranslation } from 'react-i18next';
import { X, Settings, Image, Video, Wand2, Film, FileText, BookOpen, Users, Mountain, Sparkles, Clapperboard, GitCompare, Eye, HardDrive, Save, Trash2 } from 'lucide-react';
import { useCanvasStore, type NodeType } from '../../stores/canvasStore';

const nodeIcons: Record<NodeType, React.ReactNode> = {
  imageInput: <Image className="w-5 h-5" />,
  videoInput: <Video className="w-5 h-5" />,
  textNode: <FileText className="w-5 h-5" />,
  novelInput: <BookOpen className="w-5 h-5" />,
  characterDescription: <Users className="w-5 h-5" />,
  sceneDescription: <Mountain className="w-5 h-5" />,
  generateCharacterImage: <Users className="w-5 h-5" />,
  generateSceneImage: <Mountain className="w-5 h-5" />,
  generateCharacterVideo: <Users className="w-5 h-5" />,
  generateSceneVideo: <Mountain className="w-5 h-5" />,
  createCharacter: <Users className="w-5 h-5" />,
  createScene: <Mountain className="w-5 h-5" />,
  videoAnalyze: <Sparkles className="w-5 h-5" />,
  storyboardNode: <Clapperboard className="w-5 h-5" />,
  aiImage: <Wand2 className="w-5 h-5" />,
  aiVideo: <Film className="w-5 h-5" />,
  imageCompare: <GitCompare className="w-5 h-5" />,
  preview: <Eye className="w-5 h-5" />,
  saveLocal: <HardDrive className="w-5 h-5" />,
};

interface NodePropertiesPanelProps {
  onClose: () => void;
}

export default function NodePropertiesPanel({ onClose }: NodePropertiesPanelProps) {
  const { t } = useTranslation();
  const { nodes, selectedNodeIds, updateNode, deleteNode } = useCanvasStore();
  
  const selectedNode = selectedNodeIds.length === 1 
    ? nodes.find(n => n.id === selectedNodeIds[0]) 
    : null;

  if (!selectedNode) {
    return (
      <aside className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">{t('properties.title')}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm p-4 text-center">
          {t('properties.noSelection')}
        </div>
      </aside>
    );
  }

  const updateData = (key: string, value: unknown) => {
    updateNode(selectedNode.id, {
      data: { ...selectedNode.data, [key]: value },
    });
  };

  const handleDelete = () => {
    deleteNode(selectedNode.id);
  };

  const renderProperties = () => {
    switch (selectedNode.type) {
      case 'textNode':
      case 'novelInput':
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">{t('properties.content')}</label>
              <textarea
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white resize-none"
                rows={6}
                value={(selectedNode.data.content as string) || ''}
                onChange={(e) => updateData('content', e.target.value)}
              />
            </div>
          </>
        );

      case 'imageInput':
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">{t('properties.imageUrl')}</label>
              <input
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
                value={(selectedNode.data.imageUrl as string) || ''}
                onChange={(e) => updateData('imageUrl', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">{t('properties.label')}</label>
              <input
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
                value={(selectedNode.data.label as string) || ''}
                onChange={(e) => updateData('label', e.target.value)}
              />
            </div>
          </>
        );

      case 'videoInput':
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">{t('properties.videoUrl')}</label>
              <input
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
                value={(selectedNode.data.videoUrl as string) || ''}
                onChange={(e) => updateData('videoUrl', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">{t('properties.label')}</label>
              <input
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
                value={(selectedNode.data.label as string) || ''}
                onChange={(e) => updateData('label', e.target.value)}
              />
            </div>
          </>
        );

      case 'aiImage':
      case 'aiVideo':
      case 'generateCharacterImage':
      case 'generateSceneImage':
      case 'generateCharacterVideo':
      case 'generateSceneVideo':
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">{t('properties.prompt')}</label>
              <textarea
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white resize-none"
                rows={4}
                value={(selectedNode.data.prompt as string) || ''}
                onChange={(e) => updateData('prompt', e.target.value)}
                placeholder={t('properties.promptPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">{t('properties.model')}</label>
              <select
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
                value={(selectedNode.data.modelId as string) || ''}
                onChange={(e) => updateData('modelId', e.target.value)}
              >
                <option value="">{t('properties.selectModel')}</option>
                <option value="sdxl">Stable Diffusion XL</option>
                <option value="sd15">Stable Diffusion 1.5</option>
                <option value="dalle3">DALL-E 3</option>
                <option value="runway">Runway Gen-2</option>
                <option value="pika">Pika Labs</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">{t('properties.negativePrompt')}</label>
              <textarea
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white resize-none"
                rows={2}
                value={(selectedNode.data.negativePrompt as string) || ''}
                onChange={(e) => updateData('negativePrompt', e.target.value)}
                placeholder={t('properties.negativePromptPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">{t('properties.steps')}</label>
              <input
                type="number"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
                value={(selectedNode.data.steps as number) || 30}
                onChange={(e) => updateData('steps', parseInt(e.target.value))}
                min={1}
                max={100}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">{t('properties.cfgScale')}</label>
              <input
                type="number"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
                value={(selectedNode.data.cfgScale as number) || 7}
                onChange={(e) => updateData('cfgScale', parseFloat(e.target.value))}
                min={1}
                max={20}
                step={0.5}
              />
            </div>
          </>
        );

      case 'characterDescription':
      case 'sceneDescription':
      case 'createCharacter':
      case 'createScene':
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">{t('properties.name')}</label>
              <input
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
                value={(selectedNode.data.name as string) || ''}
                onChange={(e) => updateData('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">{t('properties.description')}</label>
              <textarea
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white resize-none"
                rows={4}
                value={(selectedNode.data.description as string) || ''}
                onChange={(e) => updateData('description', e.target.value)}
              />
            </div>
          </>
        );

      case 'videoAnalyze':
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">{t('properties.analyzeType')}</label>
              <select
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
                value={(selectedNode.data.analyzeType as string) || 'all'}
                onChange={(e) => updateData('analyzeType', e.target.value)}
              >
                <option value="all">{t('properties.analyzeAll')}</option>
                <option value="scene">{t('properties.analyzeScene')}</option>
                <option value="character">{t('properties.analyzeCharacter')}</option>
                <option value="action">{t('properties.analyzeAction')}</option>
              </select>
            </div>
          </>
        );

      case 'storyboardNode':
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">{t('properties.aspectRatio')}</label>
              <select
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
                value={(selectedNode.data.aspectRatio as string) || '16:9'}
                onChange={(e) => updateData('aspectRatio', e.target.value)}
              >
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Portrait)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="4:3">4:3</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">{t('properties.frameRate')}</label>
              <select
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
                value={(selectedNode.data.frameRate as string) || '24'}
                onChange={(e) => updateData('frameRate', e.target.value)}
              >
                <option value="24">24 fps</option>
                <option value="30">30 fps</option>
                <option value="60">60 fps</option>
              </select>
            </div>
          </>
        );

      case 'imageCompare':
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">{t('properties.imageA')}</label>
              <input
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
                value={(selectedNode.data.imageA as string) || ''}
                onChange={(e) => updateData('imageA', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">{t('properties.imageB')}</label>
              <input
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
                value={(selectedNode.data.imageB as string) || ''}
                onChange={(e) => updateData('imageB', e.target.value)}
              />
            </div>
          </>
        );

      case 'saveLocal':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoSave"
              className="w-4 h-4 rounded bg-gray-700 border-gray-600"
              checked={(selectedNode.data.autoSave as boolean) || false}
              onChange={(e) => updateData('autoSave', e.target.checked)}
            />
            <label htmlFor="autoSave" className="text-sm text-gray-300">
              {t('properties.autoSave')}
            </label>
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-500">
            {t('properties.noProperties')}
          </div>
        );
    }
  };

  return (
    <aside className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {nodeIcons[selectedNode.type]}
          <span className="text-sm font-medium">{t('properties.title')}</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleDelete}
            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded"
            title={t('properties.delete')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto">
        {/* Node Info */}
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            {nodeIcons[selectedNode.type]}
            <span className="text-sm font-medium">{selectedNode.data.label as string}</span>
          </div>
          <div className="text-xs text-gray-500">ID: {selectedNode.id}</div>
        </div>

        {/* Type-specific properties */}
        {renderProperties()}

        {/* Position (read-only) */}
        <div className="pt-4 border-t border-gray-700">
          <div className="text-xs text-gray-500 mb-2">{t('properties.position')}</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400">X</label>
              <div className="text-sm text-gray-300">{Math.round(selectedNode.position.x)}</div>
            </div>
            <div>
              <label className="text-xs text-gray-400">Y</label>
              <div className="text-sm text-gray-300">{Math.round(selectedNode.position.y)}</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
