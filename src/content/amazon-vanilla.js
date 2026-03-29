// Buyda 个性化选品智能体 - Amazon Content Script (纯 JS 版本)

// 从亚马逊页面提取真实数据
function extractProductData() {
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
      '.a-price .a-offscreen',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '#price_inside_buybox',
      '[data-a-color="price"] .a-offscreen',
      '.a-price-whole', // 新版 Amazon 的价格结构
    ];
    let price = 0;
    let priceSource = '';

    for (const selector of priceSelectors) {
      const priceEl = document.querySelector(selector);
      if (priceEl?.textContent) {
        const priceText = priceEl.textContent.replace(/[^0-9.]/g, '');
        price = parseFloat(priceText);
        if (price > 0) {
          priceSource = priceEl.textContent;
          break;
        }
      }
    }

    // 如果主选择器没找到，尝试组合提取
    if (price === 0) {
      const wholePart = document.querySelector('.a-price-whole');
      const fractionPart = document.querySelector('.a-price-fraction');
      if (wholePart && fractionPart) {
        price = parseFloat(`${wholePart.textContent}.${fractionPart.textContent}`);
        priceSource = `${wholePart.textContent}.${fractionPart.textContent}`;
      }
    }

    // 提取 BSR 排名 (尝试多种选择器)
    const rankSelectors = [
      '#productRank',
      '#SalesRank',
      '[data-feature-name="productSalesRank"]',
      '.a-section.a-spacing-small.a-spacing-top-small', // 新版可能的位置
      '#detailBullets_feature_div ul li', // 列表中的排名
      '#productDetails_feature_div ul li', // 产品详情中的排名
    ];
    let rank = 0;
    let rankText = '';

    for (const selector of rankSelectors) {
      const rankEl = document.querySelector(selector);
      if (rankEl?.textContent) {
        // 尝试多种匹配模式
        const patterns = [
          /#([\d,]+)/,  // #1,234
          /Best Sellers Rank: #([\d,]+)/i,  // 完整描述
          /([\d,]+) in [\w\s&]+/,  // 1,234 in Clothing
          /#([\d,]+)/i,  // 大小写不敏感
        ];

        for (const pattern of patterns) {
          const match = rankEl.textContent.match(pattern);
          if (match) {
            rank = parseInt(match[1].replace(/,/g, ''));
            rankText = match[0];
            break;
          }
        }

        if (rank > 0) break;
      }
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

    const productData = {
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

    console.log('[Buyda选品助手] 产品数据提取成功:', productData);
    return productData;
  } catch (error) {
    console.error('[Buyda选品助手] 提取产品数据失败:', error);
    return null;
  }
}

// 评估产品潜力
function evaluateProduct(data) {
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
}

// 创建浮动面板
function createFloatingPanel() {
  const container = document.createElement('div');
  container.id = 'buyda-extension-panel';
  container.innerHTML = `
    <div class="buyda-panel">
      <div class="buyda-header">
        <h3 class="buyda-title">Buyda 智能分析</h3>
        <button class="buyda-close" onclick="document.getElementById('buyda-extension-panel').remove()">✕</button>
      </div>
      <div class="buyda-content">
        <p class="buyda-loading">加载中...</p>
      </div>
    </div>
  `;
  document.body.appendChild(container);
  return container;
}

// 更新面板内容
function updatePanel(container, productData) {
  if (!productData) {
    container.querySelector('.buyda-content').innerHTML = `
      <div class="buyda-empty">
        <p>无法提取产品数据</p>
        <p class="buyda-empty-hint">请确保您在亚马逊产品详情页</p>
      </div>
    `;
    return;
  }

  const evaluation = evaluateProduct(productData);

  container.querySelector('.buyda-content').innerHTML = `
    <div class="buyda-section">
      <h4 class="buyda-title-text">${productData.title}</h4>
      <div class="buyda-brand">${productData.brand}</div>
    </div>

    <div class="buyda-metrics">
      <div class="buyda-metric">
        <div class="buyda-metric-label">价格</div>
        <div class="buyda-metric-value">$${productData.price}</div>
      </div>
      <div class="buyda-metric">
        <div class="buyda-metric-label">BSR 排名</div>
        <div class="buyda-metric-value">#${productData.rank.toLocaleString()}</div>
      </div>
      <div class="buyda-metric">
        <div class="buyda-metric-label">评分</div>
        <div class="buyda-metric-value">⭐ ${productData.rating}</div>
      </div>
      <div class="buyda-metric">
        <div class="buyda-metric-label">评论数</div>
        <div class="buyda-metric-value">${productData.reviewCount}</div>
      </div>
    </div>

    <div class="buyda-evaluation">
      <div class="buyda-evaluation-header">
        <span>AI 快速评估</span>
        <span class="buyda-evaluation-badge" style="background-color: ${evaluation.color}">
          ${evaluation.level}
        </span>
      </div>
      <div class="buyda-score-bar">
        <div class="buyda-score-label">综合得分: ${evaluation.score}/100</div>
        <div class="buyda-progress">
          <div class="buyda-progress-fill" style="width: ${evaluation.score}%; background-color: ${evaluation.color}"></div>
        </div>
      </div>
    </div>

    <div class="buyda-details">
      <div class="buyda-detail-item">
        <span class="buyda-detail-label">类别:</span>
        <span class="buyda-detail-value">${productData.category.substring(0, 50)}...</span>
      </div>
      <div class="buyda-detail-item">
        <span class="buyda-detail-label">库存:</span>
        <span class="buyda-detail-value">${productData.availability || '未知'}</span>
      </div>
      <div class="buyda-detail-item">
        <span class="buyda-detail-label">Prime:</span>
        <span class="buyda-detail-value">${productData.primeEligible ? '✅ 是' : '❌ 否'}</span>
      </div>
    </div>

    <div class="buyda-actions">
      <button class="buyda-button buyda-button-primary" id="buyda-save-btn">
        保存到选品清单
      </button>
      <button class="buyda-button" id="buyda-profit-btn">
        计算利润
      </button>
    </div>
  `;

  // 绑定按钮事件
  container.querySelector('#buyda-save-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      type: 'SAVE_TO_WATCHLIST',
      product: productData
    });
  });

  container.querySelector('#buyda-profit-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      type: 'OPEN_POPUP',
      tab: 'profit'
    });
  });
}

