// 数据分析工具类

export interface PriceData {
  date: number;
  price: number;
}

export interface RankData {
  date: number;
  rank: number;
}

export class DataAnalyzer {
  /**
   * 计算价格趋势
   * @param priceHistory - 价格历史数据
   * @returns 趋势方向（上升、下降、平稳）
   */
  static calculatePriceTrend(priceHistory: PriceData[]): 'up' | 'down' | 'stable' {
    if (priceHistory.length < 2) {
      return 'stable';
    }

    const recent = priceHistory.slice(-10); // 取最近10个数据点
    const firstPrice = recent[0].price;
    const lastPrice = recent[recent.length - 1].price;
    const changeRate = ((lastPrice - firstPrice) / firstPrice) * 100;

    if (changeRate > 5) {
      return 'up';
    } else if (changeRate < -5) {
      return 'down';
    } else {
      return 'stable';
    }
  }

  /**
   * 计算排名趋势
   * @param rankHistory - 排名历史数据
   * @returns 趋势方向（上升、下降、平稳）
   */
  static calculateRankTrend(rankHistory: RankData[]): 'up' | 'down' | 'stable' {
    if (rankHistory.length < 2) {
      return 'stable';
    }

    const recent = rankHistory.slice(-10);
    const firstRank = recent[0].rank;
    const lastRank = recent[recent.length - 1].rank;

    // 排名越小越好
    if (lastRank < firstRank * 0.95) {
      return 'up';
    } else if (lastRank > firstRank * 1.05) {
      return 'down';
    } else {
      return 'stable';
    }
  }

  /**
   * 计算平均价格
   */
  static calculateAveragePrice(priceHistory: PriceData[]): number {
    if (priceHistory.length === 0) return 0;

    const sum = priceHistory.reduce((acc, item) => acc + item.price, 0);
    return sum / priceHistory.length;
  }

  /**
   * 计算价格波动率
   */
  static calculatePriceVolatility(priceHistory: PriceData[]): number {
    if (priceHistory.length < 2) return 0;

    const avg = this.calculateAveragePrice(priceHistory);
    const variance = priceHistory.reduce((acc, item) => {
      return acc + Math.pow(item.price - avg, 2);
    }, 0) / priceHistory.length;

    return Math.sqrt(variance) / avg;
  }

  /**
   * 计算利润率
   * @param sellingPrice - 售价
   * @param costPrice - 成本价
   * @param amazonFee - 亚马逊费用
   * @param shippingFee - 运费
   */
  static calculateProfitRate(
    sellingPrice: number,
    costPrice: number,
    amazonFee: number,
    shippingFee: number
  ): number {
    const profit = sellingPrice - costPrice - amazonFee - shippingFee;
    return (profit / sellingPrice) * 100;
  }

  /**
   * 计算竞争指数（基于排名和评价数）
   */
  static calculateCompetitionIndex(rank: number, reviews: number): number {
    // 排名越高（数字越小），竞争越激烈
    const rankScore = Math.max(0, 1 - rank / 10000);

    // 评价数越多，说明市场越成熟，竞争越激烈
    const reviewScore = Math.min(1, reviews / 10000);

    return (rankScore + reviewScore) / 2;
  }

  /**
   * 评估产品潜力
   */
  static evaluateProductPotential(params: {
    price: number;
    rank: number;
    rating: number;
    reviews: number;
    priceTrend: 'up' | 'down' | 'stable';
  }): {
    score: number;
    level: 'high' | 'medium' | 'low';
    reasons: string[];
  } {
    const { price, rank, rating, reviews, priceTrend } = params;
    const reasons: string[] = [];
    let score = 50; // 基础分

    // 价格评估（30-100元价格区间较好）
    if (price >= 30 && price <= 100) {
      score += 20;
      reasons.push('价格区间合理');
    } else if (price > 100) {
      score += 10;
      reasons.push('价格较高，利润空间大');
    } else {
      score -= 10;
      reasons.push('价格过低，利润空间小');
    }

    // 排名评估（前10000较好）
    if (rank < 10000) {
      score += 20;
      reasons.push('排名靠前，销量好');
    } else if (rank < 50000) {
      score += 10;
      reasons.push('排名中等');
    } else {
      score -= 10;
      reasons.push('排名靠后，销量一般');
    }

    // 评分评估
    if (rating >= 4.5) {
      score += 15;
      reasons.push('产品评分高');
    } else if (rating >= 4.0) {
      score += 10;
      reasons.push('产品评分中等');
    } else {
      score -= 5;
      reasons.push('产品评分较低');
    }

    // 评价数评估（有一定评价但不过多）
    if (reviews >= 50 && reviews <= 500) {
      score += 15;
      reasons.push('评价数适中，市场验证过');
    } else if (reviews < 50) {
      score -= 5;
      reasons.push('评价数过少，市场验证不足');
    }

    // 价格趋势
    if (priceTrend === 'up') {
      score += 10;
      reasons.push('价格呈上升趋势');
    } else if (priceTrend === 'down') {
      score -= 10;
      reasons.push('价格呈下降趋势，可能存在价格战');
    }

    // 确定分数在0-100之间
    score = Math.max(0, Math.min(100, score));

    // 确定潜力等级
    let level: 'high' | 'medium' | 'low';
    if (score >= 70) {
      level = 'high';
    } else if (score >= 50) {
      level = 'medium';
    } else {
      level = 'low';
    }

    return { score, level, reasons };
  }
}

// 市场数据分析
export class MarketAnalyzer {
  /**
   * 分析竞品数量
   */
  static async analyzeCompetitorCount(_asin: string): Promise<number> {
    // TODO: 实现竞品数量分析
    // 搜索类似产品并统计数量
    return 0;
  }

  /**
   * 分析市场饱和度
   */
  static async analyzeMarketSaturation(_category: string): Promise<{
    level: 'low' | 'medium' | 'high';
    score: number;
  }> {
    // TODO: 实现市场饱和度分析
    return { level: 'medium', score: 50 };
  }

  /**
   * 预测销量趋势
   */
  static async predictSalesTrend(_rankHistory: RankData[]): Promise<{
    trend: 'increasing' | 'decreasing' | 'stable';
    confidence: 'high' | 'medium' | 'low';
  }> {
    // TODO: 实现销量趋势预测
    return { trend: 'stable', confidence: 'medium' };
  }
}
