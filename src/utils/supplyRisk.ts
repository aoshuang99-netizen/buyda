/**
 * 供应链风险评估系统
 * 四类风险：库存风险、质量风险、交付风险、价格风险
 */

export interface SupplyRiskMetrics {
  // 库存风险
  inventoryTurnoverRate?: number; // 库存周转率（次/年）
  daysSalesOfInventory?: number; // 库存周转天数
  stockoutCount?: number; // 断货次数（近30天）
  overstockValue?: number; // 积压库存价值

  // 质量风险
  defectRate?: number; // 次品率（0-1）
  returnRate?: number; // 退货率（0-1）
  customerComplaints?: number; // 客户投诉数（近30天）
  qualityIncidents?: number; // 质量事故数（近30天）

  // 交付风险
  onTimeDeliveryRate?: number; // 按时交付率（0-1）
  averageDeliveryDays?: number; // 平均交付天数
  delayedDeliveries?: number; // 延迟交付次数（近30天）
  logisticIncidents?: number; // 物流事故数（近30天）

  // 价格风险
  priceVolatility?: number; // 价格波动率（0-1）
  costIncreaseRate?: number; // 成本增长率（0-1）
  priceComparison?: number; // 价格对比指数（1=行业平均）
}

export interface RiskAssessment {
  riskLevel: 'high' | 'medium' | 'low';
  overallScore: number; // 风险综合评分（0-100，越高风险越大）
  risks: {
    inventoryRisk: RiskItem;
    qualityRisk: RiskItem;
    deliveryRisk: RiskItem;
    priceRisk: RiskItem;
  };
  recommendations: string[];
  actionItems: string[];
}

export interface RiskItem {
  level: 'high' | 'medium' | 'low';
  score: number; // 风险评分（0-25）
  indicators: Array<{
    name: string;
    value: number;
    threshold: number;
    status: 'good' | 'warning' | 'critical';
  }>;
  description: string;
}

/**
 * 评估库存风险
 */
function assessInventoryRisk(metrics: SupplyRiskMetrics): RiskItem {
  let score = 0;
  const indicators: RiskItem['indicators'] = [];

  // 库存周转率（正常：>4次/年）
  if (metrics.inventoryTurnoverRate !== undefined) {
    const status = metrics.inventoryTurnoverRate > 4 ? 'good' : metrics.inventoryTurnoverRate > 2 ? 'warning' : 'critical';
    indicators.push({
      name: '库存周转率',
      value: metrics.inventoryTurnoverRate,
      threshold: 4,
      status
    });
    if (status === 'critical') score += 8;
    else if (status === 'warning') score += 4;
  }

  // 库存周转天数（正常：<90天）
  if (metrics.daysSalesOfInventory !== undefined) {
    const status = metrics.daysSalesOfInventory < 90 ? 'good' : metrics.daysSalesOfInventory < 180 ? 'warning' : 'critical';
    indicators.push({
      name: '库存周转天数',
      value: metrics.daysSalesOfInventory,
      threshold: 90,
      status
    });
    if (status === 'critical') score += 7;
    else if (status === 'warning') score += 3;
  }

  // 断货次数（正常：=0次）
  if (metrics.stockoutCount !== undefined) {
    const status = metrics.stockoutCount === 0 ? 'good' : metrics.stockoutCount <= 1 ? 'warning' : 'critical';
    indicators.push({
      name: '断货次数',
      value: metrics.stockoutCount,
      threshold: 0,
      status
    });
    if (status === 'critical') score += 6;
    else if (status === 'warning') score += 3;
  }

  // 积压库存价值（正常：<$1万）
  if (metrics.overstockValue !== undefined) {
    const status = metrics.overstockValue < 10000 ? 'good' : metrics.overstockValue < 50000 ? 'warning' : 'critical';
    indicators.push({
      name: '积压库存价值',
      value: metrics.overstockValue,
      threshold: 10000,
      status
    });
    if (status === 'critical') score += 4;
    else if (status === 'warning') score += 2;
  }

  const level = score > 15 ? 'high' : score > 8 ? 'medium' : 'low';
  const description = `库存风险等级：${level.toUpperCase()}。${level === 'high' ? '库存管理存在严重问题，需要立即优化。' : level === 'medium' ? '库存管理有待改善。' : '库存管理良好。'}`;

  return { level, score, indicators, description };
}

/**
 * 评估质量风险
 */
