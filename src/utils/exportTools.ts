/**
 * 数据导出工具
 * 支持导出为 Excel、CSV、PDF 格式
 */

export interface ExportData {
  filename: string;
  data: any[];
  format: 'excel' | 'csv' | 'json';
}

/**
 * 导出为 CSV
 */
export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        const stringValue = String(value ?? '');
        // 处理包含逗号和引号的值
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
};

/**
 * 导出为 JSON
 */
export const exportToJSON = (data: any[], filename: string) => {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, 'application/json;charset=utf-8;');
};

/**
 * 导出为 Excel (简化版 - 使用 HTML Table)
 */
export const exportToExcel = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; }
          th { background-color: #4CAF50; color: white; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row =>
              `<tr>${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`
            ).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  downloadFile(htmlContent, filename, 'application/vnd.ms-excel;charset=utf-8;');
};

/**
 * 下载文件
 */
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * 导出产品评分表
 */
export const exportProductScoreTable = (products: any[]) => {
  const exportData = products.map(p => ({
    ASIN: p.asin,
    标题: p.title,
    类目: p.category,
    市场体量: `${p.metrics?.marketVolume || 0}/100 (30%)`,
    竞争强度: `${p.metrics?.competition || 0}/100 (25%)`,
    利润空间: `${p.metrics?.profitSpace || 0}/100 (20%)`,
    趋势指数: `${p.metrics?.trendIndex || 0}/100 (15%)`,
    供应链: `${p.metrics?.supplyChain || 0}/100 (10%)`,
    综合评分: p.metrics?.overallScore || 0,
    推荐等级: getRecommendationLevel(p.metrics?.overallScore || 0),
    导出时间: new Date().toLocaleString()
  }));

  exportToExcel(exportData, `产品评分表_${new Date().toISOString().split('T')[0]}.xls`);
};

/**
 * 导出市场分析报告
 */
export const exportMarketAnalysisReport = (analysis: any) => {
  const exportData = [{
    分析时间: new Date().toLocaleString(),
    ASIN: analysis.asin,
    市场等级: analysis.marketLevel,
    月搜索量: analysis.monthlySearches,
    市场体量评分: analysis.marketVolumeScore,
    趋势等级: analysis.trendLevel,
    环比增长率: analysis.momGrowth,
    同比增长率: analysis.yoyGrowth,
    新品占比: analysis.newProductRatio,
    垄断风险等级: analysis.monopolyRiskLevel,
    CR3: analysis.cr3,
    广告密度: analysis.adDensity,
    价格集中度: analysis.priceConcentration,
    综合建议: analysis.suggestion
  }];

  exportToExcel(exportData, `市场分析报告_${analysis.asin}_${new Date().toISOString().split('T')[0]}.xls`);
};

/**
 * 获取推荐等级
 */
const getRecommendationLevel = (score: number): string => {
  if (score >= 80) return '⭐⭐⭐ 强烈推荐';
  if (score >= 60) return '⭐⭐ 可以尝试';
  if (score >= 40) return '⭐ 需谨慎';
  return '⛔ 不建议进入';
};
