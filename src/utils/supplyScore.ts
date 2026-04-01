/**
 * 1688货源质量评分卡
 * 五维度评估：供应商、产品质量、价格优势、交付周期、服务能力
 */

export interface SupplyQualityMetrics {
  // 供应商评分（30分）
  supplierType: 'super_factory' | 'diamond' | 'verified' | 'normal'; // 超级工厂/钻石/诚信通/普通
  supplierRating?: number; // 供应商评分（0-5分）

  // 产品质量（25分）
  hasRealPhotos: boolean; // 实拍图展示
  hasCertifications: boolean; // 产品认证
  monthlySales: number; // 月销量
  positiveRate: number; // 好评率（0-1）

  // 价格优势（20分）
  productPrice: number; // 产品价格
  industryAveragePrice: number; // 行业平均价格

  // 交付周期（15分）
  deliveryDays: number; // 交付天数

  // 服务能力（10分）
  supportsCustomization: boolean; // 支持定制
  providesSamples: boolean; // 提供样品
  hasAfterSales: boolean; // 售后保障
}

export interface SupplyQualityScore {
  totalScore: number; // 总分（0-100）
  grade: 'A' | 'B' | 'C' | 'D'; // 等级
  gradeLabel: string; // 等级标签
  breakdown: {
    supplierScore: number; // 供应商评分（0-30）
    productQualityScore: number; // 产品质量（0-25）
    priceAdvantageScore: number; // 价格优势（0-20）
    deliveryScore: number; // 交付周期（0-15）
    serviceScore: number; // 服务能力（0-10）
  };
  recommendations: string[]; // 建议
  risks: string[]; // 风险
}

/**
 * 计算货源质量评分
 */
export function calculateSupplyQualityScore(
  metrics: SupplyQualityMetrics
): SupplyQualityScore {
  // 1. 供应商评分（30分）
  let supplierScore = 0;
  switch (metrics.supplierType) {
    case 'super_factory':
      supplierScore = 30;
      break;
    case 'diamond':
      supplierScore = metrics.supplierRating ? Math.min(24, metrics.supplierRating * 5) : 20;
      break;
    case 'verified':
      supplierScore = metrics.supplierRating ? Math.min(19, metrics.supplierRating * 4) : 15;
      break;
    case 'normal':
      supplierScore = metrics.supplierRating ? Math.min(14, metrics.supplierRating * 3) : 0;
      break;
  }

  // 2. 产品质量（25分）
  let productQualityScore = 0;
  if (metrics.hasRealPhotos) productQualityScore += 10;
  if (metrics.hasCertifications) productQualityScore += 5;
  if (metrics.monthlySales >= 10000) productQualityScore += 5;
  else if (metrics.monthlySales >= 1000) productQualityScore += 3;
  else if (metrics.monthlySales >= 100) productQualityScore += 1;
  if (metrics.positiveRate >= 0.98) productQualityScore += 5;
  else if (metrics.positiveRate >= 0.95) productQualityScore += 3;
  else if (metrics.positiveRate >= 0.90) productQualityScore += 1;

  // 3. 价格优势（20分）
  let priceAdvantageScore = 0;
  const priceRatio = metrics.industryAveragePrice / metrics.productPrice;
  if (priceRatio > 1.1) {
    // 价格低于行业平均10%以上
    priceAdvantageScore = 20;
  } else if (priceRatio >= 1.0) {
    // 价格与行业平均持平
    priceAdvantageScore = 10;
  } else if (priceRatio >= 0.9) {
    // 价格高于行业平均0-10%
    priceAdvantageScore = 5;
  } else {
    // 价格高于行业平均10%以上
    priceAdvantageScore = 0;
  }

  // 4. 交付周期（15分）
  let deliveryScore = 0;
  if (metrics.deliveryDays <= 2) {
    deliveryScore = 15;
  } else if (metrics.deliveryDays <= 5) {
    deliveryScore = 10;
  } else if (metrics.deliveryDays <= 7) {
    deliveryScore = 5;
  }

  // 5. 服务能力（10分）
  let serviceScore = 0;
  if (metrics.supportsCustomization) serviceScore += 5;
  if (metrics.providesSamples) serviceScore += 3;
  if (metrics.hasAfterSales) serviceScore += 2;

  // 总分
  const totalScore =
    supplierScore +
    productQualityScore +
    priceAdvantageScore +
    deliveryScore +
    serviceScore;

  // 等级评定
  let grade: SupplyQualityScore['grade'];
  let gradeLabel: string;
  if (totalScore >= 80) {
    grade = 'A';
    gradeLabel = '优质货源';
  } else if (totalScore >= 60) {
    grade = 'B';
    gradeLabel = '合格货源';
  } else if (totalScore >= 40) {
    grade = 'C';
    gradeLabel = '勉强可用';
  } else {
    grade = 'D';
    gradeLabel = '不合格货源';
  }

  // 建议
  const recommendations: string[] = [];
  if (supplierScore < 20) {
    recommendations.push('建议选择更高级别的供应商（超级工厂或钻石供应商）');
  }
  if (productQualityScore < 15) {
    recommendations.push('建议要求供应商提供实拍图和产品认证');
  }
  if (priceAdvantageScore < 10) {
    recommendations.push('建议与供应商协商价格或寻找价格更优的供应商');
  }
  if (deliveryScore < 10) {
    recommendations.push('建议要求供应商缩短交付周期');
  }
  if (serviceScore < 5) {
    recommendations.push('建议选择支持定制和提供样品的供应商');
  }

  // 风险
  const risks: string[] = [];
  if (totalScore < 40) {
    risks.push('🔴 高风险：货源质量差，建议立即更换供应商');
  } else if (totalScore < 60) {
    risks.push('🟠 中风险：货源质量一般，需要加强质量控制');
  }
  if (metrics.deliveryDays > 7) {
    risks.push('⚠️ 交付周期长，可能影响补货速度');
  }
  if (metrics.positiveRate < 0.90) {
    risks.push('⚠️ 好评率低，产品质量可能不稳定');
  }
  if (!metrics.hasCertifications) {
    risks.push('⚠️ 缺少产品认证，可能存在合规风险');
  }

  return {
    totalScore: Math.round(totalScore),
    grade,
    gradeLabel,
    breakdown: {
      supplierScore,
      productQualityScore,
      priceAdvantageScore,
      deliveryScore,
      serviceScore
    },
    recommendations,
    risks
  };
}

