/**
 * Buyda 市场分析标签页组件
 * 基于选品策略白皮书市场切入策略
 */

import React, { useState, useEffect } from 'react';

/**
 * 市场分析数据接口
 */
export interface MarketAnalysisData {
  monthlySearchVolume: number;
  momGrowth: number; // 环比增长
  yoyGrowth: number; // 同比增长
  newProductRatio: number; // 新品占比
  cr3: number; // 前3品牌销量占比
  adDensity: number; // 广告密度
  priceConcentration: number; // 价格带集中度
}

/**
 * 市场分级标准
 */
const MARKET_LEVELS = [
  { min: 0, max: 30000, label: '冷门市场', color: '🟢', type: '机会型' },
  { min: 30000, max: 80000, label: '小型市场', color: '🟡', type: '探索型' },
  { min: 80000, max: 150000, label: '中小型市场', color: '🟡', type: '稳定型' },
  { min: 150000, max: 300000, label: '中型市场', color: '🔵', type: '成长型' },
  { min: 300000, max: 500000, label: '中大型市场', color: '🔵', type: '扩张型' },
  { min: 500000, max: 800000, label: '大型市场', color: '🟠', type: '激烈型' },
  { min: 800000, max: Infinity, label: '超红海', color: '🔴', type: '红海型' }
];

/**
 * 趋势判定
 */
const TRENDS = {
  MOM_THRESHOLD: 15, // 环比增长阈值
  YOY_THRESHOLD: 20, // 同比增长阈值
  NEW_PRODUCT_THRESHOLD: 30 // 新品占比阈值
};

/**
 * 垄断风险阈值
 */
const MONOPOLY_RISKS = {
  CR3_THRESHOLD: 60, // CR3 风险阈值
  AD_DENSITY_THRESHOLD: 40, // 广告密度阈值
  PRICE_CONCENTRATION_THRESHOLD: 50 // 价格集中度阈值
};

interface MarketAnalysisTabProps {
  productData?: any;
}

