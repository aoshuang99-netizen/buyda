/**
 * 选品漏斗看板组件
 * 基于白皮书选品漏斗模型：初筛→精选→矩阵布局
 */

import React, { useState, useEffect } from 'react';
import * as echarts from 'echarts';

// 漏斗阶段定义
export type FunnelStage = 'initial' | 'selected' | 'matrix';

// 漏斗阶段配置
const FUNNEL_STAGES: Record<FunnelStage, {
  name: string;
  description: string;
  targetCount: number;
  criteria: string[];
  strategies: string[];
}> = {
  initial: {
    name: '阶段一：初筛',
    description: '广泛测试，快速筛选',
    targetCount: 15,
    criteria: [
      '日销 > 0.5单',
      '利润率 > 0%',
      '类目覆盖：10小类×3大类'
    ],
    strategies: [
      '低成本测试',
      '快速迭代',
      '数据收集'
    ]
  },
  selected: {
    name: '阶段二：精选',
    description: '重点突破，强化验证',
    targetCount: 10,
    criteria: [
      '日销 > 1单',
      '利润率 > 5%',
      'Vine测评×2',
      '5%价格优势'
    ],
    strategies: [
      'Vine测评×2',
      '5%价格优势',
      '广告优化',
      '详情页优化'
    ]
  },
  matrix: {
    name: '阶段三：矩阵布局',
    description: '多维发力，规模化运营',
    targetCount: 3,
    criteria: [
      '日销 > 3单',
      '利润率 > 10%',
      'ROI > 3x',
      '好评率 > 4.2'
    ],
    strategies: [
      '站外放量（社交媒体/邮件营销）',
      'Vine测试（种子用户反馈）',
      '广告测试（关键词/关联流量结构分析）',
      '价格测试（敏感度测试模型）'
    ]
  }
};

// 漏斗产品类型
export interface FunnelProduct {
  id: string;
  asin: string;
  title: string;
  stage: FunnelStage;
  dailySales: number;
  profitMargin: number;
  rating: number;
  reviewCount: number;
  addedAt: Date;
  notes?: string;
}

interface FunnelDashboardProps {
  products?: FunnelProduct[];
  onProductAdd?: (asin: string) => void;
  onProductUpdate?: (id: string, updates: Partial<FunnelProduct>) => void;
  onProductDelete?: (id: string) => void;
}

