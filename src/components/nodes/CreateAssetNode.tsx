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
  // 确保 assetType 有默认值，避免空字符串导致保存为 'image'
  const assetType = (data.assetType as string) || 'character_primary';
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
      let parentAssetType: string | null = null;
      if (isVariant && parentAssetId) {
        const parentAsset = useAssetStore.getState().assets.find((a) => a.id === parentAssetId);
        parentAssetName = parentAsset?.name || null;
        // 获取父资产的类型
        if (parentAsset?.ext1) {
          try {
            const parentExt1 = JSON.parse(parentAsset.ext1);
            parentAssetType = parentExt1.type || parentAsset.resourceType || null;
          } catch {}
        }
        if (!parentAssetType) {
          parentAssetType = parentAsset?.resourceType || null;
        }
      }

      // Determine asset type: 变体继承父资产类型，否则使用当前选择的类型
      const finalAssetType = isVariant && parentAssetType 
        ? parentAssetType 
        : (assetType || 'character_primary');

      // Build ext1 JSON - 更新时合并已有 ext1
      let ext1Json: Record<string, any> = {};
      
      // 先查询是否存在同名资产
      console.log('[CreateAssetNode] 查找已有资产, projectId:', projectId, 'name:', name);
      const existingAsset = await imageApi.getByName(projectId, name);
      console.log('[CreateAssetNode] 查找结果:', existingAsset);
      const existingAssetId = existingAsset?.id;
      
      // 如果是更新，合并已有 ext1
      if (existingAssetId && existingAsset?.ext1) {
        try {
          ext1Json = JSON.parse(existingAsset.ext1);
        } catch {}
      }
      
      // 更新 ext1 字段
      ext1Json.variant = isVariant ? name : null;
      ext1Json.parent = parentAssetName;
      ext1Json.type = finalAssetType;

      // Get image URL from input node
      let uploadedUrl = inputImageUrl;

      // If the image is a local blob/base64, upload it and get localPath
      if (inputImageUrl.startsWith('data:') || inputImageUrl.startsWith('blob:')) {
        try {
          const response = await fetch(inputImageUrl);
          const blob = await response.blob();
          // 清理文件名中的特殊字符（/ \ : * ? " < > |）
          const safeName = name.replace(/[\\/:*?"<>|]/g, '_');
          const file = new File([blob], `${safeName}.png`, { type: 'image/png' });
          const uploadResult = await vectorApi.uploadImageFile(file);
          if (uploadResult.code === 0 && uploadResult.data) {
            // 使用 localPath，让后端 getImageById 能正常读取
            uploadedUrl = uploadResult.data.localPath || uploadResult.data.imageUrl || '';
            if (!uploadedUrl) {
              console.error('上传结果为空:', uploadResult);
              alert('图片上传失败');
              updateData('status', 'idle');
              return;
            }
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

      // Create or Update asset via API
      let result;
      const finalExt1 = JSON.stringify(ext1Json);
      if (existingAssetId) {
        result = await imageApi.put(existingAssetId, {
          resourceName: name,
          resourceType: finalAssetType,
          resourceContent: uploadedUrl,
          ext1: finalExt1,
        });
      } else {
        result = await imageApi.create({
          resourceName: name,
          resourceType: finalAssetType,
          resourceContent: uploadedUrl,
          projectId: projectId,
          ext1: finalExt1,
        });
      }

      if (result) {
        console.log(existingAssetId ? '资产更新成功:' : '资产创建成功:', result);
        updateData('status', existingAssetId ? 'updated' : 'saved');
        // Refresh asset list
        useAssetStore.getState().fetchAssets();
        setTimeout(() => updateData('status', 'idle'), 2000);
      } else {
        alert(existingAssetId ? '资产更新失败' : '资产创建失败');
        updateData('status', 'idle');
      }
    } catch (error) {
      console.error('保存资产错误:', error);
      alert('保存失败，请重试');
      updateData('status', 'idle');
    }
  };

  return (
    <div className="space-y-2 min-w-[200px]">
      {/* 顶部两列布局 */}
      <div className="flex gap-2">
        {/* 左侧：名称 + 类型/变体/父资产 */}
        <div className="flex-1 space-y-1">
          {/* 资产类型选择 - 仅在非变体时显示 */}
          {/* 资产类型选择 - 仅在非变体时显示 */}
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
          <label className="flex items-center gap-1 text-xs text-white cursor-pointer">
            <input
              type="checkbox"
              checked={isVariant}
              onChange={(e) => handleVariantChange(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="w-3 h-3"
            />
            <span>二级资产</span>
          </label>

          {/* 父资产选择器 - 仅在选择变体时显示 */}
          {isVariant && (
            <select
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
              value={parentAssetId || ''}
              onChange={(e) => updateData('parentAssetId', Number(e.target.value) || null)}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">选择父资产</option>
              {primaryAssets.length > 0 ? (
                primaryAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>暂无主要资产</option>
              )}
            </select>
          )}
        </div>

        {/* 右侧：图片预览 */}
        <div
          className="w-20 h-20 bg-gray-700 border border-gray-600 rounded flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-600"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {inputImageUrl ? (
            <img src={inputImageUrl} alt="Preview" className="w-full h-full object-contain" />
          ) : (
            <div className="text-center text-gray-500">
              <ArrowDown className="w-4 h-4 mx-auto mb-1" />
              <span className="text-[8px]">输入图片</span>
            </div>
          )}
        </div>
      </div>

      {/* 底部：描述 + 保存按钮 */}
      <div className="space-y-1">
        {/* Description Input */}
        <textarea
          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white resize-none"
          rows={1}
          placeholder="描述..."
          value={description}
          onChange={(e) => updateData('description', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />

        {/* Save/Update Button */}
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
    </div>
  );
}
