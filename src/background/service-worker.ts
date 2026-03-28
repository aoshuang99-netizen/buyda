// Service Worker for Chrome Extension
console.log('AI选品助手 - Service Worker已启动');

// 监听安装事件
chrome.runtime.onInstalled.addListener((details) => {
  console.log('扩展已安装:', details.reason);

  if (details.reason === 'install') {
    // 首次安装时的操作
    console.log('首次安装AI选品助手');

    // 打开欢迎页面
    chrome.tabs.create({
      url: 'https://github.com/your-repo/ai-selection-extension'
    });
  } else if (details.reason === 'update') {
    // 更新时的操作
    console.log('更新AI选品助手到:', chrome.runtime.getManifest().version);
  }
});

// 监听来自content scripts和popup的消息
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('收到消息:', request);

  if (request.type === 'FETCH_PRODUCT_DATA') {
    // 处理产品数据获取请求
    fetchProductData(request.asin)
      .then(data => {
        sendResponse({ success: true, data });
      })
      .catch(error => {
        console.error('获取产品数据失败:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // 表示异步响应
  }

  if (request.type === 'SAVE_API_KEY') {
    // 保存API Key
    chrome.storage.local.set({ keepaApiKey: request.apiKey }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.type === 'GET_API_KEY') {
    // 获取API Key
    chrome.storage.local.get(['keepaApiKey'], (result) => {
      sendResponse({ success: true, apiKey: result.keepaApiKey || '' });
    });
    return true;
  }
});

// 获取产品数据的函数（模拟）
async function fetchProductData(asin: string) {
  // TODO: 替换为真实的API调用
  // 这里使用模拟数据
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        asin: asin,
        title: '示例产品',
        price: 29.99,
        rank: 1234,
        rating: 4.5,
        reviews: 567
      });
    }, 1000);
  });
}

// 监听标签页更新
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  // 当标签页更新完成时
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('标签页更新:', tab.url);

    // 检查是否是亚马逊页面
    if (tab.url.includes('amazon.com') || tab.url.includes('amazon.cn')) {
      console.log('检测到亚马逊页面，准备注入脚本');
    }
  }
});

// 监听标签页激活
chrome.tabs.onActivated.addListener((_activeInfo) => {
  console.log('标签页激活');
});

// 保持Service Worker活跃
const heartbeatInterval = setInterval(() => {
  // 心跳，防止Service Worker被挂起
  console.log('Service Worker心跳');
}, 60000); // 每分钟一次

// 清理
chrome.runtime.onSuspend.addListener(() => {
  console.log('Service Worker即将挂起');
  clearInterval(heartbeatInterval);
});

export {};