export const FunnelDashboard: React.FC<FunnelDashboardProps> = ({
  products = [],
  onProductAdd,
  onProductUpdate,
  onProductDelete
}) => {
  const [activeStage, setActiveStage] = useState<FunnelStage>('initial');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FunnelProduct | null>(null);
  const [chartInstance, setChartInstance] = useState<echarts.ECharts | null>(null);

  // 计算各阶段产品数量
  const stageCounts = {
    initial: products.filter(p => p.stage === 'initial').length,
    selected: products.filter(p => p.stage === 'selected').length,
    matrix: products.filter(p => p.stage === 'matrix').length
  };

  // 计算通过率
  const getPassRate = (stage: FunnelStage) => {
    if (stage === 'initial') return '100%';
    if (stage === 'selected') {
      const initial = stageCounts.initial;
      const selected = stageCounts.selected;
      if (initial === 0) return '0%';
      return `${Math.round((selected / initial) * 100)}%`;
    }
    if (stage === 'matrix') {
      const selected = stageCounts.selected;
      const matrix = stageCounts.matrix;
      if (selected === 0) return '0%';
      return `${Math.round((matrix / selected) * 100)}%`;
    }
    return '0%';
  };

  // 渲染漏斗图
  useEffect(() => {
    if (!chartInstance) return;

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c}款 ({d}%)'
      },
      series: [
        {
          name: '选品漏斗',
          type: 'funnel',
          left: '10%',
          top: 60,
          bottom: 60,
          width: '80%',
          min: 0,
          max: Math.max(stageCounts.initial, 1),
          minSize: '0%',
          maxSize: '100%',
          sort: 'descending',
          gap: 2,
          label: {
            show: true,
            position: 'inside',
            formatter: '{b}: {c}款',
            fontSize: 14,
            color: '#fff'
          },
          labelLine: {
            length: 10,
            lineStyle: {
              width: 1,
              type: 'solid'
            }
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1
          },
          emphasis: {
            label: {
              fontSize: 18,
              fontWeight: 'bold'
            }
          },
          data: [
            {
              value: stageCounts.initial,
              name: '初筛',
              itemStyle: {
                color: '#10B981',
                opacity: 0.9
              }
            },
            {
              value: stageCounts.selected,
              name: '精选',
              itemStyle: {
                color: '#3B82F6',
                opacity: 0.9
              }
            },
            {
              value: stageCounts.matrix,
              name: '矩阵布局',
              itemStyle: {
                color: '#8B5CF6',
                opacity: 0.9
              }
            }
          ]
        }
      ]
    };

    chartInstance.setOption(option);
  }, [products, chartInstance]);

  useEffect(() => {
    const chartDom = document.getElementById('funnel-chart');
    if (!chartDom) return;

    const instance = echarts.init(chartDom);
    setChartInstance(instance);

    return () => {
      instance.dispose();
    };
  }, []);

  // 移动产品到下一阶段
  const moveToNextStage = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    let nextStage: FunnelStage;
    if (product.stage === 'initial') nextStage = 'selected';
    else if (product.stage === 'selected') nextStage = 'matrix';
    else return;

    onProductUpdate?.(productId, { stage: nextStage });
  };

  // 移动产品到上一阶段
  const moveToPrevStage = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    let prevStage: FunnelStage;
    if (product.stage === 'selected') prevStage = 'initial';
    else if (product.stage === 'matrix') prevStage = 'selected';
    else return;

    onProductUpdate?.(productId, { stage: prevStage });
  };

  const currentStageConfig = FUNNEL_STAGES[activeStage];
  const currentProducts = products.filter(p => p.stage === activeStage);

  return (
    <div className="funnel-dashboard">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">📊 选品漏斗看板</h2>
          <p className="text-sm text-gray-600 mt-1">
            基于白皮书选品漏斗模型：初筛 → 精选 → 矩阵布局
          </p>
        </div>
        <div className="flex gap-2">
          {['initial', 'selected', 'matrix'].map((stage) => (
            <button
              key={stage}
              onClick={() => setActiveStage(stage as FunnelStage)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeStage === stage
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {FUNNEL_STAGES[stage as FunnelStage].name}
            </button>
          ))}
        </div>
      </div>

      {/* 漏斗图 + 阶段信息 */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* 漏斗可视化 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">漏斗可视化</h3>
          <div id="funnel-chart" style={{ width: '100%', height: '300px' }} />
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            {(['initial', 'selected', 'matrix'] as FunnelStage[]).map((stage) => (
              <div key={stage}>
                <div className="text-2xl font-bold text-gray-800">{stageCounts[stage]}</div>
                <div className="text-xs text-gray-600">{FUNNEL_STAGES[stage].name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  通过率: {getPassRate(stage)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 当前阶段详情 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {currentStageConfig.name}
          </h3>
          <p className="text-sm text-gray-600 mb-4">{currentStageConfig.description}</p>

          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">目标数量</div>
            <div className="text-2xl font-bold text-indigo-600">
              {currentProducts.length} / {currentStageConfig.targetCount}
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">下漏标准</div>
            <ul className="space-y-1">
              {currentStageConfig.criteria.map((criterion, idx) => (
                <li key={idx} className="text-xs text-gray-600 flex items-center">
                  <span className="mr-2">✓</span>
                  {criterion}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">强化策略</div>
            <ul className="space-y-1">
              {currentStageConfig.strategies.map((strategy, idx) => (
                <li key={idx} className="text-xs text-gray-600 flex items-center">
                  <span className="mr-2">•</span>
                  {strategy}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 产品列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            {currentStageConfig.name} - 产品列表 ({currentProducts.length})
          </h3>
          {onProductAdd && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              + 添加产品
            </button>
          )}
        </div>

        <div className="p-6">
          {currentProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>暂无产品，点击「添加产品」开始选品</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-800">{product.asin}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(product.addedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 mb-2">{product.title}</div>
                    <div className="flex gap-4 text-xs text-gray-600">
                      <span>日销: {product.dailySales}单</span>
                      <span>利润率: {product.profitMargin}%</span>
                      <span>评分: {product.rating}⭐</span>
                      <span>评论: {product.reviewCount}条</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {product.stage !== 'initial' && (
                      <button
                        onClick={() => moveToPrevStage(product.id)}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
                        title="退回上一阶段"
                      >
                        ←
                      </button>
                    )}
                    {product.stage !== 'matrix' && (
                      <button
                        onClick={() => moveToNextStage(product.id)}
                        className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded"
                        title="进入下一阶段"
                      >
                        →
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setIsModalOpen(true);
                      }}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
                      title="编辑"
                    >
                      ✎
                    </button>
                    {onProductDelete && (
                      <button
                        onClick={() => onProductDelete(product.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                        title="删除"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