function assessQualityRisk(metrics: SupplyRiskMetrics): RiskItem {
  let score = 0;
  const indicators: RiskItem['indicators'] = [];

  // 次品率（正常：<2%）
  if (metrics.defectRate !== undefined) {
    const status = metrics.defectRate < 0.02 ? 'good' : metrics.defectRate < 0.05 ? 'warning' : 'critical';
    indicators.push({
      name: '次品率',
      value: metrics.defectRate * 100,
      threshold: 2,
      status
    });
    if (status === 'critical') score += 8;
    else if (status === 'warning') score += 4;
  }

  // 退货率（正常：<5%）
  if (metrics.returnRate !== undefined) {
    const status = metrics.returnRate < 0.05 ? 'good' : metrics.returnRate < 0.10 ? 'warning' : 'critical';
    indicators.push({
      name: '退货率',
      value: metrics.returnRate * 100,
      threshold: 5,
      status
    });
    if (status === 'critical') score += 8;
    else if (status === 'warning') score += 4;
  }

  // 客户投诉数（正常：<5次）
  if (metrics.customerComplaints !== undefined) {
    const status = metrics.customerComplaints < 5 ? 'good' : metrics.customerComplaints < 10 ? 'warning' : 'critical';
    indicators.push({
      name: '客户投诉数',
      value: metrics.customerComplaints,
      threshold: 5,
      status
    });
    if (status === 'critical') score += 5;
    else if (status === 'warning') score += 2;
  }

  // 质量事故数（正常：=0次）
  if (metrics.qualityIncidents !== undefined) {
    const status = metrics.qualityIncidents === 0 ? 'good' : metrics.qualityIncidents <= 2 ? 'warning' : 'critical';
    indicators.push({
      name: '质量事故数',
      value: metrics.qualityIncidents,
      threshold: 0,
      status
    });
    if (status === 'critical') score += 4;
    else if (status === 'warning') score += 2;
  }

  const level = score > 15 ? 'high' : score > 8 ? 'medium' : 'low';
  const description = `质量风险等级：${level.toUpperCase()}。${level === 'high' ? '产品质量严重不稳定，需要立即整顿。' : level === 'medium' ? '产品质量有待提升。' : '产品质量稳定。'}`;

  return { level, score, indicators, description };
}

/**
 * 评估交付风险
 */
function assessDeliveryRisk(metrics: SupplyRiskMetrics): RiskItem {
  let score = 0;
  const indicators: RiskItem['indicators'] = [];

  // 按时交付率（正常：>95%）
  if (metrics.onTimeDeliveryRate !== undefined) {
    const status = metrics.onTimeDeliveryRate > 0.95 ? 'good' : metrics.onTimeDeliveryRate > 0.85 ? 'warning' : 'critical';
    indicators.push({
      name: '按时交付率',
      value: metrics.onTimeDeliveryRate * 100,
      threshold: 95,
      status
    });
    if (status === 'critical') score += 8;
    else if (status === 'warning') score += 4;
  }

  // 平均交付天数（正常：<7天）
  if (metrics.averageDeliveryDays !== undefined) {
    const status = metrics.averageDeliveryDays < 7 ? 'good' : metrics.averageDeliveryDays < 14 ? 'warning' : 'critical';
    indicators.push({
      name: '平均交付天数',
      value: metrics.averageDeliveryDays,
      threshold: 7,
      status
    });
    if (status === 'critical') score += 7;
    else if (status === 'warning') score += 3;
  }

  // 延迟交付次数（正常：=0次）
  if (metrics.delayedDeliveries !== undefined) {
    const status = metrics.delayedDeliveries === 0 ? 'good' : metrics.delayedDeliveries <= 2 ? 'warning' : 'critical';
    indicators.push({
      name: '延迟交付次数',
      value: metrics.delayedDeliveries,
      threshold: 0,
      status
    });
    if (status === 'critical') score += 5;
    else if (status === 'warning') score += 2;
  }

  // 物流事故数（正常：=0次）
  if (metrics.logisticIncidents !== undefined) {
    const status = metrics.logisticIncidents === 0 ? 'good' : metrics.logisticIncidents <= 1 ? 'warning' : 'critical';
    indicators.push({
      name: '物流事故数',
      value: metrics.logisticIncidents,
      threshold: 0,
      status
    });
    if (status === 'critical') score += 5;
    else if (status === 'warning') score += 2;
  }

  const level = score > 15 ? 'high' : score > 8 ? 'medium' : 'low';
  const description = `交付风险等级：${level.toUpperCase()}。${level === 'high' ? '交付问题严重，影响销售和客户满意度。' : level === 'medium' ? '交付能力有待提升。' : '交付能力良好。'}`;

  return { level, score, indicators, description };
}

/**
 * 评估价格风险
 */
function assessPriceRisk(metrics: SupplyRiskMetrics): RiskItem {
  let score = 0;
  const indicators: RiskItem['indicators'] = [];

  // 价格波动率（正常：<10%）
  if (metrics.priceVolatility !== undefined) {
    const status = metrics.priceVolatility < 0.10 ? 'good' : metrics.priceVolatility < 0.20 ? 'warning' : 'critical';
    indicators.push({
      name: '价格波动率',
      value: metrics.priceVolatility * 100,
      threshold: 10,
      status
    });
    if (status === 'critical') score += 8;
    else if (status === 'warning') score += 4;
  }

  // 成本增长率（正常：<5%）
  if (metrics.costIncreaseRate !== undefined) {
    const status = metrics.costIncreaseRate < 0.05 ? 'good' : metrics.costIncreaseRate < 0.10 ? 'warning' : 'critical';
    indicators.push({
      name: '成本增长率',
      value: metrics.costIncreaseRate * 100,
      threshold: 5,
      status
    });
    if (status === 'critical') score += 8;
    else if (status === 'warning') score += 4;
  }

  // 价格对比指数（正常：=1）
  if (metrics.priceComparison !== undefined) {
    const status = metrics.priceComparison <= 1.05 ? 'good' : metrics.priceComparison <= 1.15 ? 'warning' : 'critical';
    indicators.push({
      name: '价格对比指数',
      value: metrics.priceComparison,
      threshold: 1,
      status
    });
    if (status === 'critical') score += 9;
    else if (status === 'warning') score += 4;
  }

  const level = score > 15 ? 'high' : score > 8 ? 'medium' : 'low';
  const description = `价格风险等级：${level.toUpperCase()}。${level === 'high' ? '价格不稳定，严重影响利润。' : level === 'medium' ? '价格波动较大，需要关注。' : '价格稳定。'}`;

  return { level, score, indicators, description };
}

