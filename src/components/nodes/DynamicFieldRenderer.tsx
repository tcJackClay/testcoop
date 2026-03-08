import React from 'react';
import type { RHNodeField } from '../../api/runningHub';

interface DynamicFieldRendererProps {
  field: RHNodeField;
  nodeId: string;
  data: { inputs: Record<string, any> };
  onInputChange: (nodeId: string, fieldName: string, value: any) => void;
  localPreviews: Record<string, string>;
  setLocalPreviews: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  currentFunction: { webappId: string } | undefined;
}

export const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  field,
  nodeId,
  data,
  onInputChange,
  localPreviews,
  setLocalPreviews,
  currentFunction,
}) => {
  const inputKey = `${field.nodeId}-${field.fieldName}`;

  // STRING type - multiline text
  if (field.fieldType === 'STRING') {
    return (
      <textarea
        placeholder={field.description || `请输入${field.fieldName}`}
        value={data.inputs[inputKey] || field.fieldValue || ''}
        onChange={(e) => onInputChange(field.nodeId, field.fieldName, e.target.value)}
        rows={2}
        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none placeholder:text-slate-300"
      />
    );
  }

  // TEXT type - multiline text with larger height
  if (field.fieldType === 'TEXT') {
    return (
      <textarea
        placeholder={field.description || `请输入${field.fieldName}`}
        value={data.inputs[inputKey] || field.fieldValue || ''}
        onChange={(e) => onInputChange(field.nodeId, field.fieldName, e.target.value)}
        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-slate-300 min-h-[80px] max-h-[200px] overflow-y-auto"
      />
    );
  }

  // LIST type - dropdown
  if (field.fieldType === 'LIST') {
    let options: string[] = [];
    try {
      if (field.fieldData) {
        const parsed = JSON.parse(field.fieldData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (Array.isArray(parsed[0])) {
            options = parsed[0];
          } else if (typeof parsed[0] === 'string') {
            options = parsed;
          }
        }
      }
    } catch {
      const str = field.fieldData?.trim() || '';
      if (str.includes(',')) {
        options = str.split(',').map(s => s.trim()).filter(s => s);
      } else if (str) {
        options = [str];
      }
    }

    return (
      <select
        value={data.inputs[inputKey] || field.fieldValue || ''}
        onChange={(e) => onInputChange(field.nodeId, field.fieldName, e.target.value)}
        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
      >
        <option value="">请选择{field.fieldName}</option>
        {options.map((opt, i) => (
          <option key={i} value={String(opt)}>{String(opt)}</option>
        ))}
      </select>
    );
  }

  // IMAGE type - image upload
  if (field.fieldType === 'IMAGE') {
    const previewUrl = localPreviews[inputKey] || data.inputs[inputKey];

    return (
      <div>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          id={`rh-upload-${nodeId}-${field.fieldName}`}
        />
        {previewUrl ? (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 mb-2">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            <label
              htmlFor={`rh-upload-${nodeId}-${field.fieldName}`}
              className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-white text-2xl">cloud_upload</span>
            </label>
          </div>
        ) : (
          <label
            htmlFor={`rh-upload-${nodeId}-${field.fieldName}`}
            className="w-full aspect-video rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-slate-300 text-2xl">add_photo_alternate</span>
            <span className="text-xs font-medium text-slate-400">点击或拖拽上传</span>
          </label>
        )}
      </div>
    );
  }

  // AUDIO/VIDEO type - file upload
  if (field.fieldType === 'AUDIO' || field.fieldType === 'VIDEO') {
    const previewUrl = localPreviews[inputKey] || data.inputs[inputKey];

    return (
      <div>
        <input
          type="file"
          accept={field.fieldType === 'AUDIO' ? 'audio/*' : 'video/*'}
          className="hidden"
          id={`rh-upload-${nodeId}-${field.fieldName}`}
        />
        {previewUrl ? (
          <div className="space-y-2">
            {field.fieldType === 'VIDEO' ? (
              <video src={previewUrl} className="w-full aspect-video rounded-lg bg-slate-100" controls />
            ) : (
              <audio src={previewUrl} className="w-full" controls />
            )}
            <label
              htmlFor={`rh-upload-${nodeId}-${field.fieldName}`}
              className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <span className="text-xs text-green-600">已上传</span>
              <span className="text-xs text-slate-500">点击更换</span>
            </label>
          </div>
        ) : (
          <label
            htmlFor={`rh-upload-${nodeId}-${field.fieldName}`}
            className="w-full aspect-video rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-slate-300 text-2xl">
              {field.fieldType === 'VIDEO' ? 'videocam' : 'mic'}
            </span>
            <span className="text-xs font-medium text-slate-400">点击上传{field.fieldName}</span>
          </label>
        )}
      </div>
    );
  }

  return null;
};