export const MarketAnalysisTab: React.FC<MarketAnalysisTabProps> = ({ productData }) => {
  const [activeView, setActiveView] = useState<'volume' | 'trend' | 'monopoly'>('volume');
  const [loading, setLoading] = useState(false);
  const [marketData, setMarketData] = useState<MarketAnalysisData | null>(null);

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = () => {
    setLoading(true);
    setTimeout(() => {
      setMarketData({
        monthlySearchVolume: 150000,
        momGrowth: 18,
        yoyGrowth: 25,
        newProductRatio: 32,
        cr3: 68,
        adDensity: 48,
        priceConcentration: 55
      });
      setLoading(false);
    }, 500);
  };

  /**
   * 获取市场等级
   */
  const getMarketLevel = (volume: number) => {
    return MARKET_LEVELS.find(level => volume >= level.min && volume < level.max) || MARKET_LEVELS[6];
  };

  /**
   * 判定趋势
   */
  const getTrendLevel = (data: MarketAnalysisData) => {
    let score = 0;
    let trends: string[] = [];

    if (data.momGrowth > TRENDS.MOM_THRESHOLD) {
      score += 1;
      trends.push('🚀 上升趋势');
    } else if (data.momGrowth < -10) {
      trends.push('⚠️ 衰退预警');
    }

    if (data.yoyGrowth > TRENDS.YOY_THRESHOLD) {
      score += 1;
      trends.push('📈 爆发趋势');
    }

    if (data.newProductRatio > TRENDS.NEW_PRODUCT_THRESHOLD) {
      score += 1;
      trends.push('🆕 创新趋势');
    } else if (data.newProductRatio < 10) {
      trends.push('⚠️ 固化预警');
    }

    if (score >= 2) return { level: '热门趋势', score: 3, trends };
    if (score >= 1) return { level: '上升趋势', score: 2, trends };
    return { level: '平稳趋势', score: 1, trends };
  };

  /**
   * 判定垄断风险
   */
  const getMonopolyRisk = (data: MarketAnalysisData) => {
    let score = 0;
    let risks: string[] = [];

    if (data.cr3 > MONOPOLY_RISKS.CR3_THRESHOLD) {
      score += 1;
      risks.push(`CR3过高(${data.cr3}%)`);
    }

    if (data.adDensity > MONOPOLY_RISKS.AD_DENSITY_THRESHOLD) {
      score += 1;
      risks.push(`广告密度高(${data.adDensity}%)`);
    }

    if (data.priceConcentration > MONOPOLY_RISKS.PRICE_CONCENTRATION_THRESHOLD) {
      score += 1;
      risks.push(`价格集中度高(${data.priceConcentration}%)`);
    }

    if (score >= 3) return {
      level: '高风险',
      score: 3,
      risks,
      suggestion: '⛔ 不建议进入',
      cr3: data.cr3,
      adDensity: data.adDensity,
      priceConcentration: data.priceConcentration
    };
    if (score >= 2) return {
      level: '中风险',
      score: 2,
      risks,
      suggestion: '⚠️ 谨慎进入，需差异化策略',
      cr3: data.cr3,
      adDensity: data.adDensity,
      priceConcentration: data.priceConcentration
    };
    return {
      level: '低风险',
      score: 1,
      risks,
      suggestion: '✅ 可以进入',
      cr3: data.cr3,
      adDensity: data.adDensity,
      priceConcentration: data.priceConcentration
    };
  };

  if (loading || !marketData) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
        <div style={{ fontSize: 13 }}>加载市场分析数据...</div>
      </div>
    );
  }

  return (
    <div>
      {/* 视图切换 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[
          { key: 'volume', icon: '📊', label: '市场体量' },
          { key: 'trend', icon: '📈', label: '趋势判定' },
          { key: 'monopoly', icon: '⚠️', label: '垄断风险' }
        ].map(view => (
          <button
            key={view.key}
            onClick={() => setActiveView(view.key as any)}
            style={{
              flex: 1,
              padding: '8px',
              background: activeView === view.key ? 'linear-gradient(135deg, #1d4ed8, #3b82f6)' : '#f8fafc',
              color: activeView === view.key ? 'white' : '#64748b',
              border: activeView === view.key ? 'none' : '1px solid #e2e8f0',
              borderRadius: 7,
              fontSize: 11,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {view.icon} {view.label}
          </button>
        ))}
      </div>

      {/* 市场体量分级器 */}
      {activeView === 'volume' && marketData && (() => {
        const level = getMarketLevel(marketData.monthlySearchVolume);
        return (
          <div>
            <div style={{ background: 'white', borderRadius: 10, padding: 14, marginBottom: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                📊 市场体量分级器
              </div>

              {/* 当前市场等级 */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>{level.color}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                  {level.label}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {level.type}
                </div>
              </div>

              {/* 月搜索量 */}
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>月搜索量</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1d4ed8' }}>
                  {(marketData.monthlySearchVolume / 1000).toFixed(0)}K
                </div>
              </div>

              {/* 市场分布图 */}
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                市场分布
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {MARKET_LEVELS.reverse().map((lvl, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: marketData.monthlySearchVolume >= lvl.min && marketData.monthlySearchVolume < lvl.max
                        ? 'linear-gradient(135deg, #eff6ff, #dbeafe)'
                        : '#f8fafc',
                      border: marketData.monthlySearchVolume >= lvl.min && marketData.monthlySearchVolume < lvl.max
                        ? '2px solid #3b82f6'
                        : '1px solid #e2e8f0',
                    }}
                  >
                    <span style={{ marginRight: 8 }}>{lvl.color}</span>
                    <span style={{ flex: 1, fontSize: 11 }}>{lvl.label}</span>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>
                      {(lvl.min / 1000).toFixed(0)}K-{lvl.max === Infinity ? '∞' : (lvl.max / 1000).toFixed(0) + 'K'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 趋势智能判定 */}
      {activeView === 'trend' && marketData && (() => {
        const trend = getTrendLevel(marketData);
        return (
          <div>
            <div style={{ background: 'white', borderRadius: 10, padding: 14, marginBottom: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                📈 趋势智能判定
              </div>

              {/* 趋势等级 */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>
                  {trend.score === 3 ? '🚀🚀🚀' : trend.score === 2 ? '🚀🚀' : '🚀'}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                  {trend.level}
                </div>
              </div>

              {/* 三维度评估 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 12, textAlign: 'center', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>环比增长</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: marketData.momGrowth > TRENDS.MOM_THRESHOLD ? '#16a34a' : '#64748b' }}>
                    {marketData.momGrowth > 0 ? '+' : ''}{marketData.momGrowth}%
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                    阈值: {TRENDS.MOM_THRESHOLD}%
                  </div>
                </div>

                <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 12, textAlign: 'center', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>同比增长</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: marketData.yoyGrowth > TRENDS.YOY_THRESHOLD ? '#16a34a' : '#64748b' }}>
                    {marketData.yoyGrowth > 0 ? '+' : ''}{marketData.yoyGrowth}%
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                    阈值: {TRENDS.YOY_THRESHOLD}%
                  </div>
                </div>

                <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 12, textAlign: 'center', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>新品占比</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: marketData.newProductRatio > TRENDS.NEW_PRODUCT_THRESHOLD ? '#16a34a' : '#64748b' }}>
                    {marketData.newProductRatio}%
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                    阈值: {TRENDS.NEW_PRODUCT_THRESHOLD}%
                  </div>
                </div>
              </div>

              {/* 趋势标签 */}
              {trend.trends.length > 0 && (
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>趋势信号</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {trend.trends.map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-block',
                          fontSize: 11,
                          background: tag.includes('⚠️') ? '#fef2f2' : '#f0fdf4',
                          color: tag.includes('⚠️') ? '#dc2626' : '#16a34a',
                          borderRadius: 12,
                          padding: '4px 10px',
                          fontWeight: 600,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 趋势判定标准说明 */}
            <div style={{ padding: 12, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: 10, border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1d4ed8', marginBottom: 6 }}>
                📚 趋势判定标准
              </div>
              <div style={{ fontSize: 11, color: '#1e40af', lineHeight: 1.6 }}>
                <div>• 环比增长 &gt; {TRENDS.MOM_THRESHOLD}% → 🚀 上升趋势</div>
                <div>• 同比增长 &gt; {TRENDS.YOY_THRESHOLD}% → 📈 爆发趋势</div>
                <div>• 新品占比 &gt; {TRENDS.NEW_PRODUCT_THRESHOLD}% → 🆕 创新趋势</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 垄断风险评估器 */}
      {activeView === 'monopoly' && marketData && (() => {
        const monopoly = getMonopolyRisk(marketData);
        return (
          <div>
            <div style={{ background: 'white', borderRadius: 10, padding: 14, marginBottom: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                ⚠️ 垄断风险评估器
              </div>

              {/* 风险等级 */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>
                  {monopoly.level === '高风险' ? '🔴' : monopoly.level === '中风险' ? '🟠' : '🟢'}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                  {monopoly.level}
                </div>
                <div style={{ fontSize: 14, color: '#64748b' }}>
                  {monopoly.suggestion}
                </div>
              </div>

              {/* 三维度评估 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div style={{ background: monopoly.cr3 > MONOPOLY_RISKS.CR3_THRESHOLD ? '#fef2f2' : '#f0fdf4', borderRadius: 8, padding: 12, textAlign: 'center', border: monopoly.cr3 > MONOPOLY_RISKS.CR3_THRESHOLD ? '1px solid #fca5a5' : '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>CR3 指标</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: monopoly.cr3 > MONOPOLY_RISKS.CR3_THRESHOLD ? '#dc2626' : '#16a34a' }}>
                    {monopoly.cr3}%
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                    阈值: {MONOPOLY_RISKS.CR3_THRESHOLD}%
                  </div>
                </div>

                <div style={{ background: monopoly.adDensity > MONOPOLY_RISKS.AD_DENSITY_THRESHOLD ? '#fef2f2' : '#f0fdf4', borderRadius: 8, padding: 12, textAlign: 'center', border: monopoly.adDensity > MONOPOLY_RISKS.AD_DENSITY_THRESHOLD ? '1px solid #fca5a5' : '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>广告密度</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: monopoly.adDensity > MONOPOLY_RISKS.AD_DENSITY_THRESHOLD ? '#dc2626' : '#16a34a' }}>
                    {monopoly.adDensity}%
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                    阈值: {MONOPOLY_RISKS.AD_DENSITY_THRESHOLD}%
                  </div>
                </div>

                <div style={{ background: monopoly.priceConcentration > MONOPOLY_RISKS.PRICE_CONCENTRATION_THRESHOLD ? '#fef2f2' : '#f0fdf4', borderRadius: 8, padding: 12, textAlign: 'center', border: monopoly.priceConcentration > MONOPOLY_RISKS.PRICE_CONCENTRATION_THRESHOLD ? '1px solid #fca5a5' : '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>价格集中度</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: monopoly.priceConcentration > MONOPOLY_RISKS.PRICE_CONCENTRATION_THRESHOLD ? '#dc2626' : '#16a34a' }}>
                    {monopoly.priceConcentration}%
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                    阈值: {MONOPOLY_RISKS.PRICE_CONCENTRATION_THRESHOLD}%
                  </div>
                </div>
              </div>

              {/* 风险点 */}
              {monopoly.risks.length > 0 && (
                <div style={{ background: '#fef2f2', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', marginBottom: 6 }}>
                    ⚠️ 风险点
                  </div>
                  <div style={{ fontSize: 11, color: '#991b1b', lineHeight: 1.6 }}>
                    {monopoly.risks.map((risk, idx) => (
                      <div key={idx}>• {risk}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* 风险建议 */}
              <div style={{ padding: 12, background: monopoly.level === '高风险' ? '#fef2f2' : monopoly.level === '中风险' ? '#fffbeb' : '#f0fdf4', borderRadius: 8, border: `1px solid ${monopoly.level === '高风险' ? '#fca5a5' : monopoly.level === '中风险' ? '#fde68a' : '#bbf7d0'}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>💡 建议</div>
                <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                  {monopoly.level === '高风险' && '市场高度垄断，建议寻找其他机会或开发差异化产品'}
                  {monopoly.level === '中风险' && '市场存在一定垄断，建议采用差异化策略或寻找细分市场'}
                  {monopoly.level === '低风险' && '市场垄断程度较低，适合新卖家进入'}
                </div>
              </div>
            </div>

            {/* 垄断评估模型说明 */}
            <div style={{ padding: 12, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: 10, border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1d4ed8', marginBottom: 6 }}>
                📚 垄断评估模型
              </div>
              <div style={{ fontSize: 11, color: '#1e40af', lineHeight: 1.6 }}>
                <div>• CR3 = 前3品牌销量占比，&gt;{MONOPOLY_RISKS.CR3_THRESHOLD}% 为高风险</div>
                <div>• 广告密度 = 广告竞品数/总竞品数，&gt;{MONOPOLY_RISKS.AD_DENSITY_THRESHOLD}% 为高风险</div>
                <div>• 价格集中度 = TOP10价格区间占比，&gt;{MONOPOLY_RISKS.PRICE_CONCENTRATION_THRESHOLD}% 为高风险</div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default MarketAnalysisTab;