/**
 * 综合评估供应链风险
 */
export function assessSupplyRisk(metrics: SupplyRiskMetrics): RiskAssessment {
  // 评估四类风险
  const inventoryRisk = assessInventoryRisk(metrics);
  const qualityRisk = assessQualityRisk(metrics);
  const deliveryRisk = assessDeliveryRisk(metrics);
  const priceRisk = assessPriceRisk(metrics);

  // 计算综合评分（0-100）
  const overallScore = Math.round(
    (inventoryRisk.score +
      qualityRisk.score +
      deliveryRisk.score +
      priceRisk.score) / 4
  );

  // 确定风险等级
  const riskLevel: RiskAssessment['riskLevel'] =
    overallScore > 15 ? 'high' : overallScore > 8 ? 'medium' : 'low';

  // 生成建议
  const recommendations: string[] = [];
  const actionItems: string[] = [];

  if (inventoryRisk.level !== 'low') {
    recommendations.push('建立安全库存机制，保持30天的安全库存');
    recommendations.push('优化库存预测模型，提高预测准确性');
    actionItems.push('制定库存管理KPI：库存周转率>4次/年');
    actionItems.push('建立断货预警机制，提前3天预警');
  }

  if (qualityRisk.level !== 'low') {
    recommendations.push('严格供应商准入标准，选择高质量供应商');
    recommendations.push('建立质量管理体系，加强质检流程');
    actionItems.push('制定质量KPI：次品率<2%，退货率<5%');
    actionItems.push('与供应商签订质量协议，明确质量标准');
  }

  if (deliveryRisk.level !== 'low') {
    recommendations.push('选择靠谱的物流供应商，建立备用物流渠道');
    recommendations.push('优化供应链流程，缩短交付周期');
    actionItems.push('制定交付KPI：按时交付率>95%');
    actionItems.push('建立交付跟踪机制，实时监控物流状态');
  }

  if (priceRisk.level !== 'low') {
    recommendations.push('与供应商签订长期合同，锁定采购价格');
    recommendations.push('多渠道比价，寻找价格更优的供应商');
    actionItems.push('制定价格监控机制，每周跟踪价格变化');
    actionItems.push('建立价格谈判策略，降低采购成本');
  }

  return {
    riskLevel,
    overallScore,
    risks: {
      inventoryRisk,
      qualityRisk,
      deliveryRisk,
      priceRisk
    },
    recommendations,
    actionItems
  };
}

/**
 * 生成风险评估报告
 */
export function generateRiskReport(assessment: RiskAssessment): string {
  const lines = [
    `# 供应链风险评估报告`,
    '',
    `**风险等级**: ${assessment.riskLevel.toUpperCase()}`,
    `**综合评分**: ${assessment.overallScore} / 100`,
    '',
    `## 风险明细`,
    '',
    `### 1. 库存风险 (${assessment.risks.inventoryRisk.level.toUpperCase()})`,
    `**评分**: ${assessment.risks.inventoryRisk.score} / 25`,
    assessment.risks.inventoryRisk.description,
    '',
    `### 2. 质量风险 (${assessment.risks.qualityRisk.level.toUpperCase()})`,
    `**评分**: ${assessment.risks.qualityRisk.score} / 25`,
    assessment.risks.qualityRisk.description,
    '',
    `### 3. 交付风险 (${assessment.risks.deliveryRisk.level.toUpperCase()})`,
    `**评分**: ${assessment.risks.deliveryRisk.score} / 25`,
    assessment.risks.deliveryRisk.description,
    '',
    `### 4. 价格风险 (${assessment.risks.priceRisk.level.toUpperCase()})`,
    `**评分**: ${assessment.risks.priceRisk.score} / 25`,
    assessment.risks.priceRisk.description,
    ''
  ];

  if (assessment.recommendations.length > 0) {
    lines.push('## 优化建议', '');
    assessment.recommendations.forEach(rec => {
      lines.push(`- ${rec}`);
    });
    lines.push('');
  }

  if (assessment.actionItems.length > 0) {
    lines.push('## 行动清单', '');
    assessment.actionItems.forEach((item, index) => {
      lines.push(`${index + 1}. ${item}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}
