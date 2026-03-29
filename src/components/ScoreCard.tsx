/**
 * Buyda 产品综合评分卡组件
 * 基于选品策略白皮书五维评估模型
 */

import React from 'react';
import {
  calculateProductScore,
  generateMockProductScore,
  ProductScore,
  ScoreDimension
} from '../scoring/scoringSystem';

interface ScoreCardProps {
  productScore?: ProductScore;
  loading?: boolean;
}

/**
 * 评分进度条组件
 */
const ScoreProgressBar: React.FC<{ dimension: ScoreDimension; label: string }> = ({ dimension, label }) => {
  const percentage = dimension.score;
  const color = percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-blue-500' : percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">{percentage}分</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`${color} h-2.5 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">{dimension.details}</div>
    </div>
  );
};

/**
 * 产品综合评分卡主组件
 */
export const ScoreCard: React.FC<ScoreCardProps> = ({ productScore, loading = false }) => {
  const scoreData = productScore || generateMockProductScore();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const recommendationColor = scoreData.recommendationLevel === '⭐⭐⭐' ? 'text-green-600' :
    scoreData.recommendationLevel === '⭐⭐' ? 'text-blue-600' :
    scoreData.recommendationLevel === '⭐' ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      {/* 标题和总评分 */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 mb-2">产品综合评分卡</h3>
          <div className="text-sm text-gray-600">
            {scoreData.productInfo.title.substring(0, 50)}...
          </div>
        </div>
        <div className="text-right">
          <div className={`text-4xl font-bold ${recommendationColor}`}>
            {scoreData.totalScore}
          </div>
          <div className="text-sm text-gray-600 mt-1">{scoreData.recommendationLevel}</div>
        </div>
      </div>

      {/* 五维评分 */}
      <div className="space-y-4 mb-6">
        <ScoreProgressBar
          dimension={scoreData.dimensions.marketVolume}
          label="市场体量 (30%权重)"
        />
        <ScoreProgressBar
          dimension={scoreData.dimensions.competition}
          label="竞争强度 (25%权重)"
        />
        <ScoreProgressBar
          dimension={scoreData.dimensions.profitSpace}
          label="利润空间 (20%权重)"
        />
        <ScoreProgressBar
          dimension={scoreData.dimensions.trendIndex}
          label="趋势指数 (15%权重)"
        />
        <ScoreProgressBar
          dimension={scoreData.dimensions.supplyChain}
          label="供应链优势 (10%权重)"
        />
      </div>

      {/* 风险提示 */}
      {scoreData.riskAlerts.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start">
            <span className="text-xl mr-2">⚠️</span>
            <div>
              <div className="font-medium text-red-800 mb-1">风险提示</div>
              <ul className="text-sm text-red-700 space-y-1">
                {scoreData.riskAlerts.map((alert, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 建议 */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start">
          <span className="text-xl mr-2">💡</span>
          <div>
            <div className="font-medium text-blue-800 mb-1">建议</div>
            <ul className="text-sm text-blue-700 space-y-1">
              {scoreData.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">{index + 1}.</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 评分详情 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          评分时间: {new Date(scoreData.productInfo.scoreDate).toLocaleString('zh-CN')}
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;
