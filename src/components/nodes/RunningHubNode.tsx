import React, { useState, useEffect, useCallback, memo } from 'react';
import { Button } from '@heroui/react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Play, Pause, AlertCircle, CheckCircle, Loader2, X, ChevronDown } from 'lucide-react';
import { runningHubApi, runningHubConfig, DEFAULT_FUNCTIONS, type RHNodeField, type RunningHubNodeData, type RunningHubFunction } from '../../api/runningHub';
import { FunctionSelector } from './FunctionSelector';
import { DynamicFieldRenderer } from './DynamicFieldRenderer';

type RunningHubNodeComponentProps = NodeProps<Node<RunningHubNodeData, 'runninghub'>>;

const RunningHubNode: React.FC<RunningHubNodeComponentProps> = ({ data, id, selected }) => {
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
    data.onEdit?.(id, { function: func, inputs: {} });
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
      } catch (err) {
        console.error('[RunningHub] 获取节点信息失败:', err);
      } finally {
        setIsLoadingNodeInfo(false);
      }
    }
  }, [id, data]);

  const handleInputChange = useCallback((nodeId: string, fieldName: string, value: any) => {
    const inputKey = `${nodeId}-${fieldName}`;
    data.onEdit?.(id, { inputs: { ...data.inputs, [inputKey]: value } });
  }, [id, data]);

  const handleExecute = useCallback(async () => {
    if (!currentFunction || isProcessing) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const result = await runningHubApi.submitAndPoll(
        currentFunction,
        data.inputs,
        nodeFields,
        (status) => {
          setProgress(status.progress || 0);
          if (status.status === 'completed') {
            const fileUrl = status.result?.images?.[0];
            if (fileUrl && data.onGenerateImage) {
              data.onGenerateImage(fileUrl);
            }
            data.onEdit?.(id, { status: 'completed', result: { success: true, images: status.result?.images, files: status.result?.files } });
          } else if (status.status === 'failed') {
            setError(status.error || '处理失败');
            data.onEdit?.(id, { status: 'failed', error: status.error });
          } else {
            data.onEdit?.(id, { status: 'processing', progress: status.progress });
          }
        }
      );

      if (!result.success) {
        setError(result.error || '生成失败');
        data.onEdit?.(id, { status: 'failed', error: result.error });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '处理异常';
      setError(errMsg);
      data.onEdit?.(id, { status: 'failed', error: errMsg });
    } finally {
      setIsProcessing(false);
    }
  }, [currentFunction, data.inputs, nodeFields, id, data, isProcessing]);

  const handleCancel = useCallback(() => {
    runningHubApi.cancelTask(data.taskId || '');
    setIsProcessing(false);
    setProgress(0);
    data.onEdit?.(id, { status: 'idle', taskId: undefined, progress: undefined });
  }, [data.taskId, id, data]);

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = { '图片处理': '#3B82F6', '视频处理': '#10B981' };
    return colors[category] || '#6B7280';
  };

  return (
    <div className={`min-w-[320px] max-w-[480px] bg-white rounded-2xl shadow-lg border-2 transition-all ${selected ? 'border-primary shadow-primary/20' : 'border-slate-200'} ${data.status === 'completed' ? 'ring-2 ring-green-500/30' : ''} ${data.status === 'failed' ? 'ring-2 ring-red-500/30' : ''}`}>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-primary" />

      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: currentFunction?.color || '#6366f1' }}>
            🤖
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">RunningHub</span>
            <p className="text-[10px] text-slate-400">{currentFunction?.name || '选择功能'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data.status === 'completed' && <span className="flex items-center gap-1 text-xs text-green-500"><CheckCircle className="w-3 h-3" /> 完成</span>}
          {data.status === 'failed' && <span className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="w-3 h-3" /> 失败</span>}
          <Button isIconOnly size="sm" variant="light" className="p-1" onPress={() => data.onDelete?.(id)}>
            <X className="w-4 h-4" />
          </Button>
          <Button isIconOnly size="sm" variant="light" className="p-1" onPress={() => setIsExpanded(!isExpanded)}>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Function Selector */}
      <FunctionSelector
        currentFunction={currentFunction}
        showFunctionSelector={showFunctionSelector}
        onToggle={() => setShowFunctionSelector(!showFunctionSelector)}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        functions={functions}
        onFunctionSelect={handleFunctionSelect}
      />

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {isLoadingNodeInfo && <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" />加载节点配置...</div>}

          <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2">{currentFunction?.description}</p>

          {/* Cover Images */}
          {covers.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">预览图</label>
              <div className="grid grid-cols-2 gap-2">
                {covers.slice(0, 4).map((cover, idx) => (
                  <div key={cover.id || idx} className="relative aspect-video rounded-lg overflow-hidden bg-slate-100">
                    <img src={cover.thumbnailUri || cover.url} alt={cover.name || `Cover ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Fields */}
          <div className="space-y-2 nodrag">
            <label className="text-xs font-medium text-slate-600">输入参数</label>
            {nodeFields.length > 0 ? (
              nodeFields.map((field, idx) => (
                <div key={`${field.nodeId}-${field.fieldName}-${idx}`} className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    {field.fieldName}
                    {field.description && <span className="text-slate-400 font-normal ml-1">- {field.description}</span>}
                  </label>
                  <DynamicFieldRenderer
                    field={field}
                    nodeId={id}
                    data={data}
                    onInputChange={handleInputChange}
                    localPreviews={localPreviews}
                    setLocalPreviews={setLocalPreviews}
                    currentFunction={currentFunction}
                  />
                </div>
              ))
            ) : (
              <>
                <div className="nodrag">
                  <input type="text" placeholder="输入提示词..." value={data.inputs.prompt || ''} onChange={(e) => handleInputChange('prompt', 'prompt', e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg" />
                </div>
              </>
            )}
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">处理中...</span>
                <span className="text-primary font-medium">{progress}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg"><AlertCircle className="w-4 h-4 text-red-500" /><span className="text-xs text-red-600">{error}</span></div>}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isProcessing ? (
              <Button color="danger" onPress={handleCancel} className="flex-1 flex items-center justify-center gap-2 px-4 py-2">
                <Pause className="w-4 h-4" />取消
              </Button>
            ) : (
              <Button color="primary" onPress={handleExecute} isDisabled={!isConfigured} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 ${!isConfigured ? 'bg-slate-100 text-slate-400' : ''}`}>
                <Play className="w-4 h-4" />生成
              </Button>
            )}
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-primary" />
    </div>
  );
};

export default memo(RunningHubNode);
