/**
 * Buyda 产品评分系统 v2.0
 * 基于选品策略白皮书五维评估模型
 * 
 * 核心评估维度：
 * 1. 市场体量（30%权重） - 月搜索量/购买量
 * 2. 竞争强度（25%权重） - 广告竞品数/CPC/集中度
 * 3. 利润空间（20%权重） - 毛利率/利润率
 * 4. 趋势指数（15%权重） - 环比/同比增长率
 * 5. 供应链优势（10%权重） - 1688货源质量/交付周期
 */

export interface ScoreDimension {
  weight: number; // 权重（百分比）
  score: number; // 得分（0-100）
  details: string; // 详细说明
  data: any; // 原始数据
}

export interface ProductScore {
  productInfo: {
    asin: string;
    title: string;
    category: string;
    scoreDate: string;
  };
  dimensions: {
    marketVolume: ScoreDimension; // 市场体量
    competition: ScoreDimension; // 竞争强度
    profitSpace: ScoreDimension; // 利润空间
    trendIndex: ScoreDimension; // 趋势指数
    supplyChain: ScoreDimension; // 供应链优势
  };
  totalScore: number; // 综合评分（0-100）
  recommendationLevel: "⭐⭐⭐" | "⭐⭐" | "⭐" | "⛔";
  riskAlerts: string[];
  suggestions: string[];
}

/**
 * 市场分级标准
 */
export const MARKET_SIZE_LEVELS = {
  COLD: { min: 0, max: 30000, label: "冷门市场", color: "🟢", type: "机会型" },
  SMALL: { min: 30000, max: 80000, label: "小型市场", color: "🟡", type: "探索型" },
  MEDIUM_SMALL: { min: 80000, max: 150000, label: "中小型市场", color: "🟡", type: "稳定型" },
  MEDIUM: { min: 150000, max: 300000, label: "中型市场", color: "🔵", type: "成长型" },
  LARGE: { min: 300000, max: 500000, label: "中大型市场", color: "🔵", type: "扩张型" },
  HUGE: { min: 500000, max: 800000, label: "大型市场", color: "🟠", type: "激烈型" },
  SUPER_RED: { min: 800000, max: Infinity, label: "超红海", color: "🔴", type: "红海型" }
};

/**
 * 趋势判定标准
 */
export const TRENDS = {
  MOM_GROWTH_THRESHOLD: 15, // 环比增长阈值
  YOY_GROWTH_THRESHOLD: 20, // 同比增长阈值
  NEW_PRODUCT_RATIO: 30, // 新品占比阈值
};

/**
 * 垄断风险评估阈值
 */
export const MONOPOLY_RISKS = {
  CR3_THRESHOLD: 60, // CR3 风险阈值
  AD_DENSITY_THRESHOLD: 40, // 广告密度阈值
  PRICE_CONCENTRATION_THRESHOLD: 50 // 价格集中度阈值
};

/**
 * 评分市场体量维度
 */
export function scoreMarketVolume(monthlySearchVolume: number, monthlySales: number): ScoreDimension {
  let score = 0;
  let level = "";
  let color = "";

  // 根据月搜索量判定市场等级
  if (monthlySearchVolume < 30000) {
    score = 40; // 冷门市场，潜力有限
    level = "冷门市场";
    color = "🟢";
  } else if (monthlySearchVolume < 80000) {
    score = 60; // 小型市场，有机会
    level = "小型市场";
    color = "🟡";
  } else if (monthlySearchVolume < 150000) {
    score = 70; // 中小型，稳定型
    level = "中小型市场";
    color = "🟡";
  } else if (monthlySearchVolume < 300000) {
    score = 85; // 中型市场，成长型
    level = "中型市场";
    color = "🔵";
  } else if (monthlySearchVolume < 500000) {
    score = 90; // 中大型，扩张型
    level = "中大型市场";
    color = "🔵";
  } else if (monthlySearchVolume < 800000) {
    score = 95; // 大型市场，激烈型
    level = "大型市场";
    color = "🟠";
  } else {
    score = 50; // 超红海，竞争激烈
    level = "超红海";
    color = "🔴";
  }

  return {
    weight: 30,
    score,
    details: `月搜索量: ${(monthlySearchVolume / 1000).toFixed(0)}K (${level})`,
    data: { monthlySearchVolume, monthlySales, level, color }
  };
}

/**
 * 评分竞争强度维度
 */
