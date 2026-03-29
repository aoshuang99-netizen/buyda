/**
 * Buyda 个性化选品智能体 - Service Worker (v1.1.0)
 * 处理:
 *   - Keepa API 请求（绕过 CORS）
 *   - OpenAI / Claude AI 请求（绕过 CORS）
 *   - 产品数据缓存
 *   - 货源数据管理
 *   - 标签页通信
 */

console.log('[Buyda SW] Service Worker 启动 v1.1.0');

// ─── 安装/更新事件 ──────────────────────────────────────────
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Buyda SW] 扩展事件:', details.reason);

  if (details.reason === 'install') {
    // 初始化默认配置
    chrome.storage.local.set({
      aiProvider: 'mock',
      watchlist: [],
      supplierList: [],
      installDate: Date.now(),
    });
    console.log('[Buyda SW] 首次安装，初始化配置完成');
  } else if (details.reason === 'update') {
    console.log('[Buyda SW] 更新到版本:', chrome.runtime.getManifest().version);
  }
});

// ─── 消息监听中心 ──────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Buyda SW] 收到消息:', request.type);

  switch (request.type) {

    // ── Keepa API 请求 ──
    case 'FETCH_KEEPA':
      fetchKeepaAPI(request.asin, request.apiKey)
        .then(data => sendResponse(data))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    // ── AI 推理请求 ──
    case 'AI_REQUEST':
      callAIProvider(request.provider, request.apiKey, request.prompt, request.model)
        .then(content => sendResponse({ success: true, content }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    // ── 保存最近分析的产品（供1688面板使用） ──
    case 'SAVE_ANALYZED_PRODUCT':
      chrome.storage.local.set({ lastAnalyzedProduct: request.product });
      sendResponse({ success: true });
      return false;

    // ── API Key 管理 ──
    case 'SAVE_API_KEY':
      chrome.storage.local.set({ keepaApiKey: request.apiKey }, () => {
        sendResponse({ success: true });
      });
      return true;

    case 'GET_API_KEY':
      chrome.storage.local.get(['keepaApiKey'], (result) => {
        sendResponse({ success: true, apiKey: result.keepaApiKey || '' });
      });
      return true;

    // ── 监控清单操作 ──
    case 'SAVE_TO_WATCHLIST':
      saveToWatchlist(request.product)
        .then(count => sendResponse({ success: true, count }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'GET_WATCHLIST':
      chrome.storage.local.get(['watchlist'], (result) => {
        sendResponse({ success: true, list: result.watchlist || [] });
      });
      return true;

    // ── 货源清单操作 ──
    case 'GET_SUPPLIER_LIST':
      chrome.storage.local.get(['supplierList'], (result) => {
        sendResponse({ success: true, list: result.supplierList || [] });
      });
      return true;

    default:
      console.log('[Buyda SW] 未知消息类型:', request.type);
  }
});

// ─── Keepa API 调用 ──────────────────────────────────────────
async function fetchKeepaAPI(asin: string, apiKey: string) {
  if (!apiKey) {
    return { success: false, error: 'Keepa API Key 未配置，请在设置中添加' };
  }

  try {
    const url = `https://api.keepa.com/product?key=${apiKey}&domain=1&asin=${asin}&history=1&stats=90`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 402) {
        return { success: false, error: 'Keepa 配额不足（每月免费60,000次，已用完）' };
      }
      if (response.status === 400) {
        return { success: false, error: '无效的 Keepa API Key，请检查设置' };
      }
      return { success: false, error: `Keepa API 错误: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, tokensLeft: data.tokensLeft, ...data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `网络请求失败: ${msg}` };
  }
}

// ─── AI Provider 调用 ────────────────────────────────────────
async function callAIProvider(
  provider: string,
  apiKey: string,
  prompt: string,
  model?: string
): Promise<string> {
  if (!apiKey) {
    throw new Error('AI API Key 未配置');
  }

  if (provider === 'openai') {
    return callOpenAI(prompt, apiKey, model || 'gpt-4o-mini');
  } else if (provider === 'claude') {
    return callClaude(prompt, apiKey, model || 'claude-3-5-haiku-20241022');
  } else {
    throw new Error(`不支持的 AI Provider: ${provider}`);
  }
}

async function callOpenAI(prompt: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are Buyda, an expert AI product selection advisor for Chinese cross-border Amazon sellers. Always respond in Chinese. Return valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any).error?.message || `OpenAI 错误: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '{}';
}

async function callClaude(prompt: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      system: 'You are Buyda, expert AI advisor for Chinese Amazon sellers. Respond in Chinese. Return JSON only.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any).error?.message || `Claude 错误: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '{}';
}

// ─── 监控清单工具 ────────────────────────────────────────────
async function saveToWatchlist(product: Record<string, unknown>): Promise<number> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['watchlist'], (result) => {
      const list: Record<string, unknown>[] = (result.watchlist as Record<string, unknown>[]) || [];
      if (!list.find(i => i['asin'] === product['asin'])) {
        list.push({ ...product, savedAt: Date.now() });
        chrome.storage.local.set({ watchlist: list }, () => {
          resolve(list.length);
        });
      } else {
        resolve(list.length);
      }
    });
  });
}

// ─── 标签页监听 ──────────────────────────────────────────────
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isAmazon = tab.url.includes('amazon.com') || tab.url.includes('amazon.cn');
    const is1688 = tab.url.includes('1688.com');

    if (isAmazon) {
      // Amazon页面加载完成，可以触发自动分析
      console.log('[Buyda SW] Amazon 页面加载完成:', tab.url.substring(0, 80));
    } else if (is1688) {
      console.log('[Buyda SW] 1688 页面加载完成');
    }
  }
});

export {};
