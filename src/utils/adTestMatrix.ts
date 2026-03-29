/**
 * Amazon 广告测试矩阵生成器
 * 基于《跨境电商选品策略白皮书》广告测试矩阵模板
 */

export interface AdTestMatrix {
  campaignName: string;
  adType: string;
  keywordType: string;
  matchType: string;
  targetKeyword: string;
  dailyBudget: string;
  bid: string;
  conversionTarget: string;
  roiTarget: string;
}

/**
 * 生成广告测试矩阵
 * @param asin 产品 ASIN
 * @param keywords 核心关键词
 * @param budget 总预算
 */
export const generateAdTestMatrix = (
  asin: string,
  keywords: string[],
  budget: number = 800
): AdTestMatrix[] => {
  const matrix: AdTestMatrix[] = [];
  const dateStr = new Date().toISOString().split('T')[0];

  // 1. 手动广告 - 核心大词（广泛匹配）
  keywords.slice(0, 3).forEach((keyword, idx) => {
    matrix.push({
      campaignName: `${asin}_手动_广泛_${dateStr}`,
      adType: 'Sponsored Products',
      keywordType: '核心大词',
      matchType: 'broad',
      targetKeyword: keyword,
      dailyBudget: Math.floor(budget * 0.4).toString(),
      bid: 'Auto',
      conversionTarget: '0.5%',
      roiTarget: '>3x'
    });
  });

  // 2. 手动广告 - 长尾词（精准匹配）
  keywords.slice(3, 6).forEach((keyword, idx) => {
    matrix.push({
      campaignName: `${asin}_手动_精准_${dateStr}`,
      adType: 'Sponsored Products',
      keywordType: '长尾词',
      matchType: 'exact',
      targetKeyword: keyword,
      dailyBudget: Math.floor(budget * 0.3).toString(),
      bid: 'Auto',
      conversionTarget: '1.2%',
      roiTarget: '>4x'
    });
  });

  // 3. 自动广告 - 系统推荐
  matrix.push({
    campaignName: `${asin}_自动_系统_${dateStr}`,
    adType: 'Sponsored Products',
    keywordType: 'Auto Targeted',
    matchType: 'auto',
    targetKeyword: 'N/A',
    dailyBudget: Math.floor(budget * 0.2).toString(),
    bid: 'Auto',
    conversionTarget: '0.8%',
    roiTarget: '>2x'
  });

  // 4. 自动广告 - 相关产品
  matrix.push({
    campaignName: `${asin}_自动_关联_${dateStr}`,
    adType: 'Sponsored Products',
    keywordType: 'Product Attribute',
    matchType: 'auto',
    targetKeyword: 'related products',
    dailyBudget: Math.floor(budget * 0.1).toString(),
    bid: 'Auto',
    conversionTarget: '1.0%',
    roiTarget: '>3x'
  });

  return matrix;
};

/**
 * 导出为 Amazon 广告批量上传格式（CSV）
 */
export const exportAdTestMatrixCSV = (matrix: AdTestMatrix[], filename: string) => {
  const headers = [
    'Campaign Name',
    'Ad Group Name',
    'Campaign Daily Budget',
    'Ad Group Default Bid',
    'Start Date',
    'Keyword/Product',
    'Match Type',
    'SKU/ASIN',
    'Ad Name'
  ];

  const dateStr = new Date().toISOString().split('T')[0];

  const csvContent = [
    headers.join(','),
    ...matrix.map(row =>
      [
        row.campaignName,
        `${row.campaignName}_AG`,
        row.dailyBudget,
        row.bid,
        dateStr,
        row.targetKeyword === 'N/A' ? '' : row.targetKeyword,
        row.matchType === 'auto' ? 'auto' : row.matchType,
        '', // SKU 需要用户填写
        `${row.campaignName}_Ad_1`
      ].join(',')
    )
  ].join('\n');

  downloadCSV(csvContent, filename);
};

/**
 * 导出为 Excel 格式
 */
export const exportAdTestMatrixExcel = (matrix: AdTestMatrix[], filename: string) => {
  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; }
          th { background-color: #4CAF50; color: white; font-weight: bold; }
          .type-manual { background-color: #E3F2FD; }
          .type-auto { background-color: #FFF3E0; }
        </style>
      </head>
      <body>
        <h2>📢 Amazon 广告测试矩阵</h2>
        <p>生成时间: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>广告类型</th>
              <th>关键词类型</th>
              <th>匹配方式</th>
              <th>目标关键词</th>
              <th>日均预算</th>
              <th>竞价</th>
              <th>转化率目标</th>
              <th>ROI 目标</th>
              <th>广告系列名称</th>
            </tr>
          </thead>
          <tbody>
            ${matrix.map(row =>
              `<tr class="${row.adType.includes('手动') ? 'type-manual' : 'type-auto'}">
                <td>${row.adType}</td>
                <td>${row.keywordType}</td>
                <td>${getMatchTypeLabel(row.matchType)}</td>
                <td>${row.targetKeyword}</td>
                <td>$${row.dailyBudget}</td>
                <td>${row.bid}</td>
                <td>${row.conversionTarget}</td>
                <td>${row.roiTarget}</td>
                <td>${row.campaignName}</td>
              </tr>`
            ).join('')}
          </tbody>
        </table>
        <h3>💡 使用说明</h3>
        <ol>
          <li>根据实际情况调整每日预算和竞价</li>
          <li>将 CSV 文件导入 Amazon Advertising 控制台</li>
          <li>导入时需要填写 SKU（库存单位）</li>
          <li>建议先小范围测试，再逐步扩大预算</li>
          <li>每周监测 ROI，优化广告投放</li>
        </ol>
      </body>
    </html>
  `;

  downloadFile(htmlContent, filename, 'application/vnd.ms-excel;charset=utf-8;');
};

/**
 * 获取匹配方式标签
 */
const getMatchTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'broad': '广泛匹配',
    'phrase': '词组匹配',
    'exact': '精准匹配',
    'auto': '自动匹配'
  };
  return labels[type] || type;
};

/**
 * 下载 CSV
 */
const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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
 * 生成示例关键词
 */
export const generateSampleKeywords = (productTitle: string): string[] => {
  const words = productTitle.split(' ').filter(w => w.length > 3);
  const keywords: string[] = [];

  // 核心大词
  keywords.push(...words.slice(0, 3).join(' '));
  keywords.push(words.slice(0, 2).join(' '));

  // 长尾词组合
  for (let i = 0; i < words.length - 1; i++) {
    keywords.push(`${words[i]} ${words[i + 1]}`);
  }

  // 三词组合
  for (let i = 0; i < words.length - 2; i++) {
    keywords.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }

  return [...new Set(keywords)].slice(0, 10);
};
