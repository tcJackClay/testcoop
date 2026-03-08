/**
 * RunningHub 节点组件
 * 适配 aigc-coop 的自定义画布系统
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, AlertCircle, CheckCircle, Loader2, X, ChevronDown, Sparkles } from 'lucide-react';
import { runningHubApi, runningHubConfig, DEFAULT_FUNCTIONS, type RHNodeField, type RunningHubFunction } from '../../api/runningHub';

interface RunningHubNodeProps {
  nodeId: string;
  data: {
    function?: RunningHubFunction;
    inputs?: Record<string, any>;
    status?: 'idle' | 'configuring' | 'pending' | 'processing' | 'completed' | 'failed';
    result?: { success?: boolean; images?: string[]; files?: any[] };
    error?: string;
    taskId?: string;
    progress?: number;
    nodeInfoList?: RHNodeField[];
    covers?: any[];
    label?: string;
    onDelete?: (id: string) => void;
    onEdit?: (id: string, data: any) => void;
    onExecute?: (id: string) => void;
    onGenerateImage?: (url: string) => void;
  };
  updateData: (key: string, value: unknown) => void;
}

export default function RunningHubNode({ nodeId, data, updateData }: RunningHubNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFunctionSelector, setShowFunctionSelector] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('全部');
  const [nodeFields, setNodeFields] = useState<RHNodeField[]>([]);
  const [covers, setCovers] = useState<any[]>([]);
  const [isLoadingNodeInfo, setIsLoadingNodeInfo] = useState(false);
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({});

  const functions = runningHubConfig.getFunctions().length > 0 ? runningHubConfig.getFunctions() : DEFAULT_FUNCTIONS;

  useEffect(() => {
    setCategories(['全部', ...runningHubConfig.getCategories()]);
  }, []);

  const currentFunction = data.function || functions[0];
  const isConfigured = currentFunction && (Object.keys(data.inputs || {}).length > 0 || nodeFields.length > 0);

  const handleFunctionSelect = useCallback(async (func: RunningHubFunction) => {
    updateData('function', func);
    updateData('inputs', {});
    setShowFunctionSelector(false);
    setIsExpanded(true);
    setProgress(0);
    setError(null);
    setLocalPreviews({});

    if (func.webappId) {
      setIsLoadingNodeInfo(true);
      try {
        const { nodeInfoList, coverList } = await runningHubApi.getNodeInfo(func.webappId);
        setNodeFields(nodeInfoList);
        setCovers(coverList);
        updateData('nodeInfoList', nodeInfoList);
        updateData('covers', coverList);
      } catch (err) {
        console.error('[RunningHub] 获取节点信息失败:', err);
      } finally {
        setIsLoadingNodeInfo(false);
      }
    }
  }, [updateData]);

  const handleInputChange = useCallback((fieldName: string, value: any) => {
    const inputKey = `${nodeId}-${fieldName}`;
    const currentInputs = (data.inputs as Record<string, any>) || {};
    updateData('inputs', { ...currentInputs, [inputKey]: value });
  }, [nodeId, data.inputs, updateData]);

  const handleExecute = useCallback(async () => {
    if (!currentFunction || isProcessing) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    updateData('status', 'processing');

    try {
      const result = await runningHubApi.submitAndPoll(
        currentFunction,
        data.inputs || {},
        nodeFields,
        (status) => {
          setProgress(status.progress || 0);
          updateData('progress', status.progress);
          
          if (status.status === 'completed') {
            const fileUrl = status.result?.images?.[0];
            if (fileUrl && data.onGenerateImage) {
              data.onGenerateImage(fileUrl);
            }
            updateData('status', 'completed');
            updateData('result', { success: true, images: status.result?.images, files: status.result?.files });
          } else if (status.status === 'failed') {
            setError(status.error || '处理失败');
            updateData('status', 'failed');
            updateData('error', status.error);
          } else {
            updateData('status', 'processing');
          }
        }
      );

      if (!result.success) {
        setError(result.error || '生成失败');
        updateData('status', 'failed');
        updateData('error', result.error);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '处理异常';
      setError(errMsg);
      updateData('status', 'failed');
      updateData('error', errMsg);
    } finally {
      setIsProcessing(false);
    }
  }, [currentFunction, data.inputs, nodeFields, data, updateData, isProcessing]);

  const handleCancel = useCallback(() => {
    runningHubApi.cancelTask(data.taskId || '');
    setIsProcessing(false);
    setProgress(0);
    updateData('status', 'idle');
    updateData('taskId', undefined);
    updateData('progress', undefined);
  }, [data.taskId, updateData]);

  const handleDelete = useCallback(() => {
    if (data.onDelete) {
      data.onDelete(nodeId);
    }
  }, [nodeId, data]);

  return (
    <div className="min-w-[280px] max-w-[400px] bg-white rounded-xl shadow-md border border-slate-200">
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: currentFunction?.color || '#6366f1' }}>
            🤖
          </div>
          <div>
            <span className="text-xs font-bold text-slate-700">RunningHub</span>
            <p className="text-[9px] text-slate-400">{currentFunction?.name || '选择功能'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {data.status === 'completed' && <span className="flex items-center gap-1 text-[10px] text-green-500"><CheckCircle className="w-3 h-3" />完成</span>}
          {data.status === 'failed' && <span className="flex items-center gap-1 text-[10px] text-red-500"><AlertCircle className="w-3 h-3" />失败</span>}
          <button onClick={handleDelete} className="p-1 rounded hover:bg-slate-200">
            <X className="w-3 h-3 text-slate-400" />
          </button>
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 rounded hover:bg-slate-200">
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Function Selector */}
      <div className="relative">
        <button
          onClick={() => setShowFunctionSelector(!showFunctionSelector)}
          className="w-full px-3 py-2 flex items-center justify-between bg-slate-50 hover:bg-slate-100 border-b border-slate-100 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">{currentFunction?.icon || '🎨'}</span>
            <span className="text-xs text-slate-700">{currentFunction?.name || '选择功能'}</span>
          </div>
          <ChevronDown className={`w-3 h-3 text-slate-400 ${showFunctionSelector ? 'rotate-180' : ''}`} />
        </button>

        {showFunctionSelector && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            <div className="flex flex-wrap gap-1 p-2 border-b border-slate-100">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); }}
                  className={`px-2 py-1 text-[10px] rounded ${activeCategory === cat ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {(activeCategory === '全部' ? functions : functions.filter(f => f.category === activeCategory)).map(func => (
              <button
                key={func.id}
                onClick={() => handleFunctionSelect(func)}
                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50 text-left"
              >
                <span className="text-sm">{func.icon}</span>
                <div className="flex-1">
                  <div className="text-xs text-slate-700">{func.name}</div>
                  <div className="text-[9px] text-slate-400">{func.description}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3 space-y-2">
          {isLoadingNodeInfo && (
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <Loader2 className="w-3 h-3 animate-spin" />加载节点配置...
            </div>
          )}

          <p className="text-[10px] text-slate-500 bg-slate-50 rounded p-2">{currentFunction?.description}</p>

          {/* Cover Images */}
          {covers.length > 0 && (
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-slate-600">预览图</label>
              <div className="grid grid-cols-2 gap-1">
                {covers.slice(0, 4).map((cover, idx) => (
                  <div key={cover.id || idx} className="relative aspect-video rounded overflow-hidden bg-slate-100">
                    <img src={cover.thumbnailUri || cover.url} alt={cover.name || `Cover ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Fields */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-slate-600">输入参数</label>
            {nodeFields.length > 0 ? (
              nodeFields.map((field, idx) => (
                <div key={`${field.nodeId}-${field.fieldName}-${idx}`} className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-600">
                    {field.fieldName}
                    {field.description && <span className="text-slate-400 font-normal ml-1">- {field.description}</span>}
                  </label>
                  {/* 简化版 - 只支持文本输入 */}
                  {field.fieldType === 'STRING' || field.fieldType === 'TEXT' ? (
                    <textarea
                      placeholder={field.description || `请输入${field.fieldName}`}
                      value={data.inputs?.[`${nodeId}-${field.fieldName}`] || field.fieldValue || ''}
                      onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded resize-none"
                    />
                  ) : field.fieldType === 'LIST' ? (
                    <select
                      value={data.inputs?.[`${nodeId}-${field.fieldName}`] || field.fieldValue || ''}
                      onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded"
                    >
                      <option value="">请选择{field.fieldName}</option>
                      {field.fieldData && (() => {
                        try {
                          const parsed = JSON.parse(field.fieldData);
                          const opts = Array.isArray(parsed) ? parsed : [];
                          return opts.map((opt: any, i: number) => (
                            <option key={i} value={typeof opt === 'string' ? opt : opt.value}>{typeof opt === 'string' ? opt : opt.label}</option>
                          ));
                        } catch { return null; }
                      })()}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder={`请输入${field.fieldName}`}
                      value={data.inputs?.[`${nodeId}-${field.fieldName}`] || field.fieldValue || ''}
                      onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded"
                    />
                  )}
                </div>
              ))
            ) : (
              <input
                type="text"
                placeholder="输入提示词..."
                value={data.inputs?.prompt || ''}
                onChange={(e) => handleInputChange('prompt', e.target.value)}
                className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded"
              />
            )}
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">处理中...</span>
                <span className="text-primary font-medium">{progress}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="w-3 h-3 text-red-500" />
              <span className="text-[10px] text-red-600">{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isProcessing ? (
              <button
                onClick={handleCancel}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-600"
              >
                <Pause className="w-3 h-3" />取消
              </button>
            ) : (
              <button
                onClick={handleExecute}
                disabled={!isConfigured}
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded ${isConfigured ? 'bg-primary text-white hover:bg-primary/90' : 'bg-slate-200 text-slate-400'}`}
              >
                <Play className="w-3 h-3" />生成
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
