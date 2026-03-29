/**
 * Buyda 产品评分标签页组件
 * 基于选品策略白皮书五维评估模型
 */

import React, { useState, useEffect } from 'react';
import { ScoreCard } from './ScoreCard';
import { CategoryRadarChart, MultiCategoryRadarChart, generateMockCategoryData, CategoryCompetitiveness } from './CategoryRadarChart';
import { calculateProductScore, generateMockProductScore, ProductScore } from '../scoring/scoringSystem';

interface ScoringTabProps {
  productData?: any;
}

export const ScoringTab: React.FC<ScoringTabProps> = ({ productData }) => {
  const [activeView, setActiveView] = useState<'scorecard' | 'radar'>('scorecard');
  const [productScore, setProductScore] = useState<ProductScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [categoryData, setCategoryData] = useState<CategoryCompetitiveness | null>(null);

  useEffect(() => {
    if (activeView === 'scorecard') {
      loadProductScore();
    } else if (activeView === 'radar') {
      loadCategoryData();
    }
  }, [activeView, productData]);

  const loadProductScore = () => {
    setLoading(true);
    // 模拟加载延迟
    setTimeout(() => {
      const score = productData ? generateMockProductScore() : generateMockProductScore();
      setProductScore(score);
      setLoading(false);
    }, 500);
  };

  const loadCategoryData = () => {
    setLoading(true);
    setTimeout(() => {
      const data = generateMockCategoryData();
      setCategoryData(data);
      setLoading(false);
    }, 500);
  };

  return (
    <div>
      {/* 视图切换 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button
          onClick={() => setActiveView('scorecard')}
          style={{
            flex: 1,
            padding: '10px',
            background: activeView === 'scorecard' ? 'linear-gradient(135deg, #1d4ed8, #3b82f6)' : '#f8fafc',
            color: activeView === 'scorecard' ? 'white' : '#64748b',
            border: activeView === 'scorecard' ? 'none' : '1px solid #e2e8f0',
            borderRadius: 8,
            fontSize: 12,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          📊 产品评分
        </button>
        <button
          onClick={() => setActiveView('radar')}
          style={{
            flex: 1,
            padding: '10px',
            background: activeView === 'radar' ? 'linear-gradient(135deg, #1d4ed8, #3b82f6)' : '#f8fafc',
            color: activeView === 'radar' ? 'white' : '#64748b',
            border: activeView === 'radar' ? 'none' : '1px solid #e2e8f0',
            borderRadius: 8,
            fontSize: 12,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          📈 雷达图
        </button>
      </div>

      {/* 内容区域 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          <div style={{ fontSize: 13 }}>加载中...</div>
        </div>
      ) : (
        <>
          {/* 产品评分卡视图 */}
          {activeView === 'scorecard' && productScore && (
            <ScoreCard productScore={productScore} />
          )}

          {/* 雷达图视图 */}
          {activeView === 'radar' && categoryData && (
            <div style={{ background: 'white', borderRadius: 10, padding: 14, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                📈 品类竞争力雷达图（品类6力）
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <CategoryRadarChart data={categoryData} width={320} height={320} />
              </div>

              {/* 维度说明 */}
              <div style={{ marginTop: 14, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>
                  💡 品类6力说明
                </div>
                <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>
                  <div>• <strong>兴趣度</strong>：基于搜索量趋势</div>
                  <div>• <strong>市场体量</strong>：月搜索量/购买量</div>
                  <div>• <strong>垄断程度</strong>：CR3占比（越低越好）</div>
                  <div>• <strong>利润潜力</strong>：平均利润率</div>
                  <div>• <strong>新品机会</strong>：新品占比</div>
                  <div>• <strong>发展趋势</strong>：环比/同比增长率</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 评估模型说明 */}
      <div style={{ marginTop: 12, padding: 12, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: 10, border: '1px solid #bfdbfe' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#1d4ed8', marginBottom: 6 }}>
          📚 选品策略白皮书 · 五维评估模型
        </div>
        <div style={{ fontSize: 11, color: '#1e40af', lineHeight: 1.5 }}>
          基于跨境电商选品策略白皮书方法论，从市场体量(30%)、竞争强度(25%)、利润空间(20%)、趋势指数(15%)、供应链优势(10%)五个维度综合评估产品选品价值。
        </div>
      </div>
    </div>
  );
};

export default ScoringTab;
