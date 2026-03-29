import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  MarkPointComponent,
  MarkLineComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  MarkPointComponent,
  MarkLineComponent,
  SVGRenderer,
]);

interface PricePoint {
  date: string;
  price: number;
  bsr?: number;
}

interface PriceChartProps {
  data: PricePoint[];
  currentPrice: number;
  title?: string;
}

const PriceChart: React.FC<PriceChartProps> = ({ data, currentPrice, title }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, null, { renderer: 'svg' });
    }

    const chart = chartInstance.current;
    const prices = data.map(d => d.price);
    const maxPrice = Math.max(...prices, currentPrice);
    const minPrice = Math.min(...prices, currentPrice);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    const option: echarts.EChartsCoreOption = {
      backgroundColor: 'transparent',
      grid: {
        top: 32,
        right: 12,
        bottom: 28,
        left: 44,
        containLabel: false,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15,23,42,0.9)',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: {
          color: '#f1f5f9',
          fontSize: 11,
        },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          return `${p.name}<br/>价格: <b style="color:#60a5fa">$${p.value}</b>`;
        },
      },
      xAxis: {
        type: 'category',
        data: data.map(d => d.date),
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 9,
          color: '#94a3b8',
          interval: Math.floor(data.length / 5),
          rotate: 0,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: Math.floor(minPrice * 0.92),
        max: Math.ceil(maxPrice * 1.08),
        splitNumber: 4,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 9,
          color: '#94a3b8',
          formatter: (v: number) => `$${v}`,
        },
        splitLine: {
          lineStyle: { color: '#f1f5f9', type: 'dashed' },
        },
      },
      series: [
        {
          type: 'line',
          data: data.map(d => d.price),
          smooth: 0.4,
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: false,
          lineStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#8b5cf6' },
            ]),
            width: 2.5,
          },
          itemStyle: { color: '#3b82f6' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59,130,246,0.25)' },
              { offset: 1, color: 'rgba(59,130,246,0.02)' },
            ]),
          },
          markLine: {
            silent: true,
            symbol: ['none', 'none'],
            label: {
              fontSize: 9,
              color: '#64748b',
              formatter: (p: any) => `均价 $${avgPrice.toFixed(2)}`,
            },
            lineStyle: { color: '#94a3b8', type: 'dashed', width: 1 },
            data: [{ type: 'average' }],
          },
          markPoint: {
            symbolSize: 28,
            label: { fontSize: 8, color: '#fff', fontWeight: 'bold' },
            data: [
              { type: 'min', itemStyle: { color: '#22c55e' }, label: { formatter: (p: any) => `$${p.value}` } },
              { type: 'max', itemStyle: { color: '#ef4444' }, label: { formatter: (p: any) => `$${p.value}` } },
            ],
          },
        },
      ],
    };

    chart.setOption(option);

    return () => {
      // don't destroy on every render
    };
  }, [data, currentPrice]);

  // Resize observer
  useEffect(() => {
    if (!chartRef.current || !chartInstance.current) return;
    const ro = new ResizeObserver(() => chartInstance.current?.resize());
    ro.observe(chartRef.current);
    return () => ro.disconnect();
  }, []);

  const prices = data.map(d => d.price);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const firstPrice = prices[0] || currentPrice;
  const trend = ((currentPrice - firstPrice) / firstPrice) * 100;

  return (
    <div style={{ background: 'white', borderRadius: 10, padding: 14, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>📈 价格趋势 (90天)</div>
        <div style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
          background: trend >= 0 ? '#fef2f2' : '#f0fdf4',
          color: trend >= 0 ? '#dc2626' : '#16a34a',
        }}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
        </div>
      </div>

      <div ref={chartRef} style={{ width: '100%', height: 120 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        {[
          { label: '当前价', value: `$${currentPrice}`, color: '#1d4ed8' },
          { label: '均价', value: `$${avgPrice.toFixed(2)}`, color: '#475569' },
          { label: '最低价', value: `$${Math.min(...prices).toFixed(2)}`, color: '#16a34a' },
          { label: '最高价', value: `$${Math.max(...prices).toFixed(2)}`, color: '#dc2626' },
        ].map(item => (
          <div key={item.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 生成模拟价格历史数据（在真实Keepa数据之前使用）
export function generateMockPriceHistory(currentPrice: number, days = 90): { date: string; price: number; timestamp: number }[] {
  const data: { date: string; price: number; timestamp: number }[] = [];
  const now = new Date();
  let price = currentPrice * (0.85 + Math.random() * 0.30);

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    // 模拟价格波动（结合周期性趋势）
    price = price * (1 + (Math.random() - 0.48) * 0.03);
    price = Math.max(price, currentPrice * 0.5);
    price = Math.min(price, currentPrice * 1.5);

    // 促销节点模拟（Prime Day, Black Friday等）
    const month = date.getMonth();
    const day = date.getDate();
    if ((month === 6 && day >= 11 && day <= 13) || (month === 10 && day >= 26 && day <= 30)) {
      price = price * 0.82; // 促销降价
    }

    if (i % 3 === 0) { // 每3天记录一个点，避免数据太密集
      data.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        price: parseFloat(price.toFixed(2)),
        timestamp: date.getTime(),
      });
    }
  }

  // 最后一个点强制为当前价格
  data[data.length - 1].price = currentPrice;
  return data;
}

export default PriceChart;
