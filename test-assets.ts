// 测试脚本：获取 projectId 1024 的资产
import { imageApi } from './src/api/image.ts';

async function test() {
  console.log('请求 projectId: 1024 的资产...');
  const assets = await imageApi.getAll(1024);
  console.log('获取到资产数量:', assets?.length || 0);
  
  if (assets && assets.length > 0) {
    console.log('\n前5个资产详情:');
    assets.slice(0, 5).forEach((asset, i) => {
      console.log(`\n--- 资产 ${i+1} ---`);
      console.log('id:', asset.id);
      console.log('resourceName:', asset.resourceName);
      console.log('resourceType:', asset.resourceType);
      console.log('ext1:', asset.ext1);
      console.log('ext2:', asset.ext2);
    });
    
    // 统计分类
    const stats = { primaryChar: 0, secondaryChar: 0, primaryScene: 0, secondaryScene: 0, primaryProp: 0, secondaryProp: 0 };
    assets.forEach(asset => {
      try {
        const ext1 = asset.ext1 ? JSON.parse(asset.ext1) : {};
        const type = (ext1.type || '').toLowerCase();
        if (type.includes('character')) {
          if (type.includes('secondary')) stats.secondaryChar++;
          else stats.primaryChar++;
        } else if (type.includes('scene')) {
          if (type.includes('secondary')) stats.secondaryScene++;
          else stats.primaryScene++;
        } else if (type.includes('prop')) {
          if (type.includes('secondary')) stats.secondaryProp++;
          else stats.primaryProp++;
        }
      } catch(e) {}
    });
    console.log('\n========== 统计 ==========');
    console.log('主要角色:', stats.primaryChar);
    console.log('次要角色:', stats.secondaryChar);
    console.log('主要场景:', stats.primaryScene);
    console.log('次要场景:', stats.secondaryScene);
    console.log('主要道具:', stats.primaryProp);
    console.log('次要道具:', stats.secondaryProp);
    console.log('总计:', assets.length);
  }
}

test().catch(console.error);
