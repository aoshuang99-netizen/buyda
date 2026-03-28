import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

interface ProductData {
  asin: string;
  title: string;
  price: number;
  rank: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  brand: string;
  category: string;
  availability: string;
  primeEligible: boolean;
}

// 从亚马逊页面提取真实数据
const extractProductData = (): ProductData | null => {
  try {
    // 提取 ASIN (从 URL 或页面中)
    const urlMatch = window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/);
    const asin = urlMatch ? urlMatch[1] : '';

    if (!asin) return null;

    // 提取标题
    const titleEl = document.getElementById('productTitle') ||
                   document.querySelector('#title h1') ||
                   document.querySelector('h1.a-size-large');
    const title = titleEl?.textContent?.trim() || '';

    // 提取价格 (尝试多种选择器)
    const priceSelectors = [
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '.a-price .a-offscreen',
      '#price_inside_buybox',
      '[data-a-color="price"] .a-offscreen',
    ];
    let price = 0;
    for (const selector of priceSelectors) {
      const priceEl = document.querySelector(selector);
      if (priceEl?.textContent) {
        const priceText = priceEl.textContent.replace(/[^0-9.]/g, '');
        price = parseFloat(priceText);
        if (price > 0) break;
      }
    }

    // 提取 BSR 排名
    const rankEl = document.getElementById('productRank') ||
                   document.querySelector('#SalesRank') ||
                   document.querySelector('[data-feature-name="productSalesRank"]');
    let rank = 0;
    if (rankEl?.textContent) {
      const rankMatch = rankEl.textContent.match(/#([\d,]+)/);
      rank = rankMatch ? parseInt(rankMatch[1].replace(/,/g, '')) : 0;
    }

    // 提取评分
    const ratingEl = document.querySelector('[data-hook="average-star-rating"] .a-icon-alt') ||
                     document.querySelector('#averageCustomerReviews .a-icon-alt');
    let rating = 0;
    if (ratingEl?.textContent) {
      const ratingMatch = ratingEl.textContent.match(/([\d.]+)/);
      rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
    }

    // 提取评论数
    const reviewEl = document.querySelector('[data-hook="total-review-count"]') ||
                     document.getElementById('acrCustomerReviewText');
    let reviewCount = 0;
    if (reviewEl?.textContent) {
      const reviewMatch = reviewEl.textContent.match(/([\d,]+)/);
      reviewCount = reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, '')) : 0;
    }

    // 提取图片
    const imageEl = document.getElementById('landingImage') ||
                    document.querySelector('#imgBlkFront') ||
                    document.querySelector('.a-dynamic-image-container img');
    const imageUrl = imageEl?.getAttribute('src') || '';

    // 提取品牌
    const brandEl = document.getElementById('bylineInfo') ||
                    document.querySelector('[data-feature-name="brandName"] a');
    const brand = brandEl?.textContent?.replace('Brand: ', '').trim() || '';

    // 提取类别
    const categoryEl = document.querySelector('#wayfinding-breadcrumbs_feature_div') ||
                      document.querySelector('.a-breadcrumb');
    const category = categoryEl?.textContent?.trim() || '';

    // 提取库存状态
    const availabilityEl = document.getElementById('availability') ||
                          document.querySelector('#availability .a-size-medium');
    const availability = availabilityEl?.textContent?.trim() || '';

    // 检查 Prime 资格
    const primeEl = document.querySelector('#primeBadge') ||
                    document.querySelector('[data-feature-name="primeBadge"]');
    const primeEligible = !!primeEl;

    return {
      asin,
      title,
      price,
      rank,
      rating,
      reviewCount,
      imageUrl,
      brand,
      category,
      availability,
      primeEligible,
    };
  } catch (error) {
    console.error('提取产品数据失败:', error);
    return null;
  }
};

