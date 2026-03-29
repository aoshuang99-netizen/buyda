/**
 * 工具箱标签页
 * 整合所有数据化决策工具
 */

import React, { useState } from 'react';
import {
  exportProductScoreTable,
  exportMarketAnalysisReport
} from '../utils/exportTools';
import {
  generateAdTestMatrix,
  exportAdTestMatrixCSV,
  exportAdTestMatrixExcel,
  generateSampleKeywords
} from '../utils/adTestMatrix';

interface ToolsTabProps {
  productData?: any;
}

export const ToolsTab: React.FC<ToolsTabProps> = ({ productData }) => {
  const [adBudget, setAdBudget] = useState(800);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [customKeywords, setCustomKeywords] = useState('');

  // 生成示例关键词
  const handleGenerateKeywords = () => {
    if (productData?.title) {
      const sampleKeywords = generateSampleKeywords(productData.title);
      setKeywords(sampleKeywords);
      setCustomKeywords(sampleKeywords.join('\n'));
    }
  };

  // 导出产品评分表
  const handleExportScoreTable = () => {
    if (!productData?.asin) {
      alert('请先分析一个产品');
      return;
    }

    const exportData = [{
      asin: productData.asin,
      title: productData.title,
      category: productData.category || '',
      metrics: {
        marketVolume: 75,
        competition: 68,
        profitSpace: 82,
        trendIndex: 71,
        supplyChain: 65,
        overallScore: 72
      }
    }];

    exportProductScoreTable(exportData);
  };

  // 导出广告测试矩阵（CSV）
  const handleExportAdMatrixCSV = () => {
    if (!productData?.asin) {
      alert('请先分析一个产品');
      return;
    }

    if (keywords.length === 0) {
      alert('请先生成或输入关键词');
      return;
    }

    const matrix = generateAdTestMatrix(productData.asin, keywords, adBudget);
    exportAdTestMatrixCSV(
      matrix,
      `AdTestMatrix_${productData.asin}_${new Date().toISOString().split('T')[0]}.csv`
    );
  };

  // 导出广告测试矩阵（Excel）
  const handleExportAdMatrixExcel = () => {
    if (!productData?.asin) {
      alert('请先分析一个产品');
      return;
    }

    if (keywords.length === 0) {
      alert('请先生成或输入关键词');
      return;
    }

    const matrix = generateAdTestMatrix(productData.asin, keywords, adBudget);
    exportAdTestMatrixExcel(
      matrix,
      `广告测试矩阵_${productData.asin}_${new Date().toISOString().split('T')[0]}.xls`
    );
  };

  return (
    <div className="tools-tab">
      {/* 标题 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">🛠️ 工具箱</h2>
        <p className="text-sm text-gray-600 mt-1">
          数据化决策工具：导出报告、生成广告测试矩阵
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. 导出工具 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📤 数据导出</h3>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleExportScoreTable}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibold text-gray-800">产品评分表</div>
              <div className="text-sm text-gray-600 mt-1">导出 Excel 格式的产品评分表</div>
            </button>

            <button
              onClick={() => {
                if (!productData?.asin) {
                  alert('请先分析一个产品');
                  return;
                }
                exportMarketAnalysisReport(productData);
              }}
              className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors"
            >
              <div className="text-2xl mb-2">📈</div>
              <div className="font-semibold text-gray-800">市场分析报告</div>
              <div className="text-sm text-gray-600 mt-1">导出市场分析详细报告</div>
            </button>
          </div>
        </div>

        {/* 2. Amazon 广告测试矩阵 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📢 Amazon 广告测试矩阵</h3>

          <div className="space-y-4">
            {/* 产品信息 */}
            {productData?.asin && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">当前产品</div>
                <div className="text-sm text-gray-600">ASIN: {productData.asin}</div>
                <div className="text-sm text-gray-600 truncate">{productData.title}</div>
              </div>
            )}

            {/* 关键词输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                关键词（每行一个）
              </label>
              <textarea
                value={customKeywords}
                onChange={(e) => setCustomKeywords(e.target.value)}
                placeholder="请输入关键词，每行一个..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={6}
              />
              <button
                onClick={handleGenerateKeywords}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                从产品标题生成关键词
              </button>
              <div className="mt-2 text-sm text-gray-600">
                已生成 {keywords.length} 个关键词
              </div>
            </div>

            {/* 预算设置 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                总预算（美元）
              </label>
              <input
                type="number"
                value={adBudget}
                onChange={(e) => setAdBudget(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                min="100"
                step="100"
              />
              <div className="mt-2 text-sm text-gray-600">
                预算分配：
                <ul className="mt-1 space-y-1">
                  <li>• 手动广告（广泛匹配）：${Math.floor(adBudget * 0.4)}</li>
                  <li>• 手动广告（精准匹配）：${Math.floor(adBudget * 0.3)}</li>
                  <li>• 自动广告（系统推荐）：${Math.floor(adBudget * 0.2)}</li>
                  <li>• 自动广告（关联产品）：${Math.floor(adBudget * 0.1)}</li>
                </ul>
              </div>
            </div>

            {/* 导出按钮 */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleExportAdMatrixCSV}
                className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition-colors"
              >
                <div className="text-2xl mb-2">📄</div>
                <div className="font-semibold text-gray-800">导出 CSV</div>
                <div className="text-sm text-gray-600 mt-1">Amazon 批量上传格式</div>
              </button>

              <button
                onClick={handleExportAdMatrixExcel}
                className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-left transition-colors"
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="font-semibold text-gray-800">导出 Excel</div>
                <div className="text-sm text-gray-600 mt-1">包含使用说明的详细报告</div>
              </button>
            </div>
          </div>
        </div>

        {/* 3. 使用说明 */}
        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">💡 使用说明</h3>

          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <div className="font-semibold mb-2">1. 产品评分表导出</div>
              <ul className="space-y-1 ml-4">
                <li>• 先在 Amazon 页面分析产品</li>
                <li>• 点击「评分」标签查看评分结果</li>
                <li>• 点击「导出评分表」生成 Excel 文件</li>
                <li>• 包含五维评分和推荐等级</li>
              </ul>
            </div>

            <div>
              <div className="font-semibold mb-2">2. 广告测试矩阵生成</div>
              <ul className="space-y-1 ml-4">
                <li>• 先分析产品获取 ASIN 和标题</li>
                <li>• 输入或生成关键词（建议 10-20 个）</li>
                <li>• 设置总预算（建议 $500-1000）</li>
                <li>• 导出 CSV 直接上传到 Amazon</li>
                <li>• 或导出 Excel 查看详细使用说明</li>
              </ul>
            </div>

            <div>
              <div className="font-semibold mb-2">3. 广告测试建议</div>
              <ul className="space-y-1 ml-4">
                <li>• 第一周：小范围测试，观察数据</li>
                <li>• 第二周：根据数据调整竞价和预算</li>
                <li>• 第三周：扩大表现好的广告组</li>
                <li>• 持续监测 ROI，目标 &gt;3x</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
