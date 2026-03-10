// CreateAssetNode - 创建资产节点组件
import { Sparkles, ArrowDown } from 'lucide-react';
import { useAssetStore } from '../../stores/assetStore';
import { useProjectStore } from '../../stores/projectStore';
import { useCanvasStore } from '../../stores/canvasStore';
import { imageApi } from '../../api/image';
import { vectorApi } from '../../api/vector';
import { assetTypeOptions } from './nodeConstants';
import { useMemo } from 'react';

interface CreateAssetNodeProps {
  nodeId: string;
  data: {
    name?: string;
    assetType?: string;
    isVariant?: boolean;
    parentAssetId?: number | null;
    description?: string;
    status?: string;
  };
  updateData: (key: string, value: unknown) => void;
}

export default function CreateAssetNode({ nodeId, data, updateData }: CreateAssetNodeProps) {
  const name = data.name as string || '';
  const assetType = data.assetType as string || 'character_primary';
  const isVariant = data.isVariant as boolean || false;
  const parentAssetId = data.parentAssetId as number | null;
  const description = data.description as string || '';
  const status = data.status as string || 'idle';

  // 从资产库获取主要资产作为父资产选项
  const allAssets = useAssetStore.getState().assets;
  const primaryAssets = useMemo(() => {
    return allAssets
      .filter((a) => {
        const ext1 = a.ext1
          ? a.ext1.startsWith('{')
            ? (() => {
                try {
                  return JSON.parse(a.ext1);
                } catch {
                  return {};
                }
              })()
            : {}
          : {};
        return (
          !ext1.parent &&
          (a.resourceType?.includes('primary') || !a.resourceType?.includes('secondary'))
        );
      })
      .map((a) => ({ id: a.id!, name: a.name || a.resourceName }));
  }, [allAssets]);

  // 获取输入的图片节点
  const { connections, nodes } = useCanvasStore();
  const inputImageNode = useMemo(() => {
    // 查找所有连接到当前节点的连线
    const inputConnections = connections.filter((conn) => conn.targetId === nodeId);
    if (inputConnections.length === 0) return null;
    
    // 获取第一个输入节点的ID
    const sourceId = inputConnections[0].sourceId;
    const sourceNode = nodes.find((n) => n.id === sourceId);
    
    // 只接受 imageNode 类型的输入
    if (!sourceNode || sourceNode.type !== 'imageNode') return null;
    
    return sourceNode;
  }, [connections, nodes, nodeId]);

  // 获取输入节点的图片URL
  const inputImageUrl = inputImageNode?.data?.imageUrl as string || '';

  const handleVariantChange = (checked: boolean) => {
    updateData('isVariant', checked);
    if (!checked) {
      updateData('parentAssetId', null);
    }
  };

  const handleSave = async () => {
    if (status === 'saving') return;

    // Validate required fields
    if (!name.trim()) {
      alert('请输入资产名称');
      return;
    }
    if (!inputImageUrl) {
      alert('请先从图片节点输入图片');
      return;
    }

    updateData('status', 'saving');

    try {
      // Get current project ID
      const projectId = useProjectStore.getState().currentProjectId;
      if (!projectId) {
        alert('请先选择项目');
        updateData('status', 'idle');
        return;
      }

      // Get parent asset name if isVariant
      let parentAssetName: string | null = null;
      if (isVariant && parentAssetId) {
        const parentAsset = useAssetStore.getState().assets.find((a) => a.id === parentAssetId);
        parentAssetName = parentAsset?.name || null;
      }

      // Build ext1 JSON for variant info
      const ext1Json = {
        variant: isVariant ? name : null,
        parent: parentAssetName,
      };

      // Get image URL from input node
      let uploadedUrl = inputImageUrl;

      // If the image is a local blob/base64, upload it
      if (inputImageUrl.startsWith('data:') || inputImageUrl.startsWith('blob:')) {
        try {
          const response = await fetch(inputImageUrl);
          const blob = await response.blob();
          const file = new File([blob], `${name}.png`, { type: 'image/png' });
          const uploadResult = await vectorApi.uploadImageFile(file);
          if (uploadResult.code === 0 && uploadResult.data) {
            uploadedUrl = uploadResult.data.imageUrl;
          } else {
            console.error('图片上传失败:', uploadResult);
            alert('图片上传失败');
            updateData('status', 'idle');
            return;
          }
        } catch (uploadError) {
          console.error('图片上传错误:', uploadError);
          alert('图片上传失败');
          updateData('status', 'idle');
          return;
        }
      }

      // Create asset via API
      const result = await imageApi.create({
        resourceName: name,
        resourceType: isVariant ? 'character_secondary' : assetType,
        resourceContent: uploadedUrl,
        projectId: projectId,
        ext1: JSON.stringify(ext1Json),
      });

      if (result) {
        console.log('资产创建成功:', result);
        updateData('status', 'saved');
        // Refresh asset list
        useAssetStore.getState().fetchAssets();
        setTimeout(() => updateData('status', 'idle'), 2000);
      } else {
        alert('资产创建失败');
        updateData('status', 'idle');
      }
    } catch (error) {
      console.error('保存资产错误:', error);
      alert('保存失败，请重试');
      updateData('status', 'idle');
    }
  };

  return (
    <div className="space-y-2 min-w-[240px]">
      {/* Name Input */}
      <input
        type="text"
        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
        placeholder="资产名称..."
        value={name}
        onChange={(e) => updateData('name', e.target.value)}
        onClick={(e) => e.stopPropagation()}
      />

      {/* 资产类型选择 - 仅在非变体时显示 */}
      {!isVariant && (
        <select
          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
          value={assetType}
          onChange={(e) => updateData('assetType', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        >
          {assetTypeOptions.map((type) => (
            <option key={type.key} value={type.key}>
              {type.label}
            </option>
          ))}
        </select>
      )}

      {/* 是否变体复选框 */}
      <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
        <input
          type="checkbox"
          checked={isVariant}
          onChange={(e) => handleVariantChange(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="w-3 h-3"
        />
        <span>创建为二级资产（变体）</span>
      </label>

      {/* 父资产选择器 - 仅在选择变体时显示 */}
      {isVariant && (
        <select
          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
          value={parentAssetId || ''}
          onChange={(e) => updateData('parentAssetId', Number(e.target.value) || null)}
          onClick={(e) => e.stopPropagation()}
        >
          <option value="">请选择父资产</option>
          {primaryAssets.length > 0 ? (
            primaryAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name}
              </option>
            ))
          ) : (
            <option value="" disabled>
              暂无主要资产
            </option>
          )}
        </select>
      )}

      {/* Image Input Preview - 从图片节点输入 */}
      <div
        className="w-full h-24 bg-gray-700 border border-gray-600 rounded flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-600"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {inputImageUrl ? (
          <div className="w-full h-full">
            <img src={inputImageUrl} alt="Preview" className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <ArrowDown className="w-6 h-6 mx-auto mb-1" />
            <span className="text-[10px]">从图片节点输入</span>
          </div>
        )}
      </div>

      {/* Description Input */}
      <textarea
        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white resize-none"
        rows={2}
        placeholder="描述..."
        value={description}
        onChange={(e) => updateData('description', e.target.value)}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Save Button */}
      <button
        className={`w-full py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 ${
          status === 'saving' ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
        onClick={handleSave}
        disabled={status === 'saving'}
      >
        {status === 'saving' ? (
          <>
            <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
            保存中
          </>
        ) : (
          <>
            <Sparkles className="w-3 h-3" />
            保存到资产库
          </>
        )}
      </button>
    </div>
  );
}
