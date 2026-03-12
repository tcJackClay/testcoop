// 测试手动保存分镜 - 在控制台运行此代码
// 复制整段代码到浏览器控制台

(function(){
  var episodeId = 6;
  var projectId = 1;
  var now = new Date().toISOString();
  var scriptContent = '【场次概述】测试场次\n#【Shot 场景1】【Frame 3s】【中景】主角走进房间\n#【Shot 场景2】【Frame 5s】【特写】主角表情惊讶';
  
  console.log('=== 测试手动保存 (huanu格式) ===');
  
  fetch('/api/storyboard-script/list?projectId=' + projectId, {
    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
  })
  .then(function(r){ return r.json(); })
  .then(function(listResp){
    console.log('现有分镜:', listResp.data ? listResp.data.length : 0, '条');
    
    var existing = null;
    if (listResp.data) {
      for (var i = 0; i < listResp.data.length; i++) {
        var sb = listResp.data[i];
        try {
          var ext1 = JSON.parse(sb.ext1 || '{}');
          if (ext1.episodeId === episodeId) {
            existing = sb;
            break;
          }
        } catch(e) {}
      }
    }
    
    console.log('找到已有:', existing ? existing.id : '无');
    
    if (existing) {
      // 更新
      return fetch('/api/storyboard-script/' + existing.id, {
        method: 'PUT',
        headers: { 
          'Authorization': 'Bearer ' + localStorage.getItem('auth_token'),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resourceContent: JSON.stringify({ content: scriptContent }),
          updatedTime: now,
          updatedBy: 'manual_test'
        })
      });
    } else {
      // 创建
      return fetch('/api/storyboard-script', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer ' + localStorage.getItem('auth_token'),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resourceName: '第' + episodeId + '集分镜_手动测试',
          resourceType: 'storyboard',
          resourceContent: JSON.stringify({ content: scriptContent }),
          resourceStatus: 'official',
          projectId: projectId,
          userId: 1,
          status: 0,
          createdBy: 'manual_test',
          updatedBy: 'manual_test',
          createdTime: now,
          updatedTime: now,
          ext1: JSON.stringify({ episodeId: episodeId, type: 'storyboard' })
        })
      });
    }
  })
  .then(function(r){ return r.json(); })
  .then(function(result){
    console.log('保存结果:', result);
    
    // 验证
    return fetch('/api/storyboard-script/list?projectId=' + projectId, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
    });
  })
  .then(function(r){ return r.json(); })
  .then(function(verifyResp){
    console.log('=== 验证结果 ===');
    var saved = null;
    if (verifyResp.data) {
      for (var i = 0; i < verifyResp.data.length; i++) {
        var sb = verifyResp.data[i];
        try {
          var ext1 = JSON.parse(sb.ext1 || '{}');
          if (ext1.episodeId === episodeId) {
            saved = sb;
            break;
          }
        } catch(e) {}
      }
    }
    console.log('保存的分镜:', saved);
    console.log('resourceContent:', saved ? saved.resourceContent : null);
    console.log('解析后:', saved ? JSON.parse(saved.resourceContent) : null);
  })
  .catch(function(e){ console.error('错误:', e); });
})();
