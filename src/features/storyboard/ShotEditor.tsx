import { useState, useEffect } from 'react';
import { X, Save, Upload, Image, Trash2, Plus, GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Shot } from '../../types';
import { useStoryboardStore } from '../../stores/storyboardStore';
import { SHOT_TYPES, CAMERA_MOVEMENTS } from '../../types/storyboard';

interface ShotEditorProps {
  shot: Shot;
  onClose: () => void;
}

export default function ShotEditor({ shot, onClose }: ShotEditorProps) {
  const { t } = useTranslation();
  const { updateShot, storyboardMode } = useStoryboardStore();
  
  const [formData, setFormData] = useState({
    description: shot.description,
    prompt: shot.prompt || '',
    negativePrompt: shot.negativePrompt || '',
    cameraMovement: shot.cameraMovement || '',
    shotType: shot.shotType || '',
    duration: shot.duration || 5,
    // 首尾帧
    useFirstLastFrame: shot.useFirstLastFrame || false,
    firstFrame: shot.firstFrame || '',
    lastFrame: shot.lastFrame || '',
    activeInput: shot.activeInput || 'single',
    // 多图参考
    useMultiRef: shot.useMultiRef || false,
    referenceImages: shot.referenceImages || [],
  });

  useEffect(() => {
    setFormData({
      description: shot.description,
      prompt: shot.prompt || '',
      negativePrompt: shot.negativePrompt || '',
      cameraMovement: shot.cameraMovement || '',
      shotType: shot.shotType || '',
      duration: shot.duration || 5,
      useFirstLastFrame: shot.useFirstLastFrame || storyboardMode === 'video',
      firstFrame: shot.firstFrame || '',
      lastFrame: shot.lastFrame || '',
      activeInput: shot.activeInput || 'single',
      useMultiRef: shot.useMultiRef || false,
      referenceImages: shot.referenceImages || [],
    });
  }, [shot.id, storyboardMode]);

  const handleSave = () => {
    updateShot(shot.id, formData);
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData({ ...formData, [field]: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && formData.referenceImages.length < 5) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData({
          ...formData,
          referenceImages: [...formData.referenceImages, ev.target?.result as string],
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeRefImage = (index: number) => {
    setFormData({
      ...formData,
      referenceImages: formData.referenceImages.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="h-14 px-4 flex items-center justify-between border-b border-gray-700 shrink-0">
        <h3 className="font-medium">{t('storyboard.editShot')} #{shot.shotNumber}</h3>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Description */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('storyboard.description')}</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white resize-none min-h-[80px]"
          />
        </div>

        {/* Prompt */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('storyboard.prompt')}</label>
          <textarea
            value={formData.prompt}
            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white resize-none min-h-[100px]"
          />
        </div>

        {/* Negative Prompt */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('storyboard.negativePrompt')}</label>
          <input
            type="text"
            value={formData.negativePrompt}
            onChange={(e) => setFormData({ ...formData, negativePrompt: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
          />
        </div>

        {/* Shot Type */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('storyboard.shotType')}</label>
          <select
            value={formData.shotType}
            onChange={(e) => setFormData({ ...formData, shotType: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
          >
            <option value="">Select...</option>
            {SHOT_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Camera Movement */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('storyboard.cameraMovement')}</label>
          <select
            value={formData.cameraMovement}
            onChange={(e) => setFormData({ ...formData, cameraMovement: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
          >
            <option value="">Select...</option>
            {CAMERA_MOVEMENTS.map((move) => (
              <option key={move} value={move}>{move}</option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('storyboard.duration')} (s)</label>
          <input
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 5 })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
            min={1}
            max={30}
          />
        </div>

        {/* Video Mode: First/Last Frame Control */}
        {storyboardMode === 'video' && (
          <div className="space-y-3 border-t border-gray-700 pt-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useFirstLastFrame"
                checked={formData.useFirstLastFrame}
                onChange={(e) => setFormData({ ...formData, useFirstLastFrame: e.target.checked })}
                className="w-4 h-4 rounded bg-gray-700 border-gray-600"
              />
              <label htmlFor="useFirstLastFrame" className="text-sm text-gray-300">
                {t('storyboard.useFirstLastFrame') || '使用首尾帧'}
              </label>
            </div>

            {formData.useFirstLastFrame && (
              <div className="space-y-2">
                {/* Active Input Toggle */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, activeInput: 'first' })}
                    className={`flex-1 py-1.5 rounded text-xs ${
                      formData.activeInput === 'first' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    首帧
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, activeInput: 'last' })}
                    className={`flex-1 py-1.5 rounded text-xs ${
                      formData.activeInput === 'last' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    尾帧
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, activeInput: 'single' })}
                    className={`flex-1 py-1.5 rounded text-xs ${
                      formData.activeInput === 'single' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    单图
                  </button>
                </div>

                {/* First Frame Upload */}
                {formData.activeInput !== 'last' && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">首帧图片</label>
                    <div className="relative">
                      {formData.firstFrame ? (
                        <div className="relative">
                          <img 
                            src={formData.firstFrame} 
                            alt="First Frame" 
                            className="w-full h-24 object-cover rounded"
                          />
                          <button
                            onClick={() => setFormData({ ...formData, firstFrame: '' })}
                            className="absolute top-1 right-1 p-1 bg-red-600 rounded"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-600 rounded cursor-pointer hover:border-gray-500">
                          <Upload className="w-6 h-6 text-gray-500" />
                          <span className="text-xs text-gray-500 mt-1">上传首帧</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, 'firstFrame')}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* Last Frame Upload */}
                {formData.activeInput !== 'first' && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">尾帧图片</label>
                    <div className="relative">
                      {formData.lastFrame ? (
                        <div className="relative">
                          <img 
                            src={formData.lastFrame} 
                            alt="Last Frame" 
                            className="w-full h-24 object-cover rounded"
                          />
                          <button
                            onClick={() => setFormData({ ...formData, lastFrame: '' })}
                            className="absolute top-1 right-1 p-1 bg-red-600 rounded"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-600 rounded cursor-pointer hover:border-gray-500">
                          <Upload className="w-6 h-6 text-gray-500" />
                          <span className="text-xs text-gray-500 mt-1">上传尾帧</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, 'lastFrame')}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Multi-Reference Images */}
        <div className="space-y-3 border-t border-gray-700 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useMultiRef"
                checked={formData.useMultiRef}
                onChange={(e) => setFormData({ ...formData, useMultiRef: e.target.checked })}
                className="w-4 h-4 rounded bg-gray-700 border-gray-600"
              />
              <label htmlFor="useMultiRef" className="text-sm text-gray-300">
                {t('storyboard.useMultiRef') || '多图参考 (最多5张)'}
              </label>
            </div>
            {formData.useMultiRef && formData.referenceImages.length < 5 && (
              <label className="p-1 bg-blue-600 rounded cursor-pointer">
                <Plus size={14} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleRefImageUpload}
                />
              </label>
            )}
          </div>

          {formData.useMultiRef && (
            <div className="grid grid-cols-3 gap-2">
              {formData.referenceImages.map((img, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={img} 
                    alt={`Ref ${index + 1}`} 
                    className="w-full h-16 object-cover rounded"
                  />
                  <button
                    onClick={() => removeRefImage(index)}
                    className="absolute top-0 right-0 p-1 bg-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={10} />
                  </button>
                  <span className="absolute bottom-0 left-0 bg-black/50 text-[10px] px-1 rounded">
                    Ref {index + 1}
                  </span>
                </div>
              ))}
              {formData.referenceImages.length === 0 && (
                <div className="col-span-3 text-center py-4 text-gray-500 text-xs">
                  点击 + 添加参考图片
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="p-4 border-t border-gray-700 shrink-0">
        <button 
          onClick={handleSave} 
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          <Save className="w-4 h-4" />
          {t('common.save')}
        </button>
      </div>
    </div>
  );
}