const AmazonContent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 页面加载后自动提取数据
    const data = extractProductData();
    if (data) {
      setProductData(data);
    }

    // 监听来自 popup 的消息
    const handleMessage = (request: any, _sender: any, sendResponse: any) => {
      if (request.type === 'GET_PAGE_DATA') {
        const data = extractProductData();
        sendResponse({ success: true, data });
      } else if (request.type === 'ANALYZE_PRODUCT') {
        setIsVisible(true);
        const data = extractProductData();
        if (data) {
          setProductData(data);
        }
        sendResponse({ success: true });
      } else if (request.type === 'TOGGLE_PANEL') {
        setIsVisible(prev => !prev);
        sendResponse({ success: true });
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const evaluateProduct = (data: ProductData): { level: string; color: string; score: number } => {
    let score = 0;

    // 评分 (最高 25 分)
    if (data.rating >= 4.5) score += 25;
    else if (data.rating >= 4.0) score += 20;
    else if (data.rating >= 3.5) score += 15;
    else if (data.rating >= 3.0) score += 10;

    // 评论数 (最高 20 分)
    if (data.reviewCount >= 1000) score += 20;
    else if (data.reviewCount >= 500) score += 15;
    else if (data.reviewCount >= 100) score += 10;
    else if (data.reviewCount >= 50) score += 5;

    // BSR 排名 (最高 25 分)
    if (data.rank <= 1000) score += 25;
    else if (data.rank <= 5000) score += 20;
    else if (data.rank <= 10000) score += 15;
    else if (data.rank <= 50000) score += 10;
    else if (data.rank <= 100000) score += 5;

    // Prime 资格 (最高 10 分)
    if (data.primeEligible) score += 10;

    // 有库存 (最高 20 分)
    if (data.availability && !data.availability.includes('Currently unavailable')) {
      score += 20;
    }

    // 价格区间 (最高 10 分) - 10-100美元价格区间较好
    if (data.price >= 10 && data.price <= 100) score += 10;
    else if (data.price > 0) score += 5;

    if (score >= 75) return { level: '高潜力', color: '#10B981', score };
    if (score >= 50) return { level: '中等潜力', color: '#F59E0B', score };
    return { level: '低潜力', color: '#EF4444', score };
  };

  if (!isVisible) return null;

  return (
    <div className="ai-selection-extension-floating-panel">
      <div className="ai-extension-header">
        <h3 className="ai-extension-title">AI 选品分析</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="ai-extension-close"
        >
          ✕
        </button>
      </div>

      {isLoading ? (
        <div className="ai-extension-loading">
          <div className="spinner"></div>
          <p>分析中...</p>
        </div>
      ) : productData ? (
        <div className="ai-extension-content">
          {/* 产品标题 */}
          <div className="ai-extension-section">
            <h4 className="ai-extension-title-text">{productData.title}</h4>
            <div className="ai-extension-brand">{productData.brand}</div>
          </div>

          {/* 核心指标 */}
          <div className="ai-extension-metrics">
            <div className="ai-extension-metric">
              <div className="ai-extension-metric-label">价格</div>
              <div className="ai-extension-metric-value">${productData.price}</div>
            </div>
            <div className="ai-extension-metric">
              <div className="ai-extension-metric-label">BSR 排名</div>
              <div className="ai-extension-metric-value">#{productData.rank.toLocaleString()}</div>
            </div>
            <div className="ai-extension-metric">
              <div className="ai-extension-metric-label">评分</div>
              <div className="ai-extension-metric-value">⭐ {productData.rating}</div>
            </div>
            <div className="ai-extension-metric">
              <div className="ai-extension-metric-label">评论数</div>
              <div className="ai-extension-metric-value">{productData.reviewCount}</div>
            </div>
          </div>

          {/* AI 评估 */}
          {(() => {
            const evaluation = evaluateProduct(productData);
            return (
              <div className="ai-extension-evaluation">
                <div className="ai-extension-evaluation-header">
                  <span>AI 快速评估</span>
                  <span
                    className="ai-extension-evaluation-badge"
                    style={{ backgroundColor: evaluation.color }}
                  >
                    {evaluation.level}
                  </span>
                </div>
                <div className="ai-extension-score-bar">
                  <div className="ai-extension-score-label">综合得分: {evaluation.score}/100</div>
                  <div className="ai-extension-progress">
                    <div
                      className="ai-extension-progress-fill"
                      style={{
                        width: `${evaluation.score}%`,
                        backgroundColor: evaluation.color
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 其他信息 */}
          <div className="ai-extension-details">
            <div className="ai-extension-detail-item">
              <span className="ai-extension-detail-label">类别:</span>
              <span className="ai-extension-detail-value">{productData.category.substring(0, 50)}...</span>
            </div>
            <div className="ai-extension-detail-item">
              <span className="ai-extension-detail-label">库存:</span>
              <span className="ai-extension-detail-value">{productData.availability || '未知'}</span>
            </div>
            <div className="ai-extension-detail-item">
              <span className="ai-extension-detail-label">Prime:</span>
              <span className="ai-extension-detail-value">
                {productData.primeEligible ? '✅ 是' : '❌ 否'}
              </span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="ai-extension-actions">
            <button
              className="ai-extension-button ai-extension-button-primary"
              onClick={() => {
                chrome.runtime.sendMessage({
                  type: 'SAVE_TO_WATCHLIST',
                  product: productData
                });
              }}
            >
              保存到选品清单
            </button>
            <button
              className="ai-extension-button"
              onClick={() => {
                chrome.runtime.sendMessage({
                  type: 'OPEN_POPUP',
                  tab: 'profit'
                });
              }}
            >
              计算利润
            </button>
          </div>
        </div>
      ) : (
        <div className="ai-extension-empty">
          <p>无法提取产品数据</p>
          <p className="ai-extension-empty-hint">请确保您在亚马逊产品详情页</p>
        </div>
      )}
    </div>
  );
};

// 注入样式
const style = document.createElement('style');
style.textContent = `
  .ai-selection-extension-floating-panel {
    position: fixed;
    top: 100px;
    right: 20px;
    width: 320px;
    background: white;
    border: 2px solid #3B82F6;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .ai-extension-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(135deg, #3B82F6, #2563EB);
    color: white;
    border-radius: 10px 10px 0 0;
  }

  .ai-extension-title {
    font-size: 15px;
    font-weight: 600;
    margin: 0;
    letter-spacing: 0.5px;
  }

  .ai-extension-close {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .ai-extension-close:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }

  .ai-extension-content {
    padding: 16px;
    max-height: 600px;
    overflow-y: auto;
  }

  .ai-extension-section {
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 2px solid #F3F4F6;
  }

  .ai-extension-title-text {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 6px 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .ai-extension-brand {
    font-size: 12px;
    color: #6B7280;
    font-weight: 500;
  }

  .ai-extension-metrics {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }

  .ai-extension-metric {
    background: #F9FAFB;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #E5E7EB;
  }

  .ai-extension-metric-label {
    font-size: 11px;
    color: #6B7280;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .ai-extension-metric-value {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
  }

  .ai-extension-evaluation {
    background: linear-gradient(135deg, #FEF3C7, #FDE68A);
    padding: 14px;
    border-radius: 8px;
    margin-bottom: 16px;
    border: 1px solid #FCD34D;
  }

  .ai-extension-evaluation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .ai-extension-evaluation-header span:first-child {
    font-size: 13px;
    font-weight: 600;
    color: #92400E;
  }

  .ai-extension-evaluation-badge {
    font-size: 11px;
    font-weight: 600;
    color: white;
    padding: 4px 10px;
    border-radius: 12px;
  }

  .ai-extension-score-bar {
    margin-top: 10px;
  }

  .ai-extension-score-label {
    font-size: 12px;
    font-weight: 600;
    color: #92400E;
    margin-bottom: 6px;
  }

  .ai-extension-progress {
    height: 8px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 4px;
    overflow: hidden;
  }

  .ai-extension-progress-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease-out;
  }

  .ai-extension-details {
    margin-bottom: 16px;
    background: #F9FAFB;
    padding: 12px;
    border-radius: 8px;
  }

  .ai-extension-detail-item {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 12px;
  }

  .ai-extension-detail-label {
    color: #6B7280;
    font-weight: 500;
  }

  .ai-extension-detail-value {
    color: #111827;
    font-weight: 600;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ai-extension-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ai-extension-button {
    width: 100%;
    padding: 12px;
    border: 1px solid #3B82F6;
    background: white;
    color: #3B82F6;
    font-size: 13px;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ai-extension-button:hover {
    background: #EFF6FF;
    transform: translateY(-1px);
  }

  .ai-extension-button-primary {
    background: #3B82F6;
    color: white;
    border: none;
  }

  .ai-extension-button-primary:hover {
    background: #2563EB;
  }

  .ai-extension-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #E5E7EB;
    border-top-color: #3B82F6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .ai-extension-loading p {
    color: #6B7280;
    font-size: 14px;
    margin: 0;
  }

  .ai-extension-empty {
    text-align: center;
    padding: 40px 20px;
  }

  .ai-extension-empty p {
    color: #6B7280;
    font-size: 14px;
    margin: 8px 0;
  }

  .ai-extension-empty-hint {
    font-size: 12px !important;
    color: #9CA3AF !important;
  }
`;
document.head.appendChild(style);

// 创建容器并渲染
const container = document.createElement('div');
container.id = 'ai-selection-extension-container';
document.body.appendChild(container);

const root = createRoot(container);
root.render(<AmazonContent />);

// 导出供外部调用
export {};