export function scoreCompetition(
  adCompetitorCount: number,
  cpc: number,
  concentration: number
): ScoreDimension {
  let score = 100;
  let alerts: string[] = [];

  // 广告竞品数评分（越多竞争越激烈）
  if (adCompetitorCount > 50) {
    score -= 30;
    alerts.push("广告竞品过多（>50个）");
  } else if (adCompetitorCount > 30) {
    score -= 20;
    alerts.push("广告竞品较多（>30个）");
  } else if (adCompetitorCount > 10) {
    score -= 10;
  }

  // CPC 评分（越高竞争越激烈）
  if (cpc > 3) {
    score -= 25;
    alerts.push(`CPC过高（$${cpc}）`);
  } else if (cpc > 2) {
    score -= 15;
    alerts.push(`CPC较高（$${cpc}）`);
  } else if (cpc > 1) {
    score -= 5;
  }

  // 集中度评分（越高垄断越严重）
  if (concentration > 60) {
    score -= 25;
    alerts.push(`市场集中度过高（${concentration}%）`);
  } else if (concentration > 40) {
    score -= 15;
    alerts.push(`市场集中度较高（${concentration}%）`);
  } else if (concentration > 20) {
    score -= 5;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    weight: 25,
    score,
    details: `广告竞品: ${adCompetitorCount}个 | CPC: $${cpc} | 集中度: ${concentration}%`,
    data: { adCompetitorCount, cpc, concentration, alerts }
  };
}

/**
 * 评分利润空间维度
 */
export function scoreProfitSpace(
  costPrice: number,
  sellingPrice: number,
  platformFee: number
): ScoreDimension {
  const grossProfit = sellingPrice - costPrice - platformFee;
  const profitMargin = (grossProfit / sellingPrice) * 100;

  let score = 0;
  let alerts: string[] = [];

  // 利润率评分
  if (profitMargin < 10) {
    score = 30;
    alerts.push("利润率过低（<10%）");
  } else if (profitMargin < 20) {
    score = 50;
    alerts.push("利润率偏低（<20%）");
  } else if (profitMargin < 30) {
    score = 70;
    alerts.push("利润率一般（<30%）");
  } else if (profitMargin < 40) {
    score = 90;
  } else {
    score = 100;
  }

  return {
    weight: 20,
    score,
    details: `毛利率: ${profitMargin.toFixed(1)}% ($${grossProfit.toFixed(2)})`,
    data: { costPrice, sellingPrice, platformFee, grossProfit, profitMargin, alerts }
  };
}

/**
 * 评分趋势指数维度
 */
export function scoreTrendIndex(
  momGrowth: number, // 环比增长率
  yoyGrowth: number, // 同比增长率
  newProductRatio: number // 新品占比
): ScoreDimension {
  let score = 50; // 默认平稳
  let trends: string[] = [];

  // 环比增长判定
  if (momGrowth > 15) {
    score += 15;
    trends.push("🚀 上升趋势");
  } else if (momGrowth < -10) {
    score -= 20;
    trends.push("⚠️ 衰退预警");
  }

  // 同比增长判定
  if (yoyGrowth > 20) {
    score += 15;
    trends.push("📈 爆发趋势");
  }

  // 新品占比判定
  if (newProductRatio > 30) {
    score += 15;
    trends.push("🆕 创新趋势");
  } else if (newProductRatio < 10) {
    score -= 10;
    trends.push("⚠️ 固化预警");
  }

  score = Math.max(0, Math.min(100, score));

  return {
    weight: 15,
    score,
    details: `环比: ${momGrowth}% | 同比: ${yoyGrowth}% | 新品占比: ${newProductRatio}%`,
    data: { momGrowth, yoyGrowth, newProductRatio, trends }
  };
}

/**
 * 评分供应链优势维度
 */
export function scoreSupplyChain(
  supplier1688Score: number, // 1688供应商评分（0-5）
  deliveryCycle: number, // 交付周期（天）
  supplierCreditYears: number // 供应商诚信通年限
): ScoreDimension {
  let score = 0;
  let details: string[] = [];

  // 供应商评分（0-5分）
  const supplierScore = (supplier1688Score / 5) * 100;
  score = supplierScore;

  // 交付周期惩罚
  if (deliveryCycle > 10) {
    score -= 20;
    details.push("交付周期过长");
  } else if (deliveryCycle > 7) {
    score -= 10;
    details.push("交付周期较长");
  }

  // 供应商信用加分
  if (supplierCreditYears >= 5) {
    score += 10;
    details.push("供应商信用良好");
  } else if (supplierCreditYears >= 3) {
    score += 5;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    weight: 10,
    score,
    details: `1688评分: ${supplier1688Score}/5 | 交付: ${deliveryCycle}天 | 诚信通: ${supplierCreditYears}年`,
    data: { supplier1688Score, deliveryCycle, supplierCreditYears }
  };
}

/**
 * 计算综合评分
 */
export function calculateTotalScore(dimensions: {
  marketVolume: ScoreDimension;
  competition: ScoreDimension;
  profitSpace: ScoreDimension;
  trendIndex: ScoreDimension;
  supplyChain: ScoreDimension;
}): number {
  const totalScore =
    dimensions.marketVolume.score * (dimensions.marketVolume.weight / 100) +
    dimensions.competition.score * (dimensions.competition.weight / 100) +
    dimensions.profitSpace.score * (dimensions.profitSpace.weight / 100) +
    dimensions.trendIndex.score * (dimensions.trendIndex.weight / 100) +
    dimensions.supplyChain.score * (dimensions.supplyChain.weight / 100);

  return Math.round(totalScore);
}

/**
 * 判定推荐等级
 */
