/**
 * 智能避坑预警系统
 * 检测选品过程中的五大认知误区
 */

export interface Pitfall {
  id: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  detection: string; // 检测条件
  advice: string; // 建议
  relatedTopics: string[];
}

export interface PitfallReport {
  totalPitfalls: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
  pitfalls: Pitfall[];
}

/**
 * 五大认知误区定义
 */
export const FIVE_PITFALLS: Pitfall[] = [
  {
    id: 'pitfall_1',
    category: '认知误区',
    severity: 'high',
    title: '只看销量不看利润',
    description: '错误地认为销量高就是好产品，忽略了利润率的重要性。',
    detection: '销量高但利润率低于10%时触发',
    advice: '**正确做法：**\n\n1. **利润率优先**：利润率是第一指标，建议≥15%\n2. **计算真实成本**：\n   - 产品成本 + FBA费用 + 广告费 + 运费 + 其他成本\n3. **ROI计算**：ROI = (销售价 - 总成本) / 总成本 × 100%\n4. **决策标准**：\n   - 日销50单×$5利润 = $250/天\n   - 日销200单×$1利润 = $200/天\n   - 利润更重要！\n5. **优化策略**：\n   - 降低成本：优化供应链\n   - 提高售价：差异化定位\n   - 控制广告费：优化ACoS',
    relatedTopics: ['利润计算', 'ROI', '成本优化']
  },
  {
    id: 'pitfall_2',
    category: '认知误区',
    severity: 'high',
    title: '盲目跟风爆款',
    description: '看到别人卖什么就跟着做，没有分析产品生命周期和市场阶段。',
    detection: '选择月搜索量>80万或新品占比<10%的产品时触发',
    advice: '**正确做法：**\n\n1. **产品生命周期分析**：\n   - 上升期：进入黄金期 ✅\n   - 成熟期：竞争激烈，需差异化 ⚠️\n   - 衰退期：避免进入 ❌\n\n2. **趋势判定**：\n   - 环比增长>15%：上升趋势\n   - 环比增长<5%：衰退趋势\n   - 新品占比>30%：创新趋势\n\n3. **市场分级**：\n   - 冷门市场（0-3万）：机会型，适合新手\n   - 小型市场（3-8万）：探索型\n   - 中型市场（15-30万）：成长型\n   - 大型市场（50-80万）：激烈型\n   - 超红海（80万+）：避免进入！\n\n4. **差异化策略**：\n   - 产品差异化：功能、设计、材质\n   - 营销差异化：定位、人群、渠道\n   - 服务差异化：售后、定制、增值\n\n5. **案例分析**：\n   - 爆款A：月销1万单，利润$2 → $2万/天\n   - 差异化B：月销200单，利润$10 → $2千/天\n   - 但B更容易生存和盈利！',
    relatedTopics: ['产品生命周期', '趋势判定', '市场分级', '差异化']
  },
  {
    id: 'pitfall_3',
    category: '认知误区',
    severity: 'high',
    title: '忽视垄断风险',
    description: '认为大市场就有大机会，忽略了垄断严重程度对新进入者的威胁。',
    detection: 'CR3>60%或广告密度>40%时触发',
    advice: '**正确做法：**\n\n1. **垄断风险评估**：\n   - **CR3指标**（前3品牌销量占比）：\n     * >60%：🔴 高风险，垄断严重\n     * 40%-60%：🟠 中风险，集中度高\n     * <40%：🟢 低风险，竞争充分\n   - **广告密度**（广告竞品数/总竞品数）：\n     * >40%：🔴 高风险\n     * 25%-40%：🟠 中风险\n     * <25%：🟢 低风险\n   - **价格集中度**（TOP10价格区间占比）：\n     * >50%：🔴 高风险\n     * 30%-50%：🟠 中风险\n     * <30%：🟢 低风险\n\n2. **综合风险判定**：\n   - 任一高风险 → 高风险市场\n   - 两个中风险 → 高风险市场\n   - 三个低风险 → 低风险市场\n\n3. **应对策略**：\n   - **高风险市场**：果断放弃\n   - **中风险市场**：谨慎进入，需要强差异化\n   - **低风险市场**：可以进入\n\n4. **真实案例**：\n   - 案例1：CR3=70%，大品牌垄断，新进入者失败率90%\n   - 案例2：CR3=25%，竞争分散，新进入者成功率60%\n\n5. **选品原则**：\n   - 宁选小市场做第一，不做大市场的炮灰',
    relatedTopics: ['垄断风险', 'CR3', '广告密度', '风险评估']
  },
  {
    id: 'pitfall_4',
    category: '认知误区',
    severity: 'medium',
    title: '只做不做数据分析',
    description: '凭感觉选品，不收集数据，没有建立科学的评分系统。',
    detection: '缺少市场数据（搜索量、竞争数据、趋势数据）时触发',
    advice: '**正确做法：**\n\n1. **数据收集**：\n   - **市场数据**：月搜索量、购买量\n   - **竞争数据**：竞品数量、广告密度、CPC\n   - **趋势数据**：环比增长、同比增长、新品占比\n   - **价格数据**：价格分布、平均利润率\n   - **评价数据**：评分、评价数量、好评率\n\n2. **评分系统**：\n   - **五维评估模型**（100分制）：\n     * 市场体量（30%）：月搜索量/购买量\n     * 竞争强度（25%）：广告竞品数/CPC/集中度\n     * 利润空间（20%）：毛利率/利润率\n     * 趋势指数（15%）：环比/同比增长率\n     * 供应链优势（10%）：货源质量/交付周期\n   - **评分等级**：\n     * ≥80分：⭐⭐⭐ 强烈推荐\n     * 60-79分：⭐⭐ 可以尝试\n     * 40-59分：⭐ 需谨慎\n     * <40分：⛔ 不建议进入\n\n3. **数据工具**：\n   - 使用选品工具收集数据\n   - 建立Excel评分表\n   - 使用可视化工具（雷达图、漏斗图）\n\n4. **决策原则**：\n   - 不看数据，不决策\n   - 数据不对，不决策\n   - 数据不全，不决策\n\n5. **持续优化**：\n   - 记录每次选品的数据\n   - 总结成功/失败的经验\n   - 优化评分标准和权重',
    relatedTopics: ['数据分析', '评分系统', '五维评估', '决策原则']
  },
  {
    id: 'pitfall_5',
    category: '认知误区',
    severity: 'high',
    title: '忽视供应链风险',
    description: '只关注产品本身，不考虑货源质量、交付周期等供应链风险。',
    detection: '货源质量评分<60分或交付周期>7天时触发',
    advice: '**正确做法：**\n\n1. **供应链风险识别**：\n   - **库存风险**🔴：\n     * 断货：影响排名和销量\n     * 积压：资金占用，仓储成本\n     * 风险等级：高风险\n   - **质量风险**🔴：\n     * 质量不稳定：退货率上升\n     * 次品率高：成本增加，评价下降\n     * 风险等级：高风险\n   - **交付风险**🟠：\n     * 交付延迟：影响补货周期\n     * 物流中断：影响销售\n     * 风险等级：中风险\n   - **价格风险**🟡：\n     * 价格波动：利润不稳定\n     * 成本上涨：利润压缩\n     * 风险等级：低风险\n\n2. **货源质量评估**：\n   - **五维度评分**（100分制）：\n     * 供应商评分（30分）：超级工厂/钻石/诚信通\n     * 产品质量（25分）：实拍图/认证/销量/好评率\n     * 价格优势（20分）：低于/等于/高于行业平均\n     * 交付周期（15分）：48h/3-5天/7天以上\n     * 服务能力（10分）：定制/样品/售后\n   - **评分等级**：\n     * >80分：优质货源\n     * 60-80分：合格货源\n     * <60分：不合格货源\n\n3. **风险应对策略**：\n   - **库存风险**：\n     * 建立安全库存（30天）\n     * 预测需求周期\n     * 避免断货风险\n   - **质量风险**：\n     * 多供应商备选\n     * 严格质检流程\n     * 签订质量协议\n   - **交付风险**：\n     * 选择靠谱供应商\n     * 备用物流渠道\n     * 跟踪发货进度\n   - **价格风险**：\n     * 签订长期合同\n     * 锁定采购价格\n     * 多渠道比价\n\n4. **供应链管理原则**：\n   - 没有好货源，就没有好产品\n   - 不要贪便宜，质量第一\n   - 多供应商备选，分散风险\n   - 长期合作，建立信任\n\n5. **真实案例**：\n   - 案例1：选错供应商，次品率20%，退货率15%，亏损$5万\n   - 案例2：建立3家供应商备选，质量稳定，持续盈利',
    relatedTopics: ['供应链风险', '货源质量', '库存风险', '质量风险', '交付风险']
  }
];

