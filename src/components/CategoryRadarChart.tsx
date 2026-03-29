/**
 * Buyda 品类竞争力雷达图组件
 * 基于选品策略白皮书品类6力模型
 */

import React, { useEffect, useRef } from 'react';

/**
 * 品类竞争力数据接口
 */
export interface CategoryCompetitiveness {
  interest: number; // 兴趣度（基于搜索量趋势）
  volume: number; // 市场体量（月搜索量/购买量）
  monopoly: number; // 垄断程度（CR3占比）
  profit: number; // 利润潜力（平均利润率）
  opportunity: number; // 新品机会（新品占比）
  trend: number; // 发展趋势（环比/同比增长率）
}

interface CategoryRadarChartProps {
  data: CategoryCompetitiveness;
  width?: number;
  height?: number;
  title?: string;
}

/**
 * 雷达图组件
 */
export const CategoryRadarChart: React.FC<CategoryRadarChartProps> = ({
  data,
  width = 400,
  height = 400,
  title = "品类竞争力雷达图"
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸
    canvas.width = width;
    canvas.height = height;

    // 配置
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60;
    const dimensions = [
      { label: '兴趣度', value: data.interest },
      { label: '市场体量', value: data.volume },
      { label: '垄断程度', value: 100 - data.monopoly }, // 垄断越低越好，所以反转
      { label: '利润潜力', value: data.profit },
      { label: '新品机会', value: data.opportunity },
      { label: '发展趋势', value: data.trend }
    ];
    const numDimensions = dimensions.length;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制标题
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'center';
    ctx.fillText(title, centerX, 30);

    // 绘制背景网格（5层）
    for (let level = 5; level >= 1; level--) {
      const levelRadius = (radius / 5) * level;
      ctx.beginPath();
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;

      for (let i = 0; i <= numDimensions; i++) {
        const angle = (Math.PI * 2 * i) / numDimensions - Math.PI / 2;
        const x = centerX + levelRadius * Math.cos(angle);
        const y = centerY + levelRadius * Math.sin(angle);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // 绘制层级标签
      if (level > 0) {
        ctx.fillStyle = '#9ca3af';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${level * 20}`, centerX + 10, centerY - levelRadius + 12);
      }
    }

    // 绘制轴线
    for (let i = 0; i < numDimensions; i++) {
      const angle = (Math.PI * 2 * i) / numDimensions - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      ctx.beginPath();
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // 绘制数据区域
    ctx.beginPath();
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;

    for (let i = 0; i <= numDimensions; i++) {
      const angle = (Math.PI * 2 * i) / numDimensions - Math.PI / 2;
      const value = dimensions[i % numDimensions].value;
      const pointRadius = (radius * value) / 100;
      const x = centerX + pointRadius * Math.cos(angle);
      const y = centerY + pointRadius * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.fill();
    ctx.stroke();

    // 绘制数据点
    for (let i = 0; i < numDimensions; i++) {
      const angle = (Math.PI * 2 * i) / numDimensions - Math.PI / 2;
      const value = dimensions[i].value;
      const pointRadius = (radius * value) / 100;
      const x = centerX + pointRadius * Math.cos(angle);
      const y = centerY + pointRadius * Math.sin(angle);

      // 绘制点
      ctx.beginPath();
      ctx.fillStyle = '#3b82f6';
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();

      // 绘制标签
      const labelRadius = radius + 25;
      const labelX = centerX + labelRadius * Math.cos(angle);
      const labelY = centerY + labelRadius * Math.sin(angle);

      ctx.fillStyle = '#374151';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dimensions[i].label, labelX, labelY);

      // 绘制数值
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px sans-serif';
      ctx.fillText(`${value}`, labelX, labelY + 12);
    }

    // 绘制综合评分
    const avgScore = dimensions.reduce((sum, d) => sum + d.value, 0) / numDimensions;
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`综合评分: ${avgScore.toFixed(1)}`, centerX, height - 15);

  }, [data, width, height, title]);

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded-lg bg-white"
      />
    </div>
  );
};

/**
 * 生成 Mock 数据
 */
export const generateMockCategoryData = (): CategoryCompetitiveness => {
  return {
    interest: 85,
    volume: 90,
    monopoly: 55,
    profit: 75,
    opportunity: 82,
    trend: 88
  };
};

/**
 * 多品类对比雷达图
 */
export interface MultiCategoryRadarChartProps {
  categories: Array<{
    name: string;
    data: CategoryCompetitiveness;
    color: string;
  }>;
  width?: number;
  height?: number;
  title?: string;
}

export const MultiCategoryRadarChart: React.FC<MultiCategoryRadarChartProps> = ({
  categories,
  width = 500,
  height = 500,
  title = "多品类竞争力对比"
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸
    canvas.width = width;
    canvas.height = height;

    // 配置
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 70;
    const dimensions = [
      { label: '兴趣度' },
      { label: '市场体量' },
      { label: '垄断程度' },
      { label: '利润潜力' },
      { label: '新品机会' },
      { label: '发展趋势' }
    ];
    const numDimensions = dimensions.length;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制标题
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'center';
    ctx.fillText(title, centerX, 30);

    // 绘制背景网格（5层）
    for (let level = 5; level >= 1; level--) {
      const levelRadius = (radius / 5) * level;
      ctx.beginPath();
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;

      for (let i = 0; i <= numDimensions; i++) {
        const angle = (Math.PI * 2 * i) / numDimensions - Math.PI / 2;
        const x = centerX + levelRadius * Math.cos(angle);
        const y = centerY + levelRadius * Math.sin(angle);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // 绘制轴线
    for (let i = 0; i < numDimensions; i++) {
      const angle = (Math.PI * 2 * i) / numDimensions - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      ctx.beginPath();
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // 绘制标签
      const labelRadius = radius + 30;
      const labelX = centerX + labelRadius * Math.cos(angle);
      const labelY = centerY + labelRadius * Math.sin(angle);

      ctx.fillStyle = '#374151';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dimensions[i].label, labelX, labelY);
    }

    // 绘制每个品类的数据
    categories.forEach((category, catIndex) => {
      const dimensionValues = [
        category.data.interest,
        category.data.volume,
        100 - category.data.monopoly, // 反转垄断程度
        category.data.profit,
        category.data.opportunity,
        category.data.trend
      ];

      // 绘制数据区域
      ctx.beginPath();
      ctx.fillStyle = category.color.replace('rgb', 'rgba').replace(')', ', 0.2)');
      ctx.strokeStyle = category.color;
      ctx.lineWidth = 2;

      for (let i = 0; i <= numDimensions; i++) {
        const angle = (Math.PI * 2 * i) / numDimensions - Math.PI / 2;
        const value = dimensionValues[i % numDimensions];
        const pointRadius = (radius * value) / 100;
        const x = centerX + pointRadius * Math.cos(angle);
        const y = centerY + pointRadius * Math.sin(angle);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.fill();
      ctx.stroke();
    });

    // 绘制图例
    const legendY = height - 50;
    const legendSpacing = 120;
    const startLegendX = centerX - (categories.length * legendSpacing) / 2;

    categories.forEach((category, index) => {
      const x = startLegendX + index * legendSpacing;

      // 绘制色块
      ctx.fillStyle = category.color;
      ctx.fillRect(x - 20, legendY - 8, 16, 16);

      // 绘制标签
      ctx.fillStyle = '#374151';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(category.name, x + 5, legendY);
    });

  }, [categories, width, height, title]);

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded-lg bg-white"
      />
    </div>
  );
};

export default CategoryRadarChart;