export function getRecommendationLevel(totalScore: number): "⭐⭐⭐" | "⭐⭐" | "⭐" | "⛔" {
  if (totalScore >= 80) return "⭐⭐⭐";
  if (totalScore >= 60) return "⭐⭐";
  if (totalScore >= 40) return "⭐";
  return "⛔";
}

/**
 * 生成风险提示
 */
export function generateRiskAlerts(dimensions: {
  marketVolume: ScoreDimension;
  competition: ScoreDimension;
  profitSpace: ScoreDimension;
  trendIndex: ScoreDimension;
  supplyChain: ScoreDimension;
}): string[] {
  const alerts: string[] = [];

  // 市场体量风险
  if (dimensions.marketVolume.score < 50) {
    alerts.push("市场体量较小，需求有限");
  }

  // 竞争强度风险
  if (dimensions.competition.score < 50) {
    alerts.push("竞争激烈，需差异化策略");
  }

  // 利润空间风险
  if (dimensions.profitSpace.score < 50) {
    alerts.push("利润率偏低，需控制成本");
  }

  // 趋势指数风险
  if (dimensions.trendIndex.score < 40) {
    alerts.push("趋势下行，市场萎缩风险");
  }

  // 供应链风险
  if (dimensions.supplyChain.score < 50) {
    alerts.push("供应链风险，需谨慎选择");
  }

  return alerts;
}

/**
 * 生成建议
 */
export function generateSuggestions(totalScore: number, dimensions: any): string[] {
  const suggestions: string[] = [];

  if (totalScore >= 80) {
    suggestions.push("✅ 综合评分优秀，强烈推荐");
    suggestions.push("💡 建议快速进入市场");
  } else if (totalScore >= 60) {
    suggestions.push("⚠️ 综合评分良好，可以尝试");
    suggestions.push("💡 建议优化利润空间");
  } else if (totalScore >= 40) {
    suggestions.push("⚠️ 综合评分一般，需谨慎");
    suggestions.push("💡 建议降低成本或提升差异化");
  } else {
    suggestions.push("⛔ 综合评分较低，不建议进入");
    suggestions.push("💡 建议寻找其他产品机会");
  }

  // 维度级建议
  if (dimensions.marketVolume.score < 50) {
    suggestions.push("📊 市场体量较小，考虑拓展关联市场");
  }

  if (dimensions.competition.score < 50) {
    suggestions.push("⚔️ 竞争激烈，建议差异化定位或寻找细分市场");
  }

  if (dimensions.profitSpace.score < 60) {
    suggestions.push("💰 利润空间不足，建议优化供应链或提高售价");
  }

  if (dimensions.trendIndex.score < 50) {
    suggestions.push("📉 趋势下行，建议观望或寻找新兴品类");
  }

  return suggestions;
}

/**
 * 完整产品评分计算
 */
export function calculateProductScore(
  productData: {
    asin: string;
    title: string;
    category: string;
    monthlySearchVolume: number;
    monthlySales: number;
    adCompetitorCount: number;
    cpc: number;
    concentration: number;
    costPrice: number;
    sellingPrice: number;
    platformFee: number;
    momGrowth: number;
    yoyGrowth: number;
    newProductRatio: number;
    supplier1688Score: number;
    deliveryCycle: number;
    supplierCreditYears: number;
  }
): ProductScore {
  // 评分各维度
  const dimensions = {
    marketVolume: scoreMarketVolume(productData.monthlySearchVolume, productData.monthlySales),
    competition: scoreCompetition(productData.adCompetitorCount, productData.cpc, productData.concentration),
    profitSpace: scoreProfitSpace(productData.costPrice, productData.sellingPrice, productData.platformFee),
    trendIndex: scoreTrendIndex(productData.momGrowth, productData.yoyGrowth, productData.newProductRatio),
    supplyChain: scoreSupplyChain(productData.supplier1688Score, productData.deliveryCycle, productData.supplierCreditYears)
  };

  // 计算综合评分
  const totalScore = calculateTotalScore(dimensions);

  // 判定推荐等级
  const recommendationLevel = getRecommendationLevel(totalScore);

  // 生成风险提示
  const riskAlerts = generateRiskAlerts(dimensions);

  // 生成建议
  const suggestions = generateSuggestions(totalScore, dimensions);

  return {
    productInfo: {
      asin: productData.asin,
      title: productData.title,
      category: productData.category,
      scoreDate: new Date().toISOString()
    },
    dimensions,
    totalScore,
    recommendationLevel,
    riskAlerts,
    suggestions
  };
}

/**
 * Mock 数据生成器（用于演示）
 */
export function generateMockProductScore(): ProductScore {
  return calculateProductScore({
    asin: "B08XZYMQ6Y",
    title: "Wireless Bluetooth Earbuds with Noise Cancelling",
    category: "Electronics",
    monthlySearchVolume: 150000,
    monthlySales: 5000,
    adCompetitorCount: 45,
    cpc: 1.8,
    concentration: 55,
    costPrice: 15,
    sellingPrice: 29.99,
    platformFee: 6,
    momGrowth: 18,
    yoyGrowth: 25,
    newProductRatio: 32,
    supplier1688Score: 4.2,
    deliveryCycle: 5,
    supplierCreditYears: 5
  });
}
