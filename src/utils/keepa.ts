// Keepa API 工具类

export interface KeepaProduct {
  asin: string;
  title: string;
  image: string;
  currentPrice: number;
  currentRank: number;
  rating: number;
  reviewCount: number;
  priceHistory: Array<{ date: number; price: number }>;
  rankHistory: Array<{ date: number; rank: number }>;
}

export interface KeepaConfig {
  apiKey: string;
  accessKey: string;
}

export class KeepaAPI {
  private apiKey: string;
  private baseUrl = 'https://api.keepa.com';

  constructor(config: KeepaConfig) {
    this.apiKey = config.apiKey;
  }

  /**
   * 获取产品数据
   * @param asin - 产品ASIN
   * @returns 产品数据
   */
  async getProductData(asin: string): Promise<KeepaProduct | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/product?key=${this.apiKey}&asin=${asin}&domain=1&stats=current`
      );

      if (!response.ok) {
        throw new Error(`Keepa API错误: ${response.status}`);
      }

      const data = await response.json();

      if (!data.products || data.products.length === 0) {
        return null;
      }

      const product = data.products[0];

      return {
        asin: asin,
        title: product.title || '',
        image: product.imagesCSV ? product.imagesCSV.split(',')[0] : '',
        currentPrice: product.stats && product.stats.current ? product.stats.current[0] || 0 : 0,
        currentRank: product.stats && product.stats.current ? product.stats.current[12] || 0 : 0,
        rating: product.stats && product.stats.current ? product.stats.current[18] || 0 : 0,
        reviewCount: product.stats && product.stats.current ? product.stats.current[19] || 0 : 0,
        priceHistory: this.parseHistory(product.data && product.data['0'] ? product.data['0'] : []).map(h => ({ date: h.date, price: h.value })),
        rankHistory: this.parseHistory(product.data && product.data['12'] ? product.data['12'] : []).map(h => ({ date: h.date, rank: h.value }))
      };
    } catch (error) {
      console.error('获取Keepa数据失败:', error);
      throw error;
    }
  }

  /**
   * 批量获取产品数据
   * @param asins - 产品ASIN数组
   * @returns 产品数据数组
   */
  async getBulkProductData(asins: string[]): Promise<KeepaProduct[]> {
    const batchSize = 100; // Keepa限制每批最多100个ASIN
    const results: KeepaProduct[] = [];

    for (let i = 0; i < asins.length; i += batchSize) {
      const batch = asins.slice(i, i + batchSize);
      const batchResults = await this.getBatch(batch);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * 获取一批产品数据
   */
  private async getBatch(asins: string[]): Promise<KeepaProduct[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/product?key=${this.apiKey}&asin=${asins.join(',')}&domain=1&stats=current`
      );

      if (!response.ok) {
        throw new Error(`Keepa API错误: ${response.status}`);
      }

      const data = await response.json();

      if (!data.products) {
        return [];
      }

      return data.products
        .filter((product: any) => product)
        .map((product: any) => ({
          asin: product.asin,
          title: product.title || '',
          image: product.imagesCSV ? product.imagesCSV.split(',')[0] : '',
          currentPrice: product.stats && product.stats.current ? product.stats.current[0] || 0 : 0,
          currentRank: product.stats && product.stats.current ? product.stats.current[12] || 0 : 0,
          rating: product.stats && product.stats.current ? product.stats.current[18] || 0 : 0,
          reviewCount: product.stats && product.stats.current ? product.stats.current[19] || 0 : 0,
          priceHistory: this.parseHistory(product.data && product.data['0'] ? product.data['0'] : []).map(h => ({ date: h.date, price: h.value })),
          rankHistory: this.parseHistory(product.data && product.data['12'] ? product.data['12'] : []).map(h => ({ date: h.date, rank: h.value }))
        }));
    } catch (error) {
      console.error('批量获取Keepa数据失败:', error);
      return [];
    }
  }

  /**
   * 解析历史数据
   * Keepa数据格式：[timestamp1, value1, timestamp2, value2, ...]
   */
  private parseHistory(data: number[]): Array<{ date: number; value: number }> {
    const history: Array<{ date: number; value: number }> = [];

    for (let i = 0; i < data.length; i += 2) {
      if (i + 1 < data.length) {
        history.push({
          date: data[i],
          value: data[i + 1]
        });
      }
    }

    return history;
  }

  /**
   * 检查API Key是否有效
   */
  async validateApiKey(): Promise<boolean> {
    try {
      // 尝试获取一个已知的产品
      const response = await fetch(
        `${this.baseUrl}/product?key=${this.apiKey}&asin=B00N5KWB9H&domain=1&stats=current`
      );

      return response.ok;
    } catch {
      return false;
    }
  }
}

// 导出单例
let keepaAPIInstance: KeepaAPI | null = null;

export function getKeepaAPI(config?: KeepaConfig): KeepaAPI {
  if (!keepaAPIInstance && config) {
    keepaAPIInstance = new KeepaAPI(config);
  }
  if (!keepaAPIInstance) {
    throw new Error('KeepaAPI未初始化，请提供config参数');
  }
  return keepaAPIInstance;
}
