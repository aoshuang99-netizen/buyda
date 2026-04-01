import React, { useState } from 'react';
import { calculateSupplyQualityScore, generateScoreReport, type SupplyQualityMetrics, type SupplyQualityScore } from '../utils/supplyScore';
import { assessSupplyRisk, generateRiskReport, type SupplyRiskMetrics, type RiskAssessment } from '../utils/supplyRisk';

/**
 * 供应链管理标签页
 * 功能：
 * 1. 1688货源质量评分卡（五维度评估）
 * 2. 供应链风险评估（四类风险）
 */
export const SupplyChainTab: React.FC = () => {
  // 货源质量评分
  const [supplyMetrics, setSupplyMetrics] = useState<SupplyQualityMetrics>({
    supplierType: 'verified',
    supplierRating: 4.0,
    hasRealPhotos: true,
    hasCertifications: true,
    monthlySales: 1000,
    positiveRate: 0.97,
    productPrice: 10,
    industryAveragePrice: 12,
    deliveryDays: 5,
    supportsCustomization: true,
    providesSamples: true,
    hasAfterSales: true
  });
  const [supplyScore, setSupplyScore] = useState<SupplyQualityScore | null>(null);
  const [showScoreReport, setShowScoreReport] = useState(false);

  // 风险评估
  const [riskMetrics, setRiskMetrics] = useState<SupplyRiskMetrics>({
    inventoryTurnoverRate: 3.5,
    daysSalesOfInventory: 105,
    stockoutCount: 2,
    overstockValue: 20000,
    defectRate: 0.03,
    returnRate: 0.06,
    customerComplaints: 6,
    qualityIncidents: 1,
    onTimeDeliveryRate: 0.92,
    averageDeliveryDays: 8,
    delayedDeliveries: 3,
    logisticIncidents: 1,
    priceVolatility: 0.12,
    costIncreaseRate: 0.08,
    priceComparison: 1.08
  });
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [showRiskReport, setShowRiskReport] = useState(false);

  // 计算货源质量评分
  const handleCalculateScore = () => {
    const score = calculateSupplyQualityScore(supplyMetrics);
    setSupplyScore(score);
  };

  // 计算风险评估
  const handleAssessRisk = () => {
    const assessment = assessSupplyRisk(riskMetrics);
    setRiskAssessment(assessment);
  };

  // 获取等级颜色
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'B':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'C':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'D':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // 获取风险等级颜色
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* ── 标题 ── */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold text-gray-900">📦 供应链管理</h2>
        <p className="text-sm text-gray-600 mt-1">
          1688货源质量评分 + 供应链风险评估
        </p>
      </div>

      {/* ── 货源质量评分卡 ── */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          1688货源质量评分卡
        </h3>
        <p className="text-sm text-gray-600">
          五维度评估：供应商（30分）+ 产品质量（25分）+ 价格优势（20分）+ 交付周期（15分）+ 服务能力（10分）
        </p>

        {/* 输入表单 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 供应商评分 */}
          <div className="col-span-2 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              供应商类型
            </label>
            <select
              value={supplyMetrics.supplierType}
              onChange={(e) => setSupplyMetrics({ ...supplyMetrics, supplierType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="super_factory">超级工厂（30分）</option>
              <option value="diamond">钻石供应商（20-24分）</option>
              <option value="verified">诚信通会员（15-19分）</option>
              <option value="normal">普通供应商（0-14分）</option>
            </select>
          </div>

          {/* 产品质量 */}
          <div className="col-span-2 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              产品质量指标
            </label>
            <div className="grid grid-cols-4 gap-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={supplyMetrics.hasRealPhotos}
                  onChange={(e) => setSupplyMetrics({ ...supplyMetrics, hasRealPhotos: e.target.checked })}
                  className="rounded"
                />
                <span className="text-xs">实拍图（10分）</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={supplyMetrics.hasCertifications}
                  onChange={(e) => setSupplyMetrics({ ...supplyMetrics, hasCertifications: e.target.checked })}
                  className="rounded"
                />
                <span className="text-xs">认证（5分）</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={supplyMetrics.supportsCustomization}
                  onChange={(e) => setSupplyMetrics({ ...supplyMetrics, supportsCustomization: e.target.checked })}
                  className="rounded"
                />
                <span className="text-xs">定制（5分）</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={supplyMetrics.providesSamples}
                  onChange={(e) => setSupplyMetrics({ ...supplyMetrics, providesSamples: e.target.checked })}
                  className="rounded"
                />
                <span className="text-xs">样品（3分）</span>
              </label>
            </div>
          </div>

          {/* 月销量 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              月销量
            </label>
            <input
              type="number"
              value={supplyMetrics.monthlySales}
              onChange={(e) => setSupplyMetrics({ ...supplyMetrics, monthlySales: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500">≥1万：5分 | ≥1千：3分 | ≥100：1分</p>
          </div>

          {/* 好评率 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              好评率（%）
            </label>
            <input
              type="number"
              step="0.1"
              value={supplyMetrics.positiveRate * 100}
              onChange={(e) => setSupplyMetrics({ ...supplyMetrics, positiveRate: (parseFloat(e.target.value) || 0) / 100 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500">≥98%：5分 | ≥95%：3分 | ≥90%：1分</p>
          </div>

          {/* 产品价格 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              产品价格（$）
            </label>
            <input
              type="number"
              step="0.01"
              value={supplyMetrics.productPrice}
              onChange={(e) => setSupplyMetrics({ ...supplyMetrics, productPrice: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 行业平均价格 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              行业平均价格（$）
            </label>
            <input
              type="number"
              step="0.01"
              value={supplyMetrics.industryAveragePrice}
              onChange={(e) => setSupplyMetrics({ ...supplyMetrics, industryAveragePrice: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500">低于平均10%：20分 | 持平：10分</p>
          </div>

          {/* 交付周期 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              交付周期（天）
            </label>
            <input
              type="number"
              value={supplyMetrics.deliveryDays}
              onChange={(e) => setSupplyMetrics({ ...supplyMetrics, deliveryDays: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500">≤2天：15分 | 3-5天：10分 | 7天：5分</p>
          </div>
        </div>

        {/* 计算按钮 */}
        <button
          onClick={handleCalculateScore}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          计算评分
        </button>

        {/* 评分结果 */}
        {supplyScore && (
          <div className="space-y-4">
            {/* 总分和等级 */}
            <div className={`p-4 border rounded-lg ${getGradeColor(supplyScore.grade)}`}>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {supplyScore.totalScore}
                </div>
                <div className="text-sm">总分 / 100</div>
                <div className="mt-2 text-lg font-semibold">
                  {supplyScore.grade} - {supplyScore.gradeLabel}
                </div>
              </div>
            </div>

            {/* 评分明细 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">评分明细</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">
                    供应商评分
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {supplyScore.breakdown.supplierScore} / 30
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">
                    产品质量
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    {supplyScore.breakdown.productQualityScore} / 25
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">
                    价格优势
                  </div>
                  <div className="text-lg font-bold text-orange-600">
                    {supplyScore.breakdown.priceAdvantageScore} / 20
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">
                    交付周期
                  </div>
                  <div className="text-lg font-bold text-purple-600">
                    {supplyScore.breakdown.deliveryScore} / 15
                  </div>
                </div>
                <div className="col-span-2 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">
                    服务能力
                  </div>
                  <div className="text-lg font-bold text-pink-600">
                    {supplyScore.breakdown.serviceScore} / 10
                  </div>
                </div>
              </div>
            </div>

            {/* 建议 */}
            {supplyScore.recommendations.length > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  💡 优化建议
                </h4>
                <ul className="space-y-1">
                  {supplyScore.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      • {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 风险提示 */}
            {supplyScore.risks.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  ⚠️ 风险提示
                </h4>
                <ul className="space-y-1">
                  {supplyScore.risks.map((risk, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 生成报告 */}
            <button
              onClick={() => {
                const report = generateScoreReport(supplyScore);
                console.log(report);
                alert('评分报告已生成！请查看控制台输出。');
              }}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              生成评分报告
            </button>
          </div>
        )}
      </div>

      {/* 分隔线 */}
      <hr className="border-gray-200" />

      {/* ── 供应链风险评估 ── */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          供应链风险评估
        </h3>
        <p className="text-sm text-gray-600">
          四类风险：库存风险 + 质量风险 + 交付风险 + 价格风险
        </p>

        {/* 评估按钮 */}
        <button
          onClick={handleAssessRisk}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          评估风险
        </button>

        {/* 风险评估结果 */}
        {riskAssessment && (
          <div className="space-y-4">
            {/* 综合评分 */}
            <div className={`p-4 border rounded-lg ${getRiskColor(riskAssessment.riskLevel)}`}>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {riskAssessment.overallScore}
                </div>
                <div className="text-sm">风险评分 / 100</div>
                <div className="mt-2 text-lg font-semibold">
                  {riskAssessment.riskLevel.toUpperCase()} - 风险等级
                </div>
              </div>
            </div>

            {/* 四类风险 */}
            <div className="grid grid-cols-2 gap-3">
              {/* 库存风险 */}
              <div className={`p-3 border rounded-lg ${getRiskColor(riskAssessment.risks.inventoryRisk.level)}`}>
                <div className="text-sm font-medium text-gray-700">库存风险</div>
                <div className="text-lg font-bold">
                  {riskAssessment.risks.inventoryRisk.score} / 25
                </div>
                <div className="text-xs text-gray-600">
                  {riskAssessment.risks.inventoryRisk.level.toUpperCase()}
                </div>
              </div>

              {/* 质量风险 */}
              <div className={`p-3 border rounded-lg ${getRiskColor(riskAssessment.risks.qualityRisk.level)}`}>
                <div className="text-sm font-medium text-gray-700">质量风险</div>
                <div className="text-lg font-bold">
                  {riskAssessment.risks.qualityRisk.score} / 25
                </div>
                <div className="text-xs text-gray-600">
                  {riskAssessment.risks.qualityRisk.level.toUpperCase()}
                </div>
              </div>

              {/* 交付风险 */}
              <div className={`p-3 border rounded-lg ${getRiskColor(riskAssessment.risks.deliveryRisk.level)}`}>
                <div className="text-sm font-medium text-gray-700">交付风险</div>
                <div className="text-lg font-bold">
                  {riskAssessment.risks.deliveryRisk.score} / 25
                </div>
                <div className="text-xs text-gray-600">
                  {riskAssessment.risks.deliveryRisk.level.toUpperCase()}
                </div>
              </div>

              {/* 价格风险 */}
              <div className={`p-3 border rounded-lg ${getRiskColor(riskAssessment.risks.priceRisk.level)}`}>
                <div className="text-sm font-medium text-gray-700">价格风险</div>
                <div className="text-lg font-bold">
                  {riskAssessment.risks.priceRisk.score} / 25
                </div>
                <div className="text-xs text-gray-600">
                  {riskAssessment.risks.priceRisk.level.toUpperCase()}
                </div>
              </div>
            </div>

            {/* 优化建议 */}
            {riskAssessment.recommendations.length > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  💡 优化建议
                </h4>
                <ul className="space-y-1">
                  {riskAssessment.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      • {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 行动清单 */}
            {riskAssessment.actionItems.length > 0 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  ✅ 行动清单
                </h4>
                <ol className="space-y-1 list-decimal list-inside">
                  {riskAssessment.actionItems.map((item, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      {item}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* 生成报告 */}
            <button
              onClick={() => {
                const report = generateRiskReport(riskAssessment);
                console.log(report);
                alert('风险评估报告已生成！请查看控制台输出。');
              }}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              生成风险评估报告
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
