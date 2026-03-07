import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Shot } from '../../types';
import { useStoryboardStore } from '../../stores/storyboardStore';

interface ShotEditorProps {
  shot: Shot;
  onClose: () => void;
}

export default function ShotEditor({ shot, onClose }: ShotEditorProps) {
  const { t } = useTranslation();
  const { updateShot } = useStoryboardStore();
  
  const [formData, setFormData] = useState({
    description: shot.description,
    prompt: shot.prompt || '',
    negativePrompt: shot.negativePrompt || '',
    cameraMovement: shot.cameraMovement || '',
    shotType: shot.shotType || '',
    duration: shot.duration || 5,
  });

  useEffect(() => {
    setFormData({
      description: shot.description,
      prompt: shot.prompt || '',
      negativePrompt: shot.negativePrompt || '',
      cameraMovement: shot.cameraMovement || '',
      shotType: shot.shotType || '',
      duration: shot.duration || 5,
    });
  }, [shot.id]);

  const handleSave = () => {
    updateShot(shot.id, formData);
    onClose();
  };

  const shotTypes = ['Wide Shot', 'Medium Shot', 'Close-Up', 'Extreme Close-Up', 'Over the Shoulder', 'POV', 'Establishing', 'Insert'];
  const cameraMovements = ['Static', 'Pan', 'Tilt', 'Dolly', 'Truck', 'Zoom', 'Tracking', 'Crane', 'Handheld', 'Steadicam'];

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="h-14 px-4 flex items-center justify-between border-b border-gray-700 shrink-0">
        <h3 className="font-medium">{t('storyboard.editShot')} #{shot.shotNumber}</h3>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('storyboard.description')}</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input min-h-[80px] resize-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('storyboard.prompt')}</label>
          <textarea
            value={formData.prompt}
            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
            className="input min-h-[100px] resize-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('storyboard.negativePrompt')}</label>
          <input
            type="text"
            value={formData.negativePrompt}
            onChange={(e) => setFormData({ ...formData, negativePrompt: e.target.value })}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('storyboard.shotType')}</label>
          <select
            value={formData.shotType}
            onChange={(e) => setFormData({ ...formData, shotType: e.target.value })}
            className="select"
          >
            <option value="">Select...</option>
            {shotTypes.map((type) => (<option key={type} value={type}>{type}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('storyboard.cameraMovement')}</label>
          <select
            value={formData.cameraMovement}
            onChange={(e) => setFormData({ ...formData, cameraMovement: e.target.value })}
            className="select"
          >
            <option value="">Select...</option>
            {cameraMovements.map((move) => (<option key={move} value={move}>{move}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('storyboard.duration')} (s)</label>
          <input
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 5 })}
            className="input"
            min={1}
            max={30}
          />
        </div>
      </div>
      <div className="p-4 border-t border-gray-700 shrink-0">
        <button onClick={handleSave} className="w-full btn btn-primary flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          {t('common.save')}
        </button>
      </div>
    </div>
  );
}