// 注入样式
function injectStyles() {
  if (document.getElementById('buyda-extension-styles')) return;

  const style = document.createElement('style');
  style.id = 'buyda-extension-styles';
  style.textContent = `
    #buyda-extension-panel {
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

    .buyda-panel {
      position: relative;
    }

    .buyda-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: linear-gradient(135deg, #3B82F6, #2563EB);
      color: white;
      border-radius: 10px 10px 0 0;
    }

    .buyda-title {
      font-size: 15px;
      font-weight: 600;
      margin: 0;
      letter-spacing: 0.5px;
    }

    .buyda-close {
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

    .buyda-close:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: rotate(90deg);
    }

    .buyda-content {
      padding: 16px;
      max-height: 600px;
      overflow-y: auto;
    }

    .buyda-section {
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 2px solid #F3F4F6;
    }

    .buyda-title-text {
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

    .buyda-brand {
      font-size: 12px;
      color: #6B7280;
      font-weight: 500;
    }

    .buyda-metrics {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }

    .buyda-metric {
      background: #F9FAFB;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #E5E7EB;
    }

    .buyda-metric-label {
      font-size: 11px;
      color: #6B7280;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .buyda-metric-value {
      font-size: 16px;
      font-weight: 700;
      color: #111827;
    }

    .buyda-evaluation {
      background: linear-gradient(135deg, #FEF3C7, #FDE68A);
      padding: 14px;
      border-radius: 8px;
      margin-bottom: 16px;
      border: 1px solid #FCD34D;
    }

    .buyda-evaluation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .buyda-evaluation-header span:first-child {
      font-size: 13px;
      font-weight: 600;
      color: #92400E;
    }

    .buyda-evaluation-badge {
      font-size: 11px;
      font-weight: 600;
      color: white;
      padding: 4px 10px;
      border-radius: 12px;
    }

    .buyda-score-bar {
      margin-top: 10px;
    }

    .buyda-score-label {
      font-size: 12px;
      font-weight: 600;
      color: #92400E;
      margin-bottom: 6px;
    }

    .buyda-progress {
      height: 8px;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 4px;
      overflow: hidden;
    }

    .buyda-progress-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease-out;
    }

    .buyda-details {
      margin-bottom: 16px;
      background: #F9FAFB;
      padding: 12px;
      border-radius: 8px;
    }

    .buyda-detail-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 12px;
    }

    .buyda-detail-label {
      color: #6B7280;
      font-weight: 500;
    }

    .buyda-detail-value {
      color: #111827;
      font-weight: 600;
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .buyda-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .buyda-button {
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

    .buyda-button:hover {
      background: #EFF6FF;
      transform: translateY(-1px);
    }

    .buyda-button-primary {
      background: #3B82F6;
      color: white;
      border: none;
    }

    .buyda-button-primary:hover {
      background: #2563EB;
    }

    .buyda-loading {
      text-align: center;
      padding: 40px 20px;
      color: #6B7280;
      font-size: 14px;
    }

    .buyda-empty {
      text-align: center;
      padding: 40px 20px;
    }

    .buyda-empty p {
      color: #6B7280;
      font-size: 14px;
      margin: 8px 0;
    }

    .buyda-empty-hint {
      font-size: 12px !important;
      color: #9CA3AF !important;
    }
  `;

  document.head.appendChild(style);
}

// 初始化
function init() {
  console.log('[Buyda选品助手] 初始化...');

  // 注入样式
  injectStyles();

  // 检查是否在产品页面
  const urlMatch = window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/);
  if (!urlMatch) {
    console.log('[Buyda选品助手] 非产品页面，不显示面板');
    return;
  }

  // 等待页面加载完成
  function checkAndShowPanel() {
    const data = extractProductData();
    if (data && data.title) {
      const container = createFloatingPanel();
      updatePanel(container, data);
    } else {
      // 如果还没加载完成，等待一下再试
      setTimeout(checkAndShowPanel, 500);
    }
  }

  checkAndShowPanel();

  // 监听来自 popup 的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Buyda选品助手] 收到消息:', request);

    if (request.type === 'GET_PAGE_DATA') {
      const data = extractProductData();
      sendResponse({ success: true, data });
    } else if (request.type === 'ANALYZE_PRODUCT') {
      // 移除旧的面板，创建新的
      const oldPanel = document.getElementById('buyda-extension-panel');
      if (oldPanel) {
        oldPanel.remove();
      }

      const data = extractProductData();
      if (data) {
        const container = createFloatingPanel();
        updatePanel(container, data);
      }
      sendResponse({ success: true });
    } else if (request.type === 'TOGGLE_PANEL') {
      const panel = document.getElementById('buyda-extension-panel');
      if (panel) {
        panel.remove();
      } else {
        const data = extractProductData();
        if (data) {
          const container = createFloatingPanel();
          updatePanel(container, data);
        }
      }
      sendResponse({ success: true });
    }

    return true; // 保持消息通道开放
  });
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
