// AI选品助手 - Amazon 产品分析脚本 (增强版本)
// 直接注入到 Amazon 产品页面
// 添加了详细的调试日志和更多选择器

(function() {
  'use strict';

  // 调试模式
  const DEBUG = true;
  function log(message, data) {
    if (DEBUG) {
      console.log('[AI选品助手]', message, data || '');
    }
  }

  // 从亚马逊页面提取真实数据
  function extractProductData() {
    try {
      log('开始提取产品数据...');
      
      // 提取 ASIN (从 URL 或页面中)
      const urlMatch = window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/);
      const asin = urlMatch ? urlMatch[1] : '';
      
      if (!asin) {
        log('无法提取 ASIN');
        return null;
      }
      log('ASIN:', asin);
      
      // 提取标题
      const titleSelectors = [
        '#productTitle',
        '#title h1',
        'h1.a-size-large',
        '#productTitle span',
        '#product-title',
        '[data-automation-id="product-title"]',
        'h1[data-cy="title-announcement"]'
      ];
      
      let title = '';
      for (const selector of titleSelectors) {
        const titleEl = document.querySelector(selector);
        if (titleEl?.textContent?.trim()) {
          title = titleEl.textContent.trim();
          log('标题提取成功 (使用选择器: ' + selector + ')');
          break;
        }
      }
      
      // 提取价格 (增强选择器)
      const priceSelectors = [
        // 主要价格显示
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '#tp_price_block_total_price_ww',
        '#price_inside_buybox',
        // 新版 Amazon 价格选择器
        '.a-price .a-offscreen',
        '.apexPriceToPay .a-offscreen',
        '[data-a-color="price"] .a-offscreen',
        '#centerCol .a-price .a-offscreen',
        // 其他可能的选择器
        '.a-price-whole',
        '#buyBoxSection .a-price .a-offscreen',
        '#desktop_qualifiedBuyBox .a-price .a-offscreen'
      ];
      
      let price = 0;
      for (const selector of priceSelectors) {
        const priceEl = document.querySelector(selector);
        log('尝试价格选择器:', selector, priceEl ? '找到元素' : '未找到');
        
        if (priceEl?.textContent) {
          const priceText = priceEl.textContent.replace(/[^0-9.]/g, '');
          price = parseFloat(priceText);
          log('价格提取结果:', price, '来源:', priceEl.textContent);
          if (price > 0) break;
        }
      }
      
      // 如果还是没有价格，尝试从价格容器中提取
      if (price === 0) {
        const priceContainer = document.querySelector('.a-price');
        if (priceContainer) {
          const wholePart = priceContainer.querySelector('.a-price-whole');
          const fractionPart = priceContainer.querySelector('.a-price-fraction');
          if (wholePart && fractionPart) {
            price = parseFloat(`${wholePart.textContent}.${fractionPart.textContent}`);
            log('从容器提取价格:', price);
          }
        }
      }
      
      // 提取 BSR 排名 (增强选择器)
      const rankSelectors = [
        '#productRank',
        '#SalesRank',
        '[data-feature-name="productSalesRank"]',
        '#productDetails_feature_div tr:has(th:contains("Best Sellers Rank")) td',
        '#detail-bullets .bucket:has(div:contains("Best Sellers Rank"))',
        '.zg-bestseller-rank',
        '[data-cy="product-sales-rank"]'
      ];
      
      let rank = 0;
      for (const selector of rankSelectors) {
        const rankEl = document.querySelector(selector);
        log('尝试 BSR 选择器:', selector, rankEl ? '找到元素' : '未找到');
        
        if (rankEl?.textContent) {
          const rankText = rankEl.textContent;
          log('BSR 文本内容:', rankText);
          
          // 尝试多种匹配模式
          const rankMatches = [
            rankText.match(/#([\d,]+)/),                           // #1,234
            rankText.match(/Best Sellers Rank.*?([\d,]+)/i),      // Best Sellers Rank: #1,234
            rankText.match(/([\d,]+) in Clothing/i),                // 1,234 in Clothing
            rankText.match(/#([\d,]+)/i)                          // case insensitive #
          ];
          
          for (const match of rankMatches) {
            if (match) {
              rank = parseInt(match[1].replace(/,/g, ''));
              log('BSR 提取成功:', rank);
              break;
            }
          }
          
          if (rank > 0) break;
        }
      }
      
      // 提取评分
      const ratingSelectors = [
        '[data-hook="average-star-rating"] .a-icon-alt',
        '#averageCustomerReviews .a-icon-alt',
        '#acrPopover .a-icon-alt',
        '.a-icon-alt',
        '[data-cy="average-rating"]'
      ];
      
      let rating = 0;
      for (const selector of ratingSelectors) {
        const ratingEl = document.querySelector(selector);
        if (ratingEl?.textContent) {
          const ratingMatch = ratingEl.textContent.match(/([\d.]+)\s*out of/);
          if (ratingMatch) {
            rating = parseFloat(ratingMatch[1]);
            log('评分提取成功:', rating);
            break;
          }
        }
      }
      
      // 提取评论数
      const reviewSelectors = [
        '[data-hook="total-review-count"]',
        '#acrCustomerReviewText',
        '#acrCustomerReviewLink',
        '[data-cy="reviews-count"]',
        '#summaryStars a'
      ];
      
      let reviewCount = 0;
      for (const selector of reviewSelectors) {
        const reviewEl = document.querySelector(selector);
        if (reviewEl?.textContent) {
          const reviewMatch = reviewEl.textContent.match(/([\d,]+)/);
          if (reviewMatch) {
            reviewCount = parseInt(reviewMatch[1].replace(/,/g, ''));
            log('评论数提取成功:', reviewCount);
            break;
          }
        }
      }
      
      // 提取图片 URL
      const imageSelectors = [
        '#landingImage',
        '#imgBlkFront',
        '.a-dynamic-image-container img',
        '#main-image-container img',
        '[data-cy="product-image"]'
      ];
      
      let imageUrl = '';
      for (const selector of imageSelectors) {
        const imageEl = document.querySelector(selector);
        if (imageEl?.getAttribute('src')) {
          imageUrl = imageEl.getAttribute('src');
          log('图片 URL 提取成功');
          break;
        }
      }
      
      // 提取品牌
      const brandSelectors = [
        '#bylineInfo',
        '[data-feature-name="brandName"] a',
        '#brand',
        '#sellerProfileTriggerId a',
        '.po-brand .po-break-word',
        '[data-cy="brand"]'
      ];
      
      let brand = '';
      for (const selector of brandSelectors) {
        const brandEl = document.querySelector(selector);
        if (brandEl?.textContent?.trim()) {
          brand = brandEl.textContent
            .replace('Brand: ', '')
            .replace('Visit the', '')
            .replace('Store', '')
            .trim();
          log('品牌提取成功:', brand);
          break;
        }
      }
      
      // 提取类别
      const categorySelectors = [
        '#wayfinding-breadcrumbs_feature_div',
        '.a-breadcrumb',
        '#breadcrumbs',
        '.breadcrumb',
        '[data-cy="breadcrumbs"]'
      ];
      
      let category = '';
      for (const selector of categorySelectors) {
        const categoryEl = document.querySelector(selector);
        if (categoryEl?.textContent?.trim()) {
          category = categoryEl.textContent.replace(/\s+/g, ' ').trim();
          log('类别提取成功:', category);
          break;
        }
      }
      
      // 提取库存状态
      const availabilitySelectors = [
        '#availability',
        '#availability span',
        '#availability .a-size-medium',
        '#buyBoxInner .a-color-state',
        '#outOfStock',
        '[data-cy="availability"]'
      ];
      
      let availability = '';
      for (const selector of availabilitySelectors) {
        const availabilityEl = document.querySelector(selector);
        if (availabilityEl?.textContent?.trim()) {
          availability = availabilityEl.textContent.trim();
          log('库存状态提取成功:', availability);
          break;
        }
      }
      
      // 检查 Prime
      const primeEligible = !!(
        document.querySelector('#primeBadge') ||
        document.querySelector('[data-feature-name="primeBadge"]') ||
        document.querySelector('#primeBadgeFeatureDiv') ||
        document.querySelector('.prime-badge')
      );
      log('Prime 状态:', primeEligible);
      
      const data = {
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
        primeEligible
      };
      
      log('完整数据提取完成:', data);
      return data;
    } catch (error) {
      console.error('提取产品数据失败:', error);
      return null;
    }
  }

  // 产品评估算法
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
    
    // 排名 (最高 25 分)
    if (data.rank <= 1000) score += 25;
    else if (data.rank <= 5000) score += 20;
    else if (data.rank <= 10000) score += 15;
    else if (data.rank <= 50000) score += 10;
    else if (data.rank <= 100000) score += 5;
    
    // Prime (最高 10 分)
    if (data.primeEligible) score += 10;
    
    // 库存 (最高 20 分)
    if (data.availability && !data.availability.includes('Currently unavailable')) score += 20;
    
    // 价格 (最高 10 分)
    if (data.price >= 10 && data.price <= 100) score += 10;
    else if (data.price > 0) score += 5;
    
    if (score >= 75) return { level: '高潜力', color: '#10B981', score };
    if (score >= 50) return { level: '中等潜力', color: '#F59E0B', score };
    return { level: '低潜力', color: '#EF4444', score };
  }

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
        opacity:1;
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
  
  // 创建容器
  const container = document.createElement('div');
  container.id = 'ai-selection-extension-container';
  document.body.appendChild(container);
  
  // 状态管理
  let isVisible = true;
  let productData = null;
  let isLoading = false;
  
  // 渲染面板
  function renderPanel() {
    if (!isVisible) {
      container.innerHTML = '';
      return;
    }
    
    let content = '';
    
    if (isLoading) {
      content = `
        <div class="ai-selection-extension-floating-panel">
          <div class="ai-extension-header">
            <h3 class="ai-extension-title">AI 选品分析</h3>
            <button class="ai-extension-close" onclick="togglePanel()">✕</button>
          </div>
          <div class="ai-extension-loading">
            <div class="spinner"></div>
            <p>分析中...</p>
          </div>
        </div>
      `;
    } else if (productData) {
      const evaluation = evaluateProduct(productData);
      
      content = `
        <div class="ai-selection-extension-floating-panel">
          <div class="ai-extension-header">
            <h3 class="ai-extension-title">AI 选品分析</h3>
            <button class="ai-extension-close" onclick="togglePanel()">✕</button>
          </div>
          <div class="ai-extension-content">
            <div class="ai-extension-section">
              <h4 class="ai-extension-title-text">${escapeHtml(productData.title)}</h4>
              <div class="ai-extension-brand">${escapeHtml(productData.brand)}</div>
            </div>
            
            <div class="ai-extension-metrics">
              <div class="ai-extension-metric">
                <div class="ai-extension-metric-label">价格</div>
                <div class="ai-extension-metric-value">$${productData.price.toFixed(2)}</div>
              </div>
              <div class="ai-extension-metric">
                <div class="ai-extension-metric-label">BSR 排名</div>
                <div class="ai-extension-metric-value">#${productData.rank.toLocaleString()}</div>
              </div>
              <div class="ai-extension-metric">
                <div class="ai-extension-metric-label">评分</div>
                <div class="ai-extension-metric-value">⭐ ${productData.rating}</div>
              </div>
              <div class="ai-extension-metric">
                <div class="ai-extension-metric-label">评论数</div>
                <div class="ai-extension-metric-value">${productData.reviewCount.toLocaleString()}</div>
              </div>
            </div>
            
            <div class="ai-extension-evaluation">
              <div class="ai-extension-evaluation-header">
                <span>AI 快速评估</span>
                <span class="ai-extension-evaluation-badge" style="background-color: ${evaluation.color}">${evaluation.level}</span>
              </div>
              <div class="ai-extension-score-bar">
                <div class="ai-extension-score-label">综合得分: ${evaluation.score}/100</div>
                <div class="ai-extension-progress">
                  <div class="ai-extension-progress-fill" style="width: ${evaluation.score}%; background-color: ${evaluation.color}"></div>
                </div>
              </div>
            </div>
            
            <div class="ai-extension-details">
              <div class="ai-extension-detail-item">
                <span class="ai-extension-detail-label">类别:</span>
                <span class="ai-extension-detail-value">${escapeHtml(productData.category.substring(0, 50))}${productData.category.length > 50 ? '...' : ''}</span>
              </div>
              <div class="ai-extension-detail-item">
                <span class="ai-extension-detail-label">库存:</span>
                <span class="ai-extension-detail-value">${productData.availability || '未知'}</span>
              </div>
              <div class="ai-extension-detail-item">
                <span class="ai-extension-detail-label">Prime:</span>
                <span class="ai-extension-detail-value">${productData.primeEligible ? '✅ 是' : '❌ 否'}</span>
              </div>
            </div>
            
            <div class="ai-extension-actions">
              <button class="ai-extension-button ai-extension-button-primary" onclick="saveToWatchlist()">
                保存到选品清单
              </button>
              <button class="ai-extension-button" onclick="openPopup('profit')">
                计算利润
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      content = `
        <div class="ai-selection-extension-floating-panel">
          <div class="ai-extension-header">
            <h3 class="ai-extension-title">AI 选品分析</h3>
            <button class="ai-extension-close" onclick="togglePanel()">✕</button>
          </div>
          <div class="ai-extension-empty">
            <p>无法提取产品数据</p>
            <p class="ai-extension-empty-hint">请确保您在亚马逊产品详情页</p>
          </div>
        </div>
      `;
    }
    
    container.innerHTML = content;
  }
  
  // HTML 转义函数
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // 切换面板显示
  function togglePanel() {
    isVisible = !isVisible;
    renderPanel();
  }
  
  // 保存到监控清单
  function saveToWatchlist() {
    if (productData) {
      chrome.storage.local.get(['watchlist'], (result) => {
        const list = result.watchlist || [];
        const exists = list.find(item => item.asin === productData.asin);
        
        if (!exists) {
          list.push({
            ...productData,
            savedAt: Date.now()
          });
          chrome.storage.local.set({ watchlist: list }, () => {
            alert('✅ 已加入监控清单！');
          });
        } else {
          alert('该产品已在监控清单中');
        }
      });
    }
  }
  
  // 打开 Popup
  function openPopup(tab) {
    console.log('Open popup to tab:', tab);
  }
  
  // 暴露全局函数
  window.togglePanel = togglePanel;
  window.saveToWatchlist = saveToWatchlist;
  window.openPopup = openPopup;
  
  // 监听来自 extension 的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_PAGE_DATA') {
      const data = extractProductData();
      sendResponse({ success: true, data });
    } else if (request.type === 'ANALYZE_PRODUCT') {
      isLoading = true;
      renderPanel();
      
      setTimeout(() => {
        productData = extractProductData();
        isLoading = false;
        renderPanel();
      }, 500);
      
      sendResponse({ success: true });
    } else if (request.type === 'TOGGLE_PANEL') {
      togglePanel();
      sendResponse({ success: true });
    }
  });
  
  // 初始化：自动提取数据并显示
  log('AI选品助手 - Amazon内容脚本加载中...');
  
  setTimeout(() => {
    productData = extractProductData();
    if (productData) {
      log('产品数据提取成功，准备渲染面板');
      renderPanel();
    } else {
      log('产品数据提取失败');
    }
  }, 1000);

})();
