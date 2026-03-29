/**
 * Keepa API 集成模块
 * 文档: https://keepa.com/#!discuss/t/keepa-api/
 */

interface KeepaProduct {
  asin: string;
  title: string;
  priceHistory: PriceHistoryPoint[];
  stats: {
    current: number;
    avg30: number;
    avg90: number;
    min: number;
    max: number;
    salesRank: number;
    reviewCount: number;
    rating: number;
  };
  categories: string[];
  brand: string;
  lastUpdate: number;
}

interface PriceHistoryPoint {
  date: string;       // 格式: "MM/DD"
  timestamp: number;
  price: number;
  bsr?: number;
}

interface KeepaApiResponse {
  success: boolean;
  products?: KeepaProduct[];
  error?: string;
  tokensLeft?: number;
}

// Keepa 时间戳转换（Keepa 使用特殊时间戳: minutes since 2011-01-01）
const KEEPA_EPOCH = new Date('2011-01-01T00:00:00Z').getTime();

function keepaTimestampToDate(keepaTs: number): Date {
  return new Date(KEEPA_EPOCH + keepaTs * 60 * 1000);
}

function parseKeepaPrice(rawPrice: number): number {
  // Keepa 价格单位是分（美分），-1 表示无库存/不可用
  if (rawPrice === -1) return 0;
  return rawPrice / 100;
}

/**
 * 从 Keepa API 获取产品数据
 */
export async function fetchKeepaData(
  asin: string,
  apiKey: string
): Promise<KeepaApiResponse> {
  if (!apiKey) {
    return { success: false, error: 'API Key 未配置' };
  }

  const url = `https://api.keepa.com/product?key=${apiKey}&domain=1&asin=${asin}&history=1&stats=90&buyBoxSeller=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 402) {
        return { success: false, error: 'API 配额不足，请检查 Keepa 账户余额' };
      }
      if (response.status === 400) {
        return { success: false, error: '无效的 API Key 或 ASIN' };
      }
      return { success: false, error: `API 请求失败: ${response.status}` };
    }

    const data = await response.json();

    if (!data.products || data.products.length === 0) {
      return { success: false, error: '未找到产品数据' };
    }

    const product = data.products[0];
    const tokensLeft = data.tokensLeft;

    // 解析价格历史 (csv[0] = Amazon Price history)
    const priceHistory = parseKeepaHistory(product.csv?.[0] || [], 90);

    // 解析 BSR 历史 (csv[3] = Sales Rank)
    const bsrHistory = parseKeepaHistory(product.csv?.[3] || [], 90);

    // 合并价格和BSR数据
    const mergedHistory = priceHistory.map((ph, i) => ({
      ...ph,
      bsr: bsrHistory[i]?.price || 0,
    }));

    // 解析统计数据
    const stats = product.stats;

    return {
      success: true,
      tokensLeft,
      products: [{
        asin: product.asin,
        title: product.title || '',
        priceHistory: mergedHistory,
        stats: {
          current: parseKeepaPrice(stats?.current?.[0] ?? -1),
          avg30: parseKeepaPrice(stats?.avg30?.[0] ?? -1),
          avg90: parseKeepaPrice(stats?.avg90?.[0] ?? -1),
          min: parseKeepaPrice(stats?.min?.[0] ?? -1),
          max: parseKeepaPrice(stats?.max?.[0] ?? -1),
          salesRank: stats?.current?.[3] ?? 0,
          reviewCount: product.csv?.[16]?.[product.csv[16].length - 1] ?? 0,
          rating: (product.csv?.[16]?.[product.csv[16].length - 1] ?? 0) / 10,
        },
        categories: product.categories || [],
        brand: product.brand || '',
        lastUpdate: product.lastUpdate || 0,
      }],
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : '网络请求失败';
    // CORS 错误处理（Keepa API 不支持直接从扩展调用，需要通过 service worker）
    if (errMsg.includes('CORS') || errMsg.includes('fetch')) {
      return {
        success: false,
        error: 'Keepa API 需要通过后台 Service Worker 调用，请检查权限配置',
      };
    }
    return { success: false, error: errMsg };
  }
}

/**
 * 解析 Keepa CSV 格式历史数据
 * Keepa CSV 格式: [timestamp1, value1, timestamp2, value2, ...]
 */
function parseKeepaHistory(csv: number[], days: number): PriceHistoryPoint[] {
  const result: PriceHistoryPoint[] = [];
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  for (let i = 0; i < csv.length - 1; i += 2) {
    const ts = keepaTimestampToDate(csv[i]).getTime();
    if (ts < cutoff) continue;

    const price = parseKeepaPrice(csv[i + 1]);
    if (price <= 0) continue;

    const date = keepaTimestampToDate(csv[i]);
    result.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      timestamp: ts,
      price,
    });
  }

  return result;
}

/**
 * 通过 Chrome Extension Service Worker 调用 Keepa API
 * 规避 CORS 限制
 */
export async function fetchKeepaViaBackground(
  asin: string,
  apiKey: string
): Promise<KeepaApiResponse> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: 'FETCH_KEEPA',
        asin,
        apiKey,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response || { success: false, error: '无响应' });
      }
    );
  });
}

/**
 * 检查 Keepa API Key 是否有效
 */
export async function validateKeepaKey(apiKey: string): Promise<{
  valid: boolean;
  tokensLeft?: number;
  error?: string;
}> {
  if (!apiKey || apiKey.trim().length < 10) {
    return { valid: false, error: 'API Key 格式不正确' };
  }

  try {
    // 使用一个常见 ASIN 来测试
    const result = await fetchKeepaViaBackground('B00X4WHP5E', apiKey);
    if (result.success) {
      return { valid: true, tokensLeft: result.tokensLeft };
    }
    return { valid: false, error: result.error };
  } catch (e) {
    return { valid: false, error: '验证失败' };
  }
}

export type { KeepaProduct, PriceHistoryPoint, KeepaApiResponse };
