/**
 * 产品对比矩阵组件
 * 支持多产品横向对比，基于五维评估模型
 */

import React, { useState, useEffect } from 'react';
import * as echarts from 'echarts';

// 产品对比数据接口
export interface ComparisonProduct {
  id: string;
  asin: string;
  title: string;
  category: string;
  metrics: {
    // 五维评分
    marketVolume: number;        // 市场体量 (0-100)
    competition: number;         // 竞争强度 (0-100)
    profitSpace: number;         // 利润空间 (0-100)
    trendIndex: number;          // 趋势指数 (0-100)
    supplyChain: number;         // 供应链优势 (0-100)
    overallScore: number;        // 综合评分 (0-100)
  };
  rawMetrics: {
    monthlySearches: number;
    dailySales: number;
    profitMargin: number;
    yoyGrowth: number;
    momGrowth: number;
    reviewCount: number;
    rating: number;
  };
}

interface ProductComparisonMatrixProps {
  products: ComparisonProduct[];
  onProductToggle?: (productId: string) => void;
  onProductRemove?: (productId: string) => void;
  selectedProducts?: string[];
}

export const ProductComparisonMatrix: React.FC<ProductComparisonMatrixProps> = ({
  products,
  onProductToggle,
  onProductRemove,
  selectedProducts = []
}) => {
  const [chartType, setChartType] = useState<'radar' | 'bar'>('radar');
  const [chartInstance, setChartInstance] = useState<echarts.ECharts | null>(null);

  // 获取推荐等级
  const getRecommendationLevel = (score: number): { level: string; stars: string; color: string } => {
    if (score >= 80) return { level: '强烈推荐', stars: '⭐⭐⭐', color: 'text-green-600' };
    if (score >= 60) return { level: '可以尝试', stars: '⭐⭐', color: 'text-blue-600' };
    if (score >= 40) return { level: '需谨慎', stars: '⭐', color: 'text-yellow-600' };
    return { level: '不建议', stars: '⛔', color: 'text-red-600' };
  };

  // 渲染雷达图
  useEffect(() => {
    if (!chartInstance || chartType !== 'radar') return;

    const comparisonProducts = products.filter(p => selectedProducts.includes(p.id));
    if (comparisonProducts.length === 0) return;

    const dimensions = ['市场体量', '竞争强度', '利润空间', '趋势指数', '供应链优势'];
    const seriesData = comparisonProducts.map(p => ({
      value: [
        p.metrics.marketVolume,
        p.metrics.competition,
        p.metrics.profitSpace,
        p.metrics.trendIndex,
        p.metrics.supplyChain
      ],
      name: p.asin
    }));

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: comparisonProducts.map(p => p.asin),
        top: 10
      },
      radar: {
        indicator: dimensions.map((d, i) => ({
          name: d,
          max: 100,
          axisLabel: {
            show: true,
            fontSize: 10
          }
        })),
        radius: '60%',
        center: ['50%', '55%']
      },
      series: [
        {
          name: '产品对比',
          type: 'radar',
          data: seriesData,
          symbolSize: 6,
          lineStyle: {
            width: 2
          },
          areaStyle: {
            opacity: 0.2
          }
        }
      ]
    };

    chartInstance.setOption(option);
  }, [products, selectedProducts, chartInstance, chartType]);

  // 渲染柱状图
  useEffect(() => {
    if (!chartInstance || chartType !== 'bar') return;

    const comparisonProducts = products.filter(p => selectedProducts.includes(p.id));
    if (comparisonProducts.length === 0) return;

    const metrics = ['marketVolume', 'competition', 'profitSpace', 'trendIndex', 'supplyChain'];
    const metricLabels = ['市场体量', '竞争强度', '利润空间', '趋势指数', '供应链优势'];

    const series = metrics.map((metric, idx) => ({
      name: metricLabels[idx],
      type: 'bar' as const,
      data: comparisonProducts.map(p => p.metrics[metric as keyof typeof p.metrics])
    }));

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: metricLabels,
        top: 10
      },
      xAxis: {
        type: 'category',
        data: comparisonProducts.map(p => p.asin),
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        max: 100,
        name: '评分'
      },
      series: series
    };

    chartInstance.setOption(option);
  }, [products, selectedProducts, chartInstance, chartType]);

  useEffect(() => {
    const chartDom = document.getElementById('comparison-chart');
    if (!chartDom) return;

    const instance = echarts.init(chartDom);
    setChartInstance(instance);

    return () => {
      instance.dispose();
    };
  }, []);

  // 排序产品（按综合评分）
  const sortedProducts = [...products].sort((a, b) => b.metrics.overallScore - a.metrics.overallScore);

  // 计算最佳产品
  const bestProduct = sortedProducts.length > 0 ? sortedProducts[0] : null;

  return (
    <div className="product-comparison-matrix">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">📊 产品对比矩阵</h2>
          <p className="text-sm text-gray-600 mt-1">
            多产品横向对比，基于五维评估模型
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('radar')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              chartType === 'radar'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            雷达图
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              chartType === 'bar'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            柱状图
          </button>
        </div>
      </div>

      {/* 最佳产品卡片 */}
      {bestProduct && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium opacity-90 mb-1">⭐ 最佳推荐产品</div>
              <div className="text-lg font-bold mb-2">{bestProduct.asin}</div>
              <div className="text-sm opacity-90">{bestProduct.title}</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{bestProduct.metrics.overallScore}</div>
              <div className="text-sm opacity-90">综合评分</div>
              <div className="text-lg mt-1">
                {getRecommendationLevel(bestProduct.metrics.overallScore).stars}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 图表区域 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div id="comparison-chart" style={{ width: '100%', height: '400px' }} />
      </div>

      {/* 对比表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">
            产品详情对比
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            已选择 {selectedProducts.length} 个产品进行对比
          </p>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
                    产品
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    市场体量 (30%)
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    竞争强度 (25%)
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    利润空间 (20%)
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    趋势指数 (15%)
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    供应链 (10%)
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    综合评分
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    推荐
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((product) => {
                  const isSelected = selectedProducts.includes(product.id);
                  const recommendation = getRecommendationLevel(product.metrics.overallScore);

                  return (
                    <tr
                      key={product.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-800">{product.asin}</div>
                        <div className="text-xs text-gray-600 truncate max-w-[120px]">{product.title}</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${product.metrics.marketVolume}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">
                            {product.metrics.marketVolume}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${product.metrics.competition}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">
                            {product.metrics.competition}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-500 h-2 rounded-full"
                              style={{ width: `${product.metrics.profitSpace}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">
                            {product.metrics.profitSpace}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full"
                              style={{ width: `${product.metrics.trendIndex}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">
                            {product.metrics.trendIndex}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-pink-500 h-2 rounded-full"
                              style={{ width: `${product.metrics.supplyChain}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">
                            {product.metrics.supplyChain}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-2xl font-bold text-indigo-600">
                          {product.metrics.overallScore}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className={`text-xs font-bold ${recommendation.color}`}>
                          {recommendation.stars}
                          <div className="mt-1">{recommendation.level}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => onProductToggle?.(product.id)}
                            className={`px-2 py-1 text-xs rounded ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {isSelected ? '取消' : '对比'}
                          </button>
                          {onProductRemove && (
                            <button
                              onClick={() => onProductRemove(product.id)}
                              className="px-2 py-1 text-xs text-red-600 hover:bg-red-100 rounded"
                            >
                              删除
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {sortedProducts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>暂无产品进行对比</p>
            </div>
          )}
        </div>
      </div>

      {/* 原始数据对比 */}
      {selectedProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">
              原始数据对比
            </h3>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      产品
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      月搜索量
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      日销量
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      利润率
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      同比增长
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      环比增长
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      评分
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      评论数
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products
                    .filter(p => selectedProducts.includes(p.id))
                    .map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">
                          {product.asin}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">
                          {product.rawMetrics.monthlySearches.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">
                          {product.rawMetrics.dailySales}单
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">
                          {product.rawMetrics.profitMargin}%
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={product.rawMetrics.yoyGrowth > 20 ? 'text-green-600' : 'text-gray-700'}>
                            {product.rawMetrics.yoyGrowth > 0 ? '+' : ''}{product.rawMetrics.yoyGrowth}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={product.rawMetrics.momGrowth > 15 ? 'text-green-600' : 'text-gray-700'}>
                            {product.rawMetrics.momGrowth > 0 ? '+' : ''}{product.rawMetrics.momGrowth}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">
                          {product.rawMetrics.rating}⭐
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">
                          {product.rawMetrics.reviewCount}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
