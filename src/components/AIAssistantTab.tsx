import React, { useState, useEffect } from 'react';
import { searchKnowledgeBase, getAllCategories, getKnowledgeByCategory, type KnowledgeItem } from '../utils/knowledgeBase';
import { detectPitfalls, getAllPitfalls, type Pitfall, type PitfallReport } from '../utils/pitfallDetection';

/**
 * AI助手标签页
 * 功能：
 * 1. 白皮书知识库问答
 * 2. 智能避坑预警
 */
export const AIAssistantTab: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categoryItems, setCategoryItems] = useState<KnowledgeItem[]>([]);

  // 避坑预警
  const [pitfallReport, setPitfallReport] = useState<PitfallReport | null>(null);
  const [showAllPitfalls, setShowAllPitfalls] = useState(false);
  const [allPitfalls, setAllPitfalls] = useState<Pitfall[]>([]);

  useEffect(() => {
    // 加载所有分类
    setCategories(getAllCategories());
    // 加载所有认知误区
    setAllPitfalls(getAllPitfalls());
  }, []);

  // 搜索知识库
  const handleSearch = () => {
    if (query.trim()) {
      const results = searchKnowledgeBase(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  // 按Enter搜索
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 按分类查看
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category) {
      setCategoryItems(getKnowledgeByCategory(category));
    } else {
      setCategoryItems([]);
    }
  };

  // 避坑预警检测
  const handleDetectPitfalls = () => {
    const report = detectPitfalls({
      dailySales: 50, // 示例数据
      profitMargin: 8, // 利润率<10%，触发误区1
      monthlySearchVolume: 100000, // 示例数据
      newProductRatio: 5, // 新品占比<10%，触发误区2
      cr3: 65, // CR3>60%，触发误区3
      adDensity: 45, // 广告密度>40%，触发误区3
      supplyScore: 55, // 货源质量<60分，触发误区5
      deliveryDays: 8, // 交付周期>7天，触发误区5
      hasMarketData: false // 缺少市场数据，触发误区4
    });
    setPitfallReport(report);
  };

  return (
    <div className="space-y-6 p-4">
      {/* ── 标题 ── */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold text-gray-900">🤖 AI 智能助手</h2>
        <p className="text-sm text-gray-600 mt-1">
          白皮书知识库问答 + 智能避坑预警
        </p>
      </div>

      {/* ── 标签页切换 ── */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setShowAllPitfalls(false)}
          className={`px-4 py-2 text-sm font-medium ${
            !showAllPitfalls
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📚 知识库问答
        </button>
        <button
          onClick={() => setShowAllPitfalls(true)}
          className={`px-4 py-2 text-sm font-medium ${
            showAllPitfalls
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ⚠️ 智能避坑预警
        </button>
      </div>

      {/* ── 知识库问答 ── */}
      {!showAllPitfalls && (
        <div className="space-y-6">
          {/* 搜索框 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              搜索问题
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入问题关键词，例如：选品漏斗、趋势判定、垄断风险..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                搜索
              </button>
            </div>
            <p className="text-xs text-gray-500">
              提示：可以搜索"三维势能"、"品类6力"、"五维评估"、"市场分级"、"趋势判定"等核心概念
            </p>
          </div>

          {/* 搜索结果 */}
          {searchResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">
                搜索结果 ({searchResults.length}条)
              </h3>
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {item.category}
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 mb-2">
                    {item.question}
                  </h4>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {item.answer}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 按分类查看 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              按分类浏览
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">选择分类</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* 分类内容 */}
          {categoryItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">
                {selectedCategory} ({categoryItems.length}条)
              </h3>
              {categoryItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <h4 className="text-base font-semibold text-gray-900 mb-2">
                    {item.question}
                  </h4>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {item.answer}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 智能避坑预警 ── */}
      {showAllPitfalls && (
        <div className="space-y-6">
          {/* 检测按钮 */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                五大认知误区检测
              </h3>
              <p className="text-sm text-gray-600">
                检测选品过程中的常见误区
              </p>
            </div>
            <button
              onClick={handleDetectPitfalls}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              检测误区
            </button>
          </div>

          {/* 检测结果 */}
          {pitfallReport && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {pitfallReport.totalPitfalls}
                  </div>
                  <div className="text-sm text-gray-600">发现误区</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {pitfallReport.highSeverity}
                  </div>
                  <div className="text-sm text-gray-600">高风险</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {pitfallReport.mediumSeverity}
                  </div>
                  <div className="text-sm text-gray-600">中风险</div>
                </div>
              </div>

              {pitfallReport.pitfalls.length > 0 && (
                <div className="space-y-3">
                  {pitfallReport.pitfalls.map((pitfall) => (
                    <div
                      key={pitfall.id}
                      className="p-3 bg-white border border-red-200 rounded-lg"
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-xl">
                          {pitfall.severity === 'high' ? '🔴' : '🟠'}
                        </span>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">
                            {pitfall.title}
                          </h4>
                          <p className="text-xs text-gray-600 mb-2">
                            {pitfall.description}
                          </p>
                          <div className="text-xs text-gray-500 mb-2">
                            <strong>检测条件：</strong>{pitfall.detection}
                          </div>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {pitfall.advice}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pitfallReport.pitfalls.length === 0 && (
                <div className="text-center py-4 text-sm text-gray-600">
                  ✅ 未发现认知误区，继续加油！
                </div>
              )}
            </div>
          )}

          {/* 所有认知误区 */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">
              所有认知误区
            </h3>
            {allPitfalls.map((pitfall) => (
              <div
                key={pitfall.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {pitfall.severity === 'high' ? '🔴' : pitfall.severity === 'medium' ? '🟠' : '🟡'}
                    </span>
                    <h4 className="text-base font-semibold text-gray-900">
                      {pitfall.title}
                    </h4>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {pitfall.severity === 'high' ? '高风险' : pitfall.severity === 'medium' ? '中风险' : '低风险'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {pitfall.description}
                </p>
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">
                    <strong>检测条件：</strong> {pitfall.detection}
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {pitfall.advice}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