/**
 * 检测认知误区
 */
export function detectPitfalls(
  metrics: {
    dailySales?: number;
    profitMargin?: number;
    monthlySearchVolume?: number;
    newProductRatio?: number;
    cr3?: number;
    adDensity?: number;
    supplyScore?: number;
    deliveryDays?: number;
    hasMarketData?: boolean;
  }
): PitfallReport {
  const detectedPitfalls: Pitfall[] = [];

  // 误区1：只看销量不看利润
  if (metrics.dailySales && metrics.profitMargin) {
    if (metrics.dailySales > 50 && metrics.profitMargin < 10) {
      detectedPitfalls.push(FIVE_PITFALLS[0]);
    }
  }

  // 误区2：盲目跟风爆款
  if (metrics.monthlySearchVolume && metrics.newProductRatio) {
    if (metrics.monthlySearchVolume > 800000 || metrics.newProductRatio < 10) {
      detectedPitfalls.push(FIVE_PITFALLS[1]);
    }
  }

  // 误区3：忽视垄断风险
  if (metrics.cr3 && metrics.adDensity) {
    if (metrics.cr3 > 60 || metrics.adDensity > 40) {
      detectedPitfalls.push(FIVE_PITFALLS[2]);
    }
  }

  // 误区4：只做不做数据分析
  if (metrics.hasMarketData === false) {
    detectedPitfalls.push(FIVE_PITFALLS[3]);
  }

  // 误区5：忽视供应链风险
  if (metrics.supplyScore && metrics.deliveryDays) {
    if (metrics.supplyScore < 60 || metrics.deliveryDays > 7) {
      detectedPitfalls.push(FIVE_PITFALLS[4]);
    }
  }

  // 统计各严重程度数量
  const highSeverity = detectedPitfalls.filter(p => p.severity === 'high').length;
  const mediumSeverity = detectedPitfalls.filter(p => p.severity === 'medium').length;
  const lowSeverity = detectedPitfalls.filter(p => p.severity === 'low').length;

  return {
    totalPitfalls: detectedPitfalls.length,
    highSeverity,
    mediumSeverity,
    lowSeverity,
    pitfalls: detectedPitfalls
  };
}

/**
 * 获取所有认知误区
 */
export function getAllPitfalls(): Pitfall[] {
  return FIVE_PITFALLS;
}

/**
 * 按严重程度获取认知误区
 */
export function getPitfallsBySeverity(severity: 'high' | 'medium' | 'low'): Pitfall[] {
  return FIVE_PITFALLS.filter(p => p.severity === severity);
}