/**
 * 比较多个供应商
 */
export function compareSuppliers(
  suppliers: Array<{ name: string; metrics: SupplyQualityMetrics }>
): Array<{ name: string; score: SupplyQualityScore }> {
  return suppliers
    .map(supplier => ({
      name: supplier.name,
      score: calculateSupplyQualityScore(supplier.metrics)
    }))
    .sort((a, b) => b.score.totalScore - a.score.totalScore);
}

/**
 * 生成评分报告文本
 */
export function generateScoreReport(score: SupplyQualityScore): string {
  const lines = [
    `# 1688货源质量评分报告`,
    '',
    `**总分**: ${score.totalScore} / 100`,
    `**等级**: ${score.grade} - ${score.gradeLabel}`,
    '',
    `## 评分明细`,
    '',
    `### 1. 供应商评分 (${score.breakdown.supplierScore} / 30)`,
    `评估供应商的资质和信誉等级`,
    '',
    `### 2. 产品质量 (${score.breakdown.productQualityScore} / 25)`,
    `评估产品质量、认证、销量和好评率`,
    '',
    `### 3. 价格优势 (${score.breakdown.priceAdvantageScore} / 20)`,
    `评估价格相对行业平均的优势`,
    '',
    `### 4. 交付周期 (${score.breakdown.deliveryScore} / 15)`,
    `评估供应商的发货速度`,
    '',
    `### 5. 服务能力 (${score.breakdown.serviceScore} / 10)`,
    `评估定制、样品、售后等服务`,
    ''
  ];

  if (score.recommendations.length > 0) {
    lines.push('## 优化建议', '');
    score.recommendations.forEach(rec => {
      lines.push(`- ${rec}`);
    });
    lines.push('');
  }

  if (score.risks.length > 0) {
    lines.push('## 风险提示', '');
    score.risks.forEach(risk => {
      lines.push(`- ${risk}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}
