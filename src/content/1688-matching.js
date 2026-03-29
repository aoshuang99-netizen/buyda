/**
 * Buyda 1688 货源匹配 Content Script
 * 在 1688 产品页面注入，显示货源成本分析面板
 * 纯 JavaScript 实现，不依赖任何框架
 */

(function() {
  'use strict';

  const BRAND = 'Buyda';
  const USD_TO_CNY = 7.25; // 汇率（后续可动态获取）

  // ─── 提取1688产品数据 ──────────────────────────────────────
  function extract1688ProductData() {
    try {
      // 提取产品名称
      const titleEl =
        document.querySelector('.product-title-text') ||
        document.querySelector('[data-tracelog="product_title"]') ||
        document.querySelector('.title-text') ||
        document.querySelector('h1.title');
      const title = titleEl?.textContent?.trim() || '';

      // 提取最低批发价
      const priceSelectors = [
        '.price-text',
        '.ladder-price .price',
        '.price span',
        '[class*="price"]',
        '.mod-pricebase .price-content',
      ];
      let minPrice = 0;
      let maxPrice = 0;

      for (const sel of priceSelectors) {
        const els = document.querySelectorAll(sel);
        const prices = [];
        els.forEach(el => {
          const text = el.textContent?.trim() || '';
          const match = text.match(/[\d.]+/);
          if (match) {
            const p = parseFloat(match[0]);
            if (p > 0 && p < 100000) prices.push(p);
          }
        });
        if (prices.length > 0) {
          minPrice = Math.min(...prices);
          maxPrice = Math.max(...prices);
          break;
        }
      }

      // 提取MOQ（最小起订量）
      const moqSelectors = [
        '.moq-value',
        '[class*="moq"]',
        '.delivery-moq .value',
        '.amount .value',
      ];
      let moq = 1;
      for (const sel of moqSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent) {
          const match = el.textContent.match(/(\d+)/);
          if (match) {
            moq = parseInt(match[1]);
            break;
          }
        }
      }

      // 提取供应商评分
      const ratingEl =
        document.querySelector('.shop-score-num') ||
        document.querySelector('[class*="score"]');
      const supplierScore = ratingEl?.textContent?.trim() || '未知';

      // 提取供应商名称
      const shopEl =
        document.querySelector('.company-name') ||
        document.querySelector('.shop-name a') ||
        document.querySelector('[class*="company"] a');
      const supplierName = shopEl?.textContent?.trim() || '';

      // 提取产品图片
      const imgEl =
        document.querySelector('.od-gallery-img') ||
        document.querySelector('.main-image img') ||
        document.querySelector('[class*="gallery"] img');
      const imageUrl = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || '';

      // 提取月销量
      const salesEl =
        document.querySelector('.sale-count') ||
        document.querySelector('[class*="sale"]');
      let monthlySales = 0;
      if (salesEl?.textContent) {
        const match = salesEl.textContent.match(/(\d+)/);
        if (match) monthlySales = parseInt(match[1]);
      }

      return {
        title,
        minPrice,
        maxPrice,
        moq,
        supplierScore,
        supplierName,
        imageUrl,
        monthlySales,
        url: window.location.href,
      };
    } catch (e) {
      console.error('[Buyda1688] 提取数据失败:', e);
      return null;
    }
  }

  // ─── 获取来自 Amazon 的对比数据 ────────────────────────────
  async function getAmazonCompareData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['lastAnalyzedProduct'], (result) => {
        resolve(result.lastAnalyzedProduct || null);
      });
    });
  }

  // ─── 计算利润分析 ──────────────────────────────────────────
  function calcProfit(costCNY, amazonPriceUSD) {
    const costUSD = costCNY / USD_TO_CNY;
    const shipping = 2.5;       // 预估头程运费/件
    const fbaFee = amazonPriceUSD * 0.15;  // FBA费用约15%
    const adFee = amazonPriceUSD * 0.10;   // 广告费约10%
    const amazonFee = amazonPriceUSD * 0.08; // 平台佣金约8%

    const totalCost = costUSD + shipping + fbaFee + adFee + amazonFee;
    const profit = amazonPriceUSD - totalCost;
    const profitRate = (profit / amazonPriceUSD) * 100;

    return {
      costUSD: costUSD.toFixed(2),
      shipping: shipping.toFixed(2),
      fbaFee: fbaFee.toFixed(2),
      adFee: adFee.toFixed(2),
      totalCost: totalCost.toFixed(2),
      profit: profit.toFixed(2),
      profitRate: profitRate.toFixed(1),
    };
  }

  // ─── 注入样式 ──────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('buyda-1688-styles')) return;

    const style = document.createElement('style');
    style.id = 'buyda-1688-styles';
    style.textContent = `
      #buyda-1688-panel {
        position: fixed;
        top: 80px;
        right: 20px;
        width: 300px;
        background: white;
        border: 2px solid #f97316;
        border-radius: 12px;
        box-shadow: 0 12px 40px rgba(249,115,22,0.15);
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Segoe UI', sans-serif;
        font-size: 13px;
        animation: buydaSlideIn 0.35s ease-out;
      }

      @keyframes buydaSlideIn {
        from { opacity: 0; transform: translateX(30px); }
        to { opacity: 1; transform: translateX(0); }
      }

      .buyda-1688-header {
        background: linear-gradient(135deg, #f97316, #ea580c);
        color: white;
        padding: 11px 14px;
        border-radius: 10px 10px 0 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .buyda-1688-header-title {
        font-size: 14px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .buyda-1688-close {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        font-size: 16px;
        width: 24px;
        height: 24px;
        border-radius: 5px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }

      .buyda-1688-close:hover { background: rgba(255,255,255,0.35); }

      .buyda-1688-body {
        padding: 13px;
        max-height: 550px;
        overflow-y: auto;
      }

      .buyda-1688-section {
        background: #f8fafc;
        border-radius: 8px;
        padding: 11px;
        margin-bottom: 10px;
        border: 1px solid #f1f5f9;
      }

      .buyda-1688-section-title {
        font-size: 11px;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }

      .buyda-1688-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
        border-bottom: 1px solid #f1f5f9;
        font-size: 12px;
      }

      .buyda-1688-row:last-child { border-bottom: none; }
      .buyda-1688-label { color: #64748b; }
      .buyda-1688-value { color: #0f172a; font-weight: 600; }
      .buyda-1688-value.green { color: #16a34a; }
      .buyda-1688-value.red { color: #dc2626; }
      .buyda-1688-value.orange { color: #ea580c; }
      .buyda-1688-value.blue { color: #2563eb; }

      .buyda-1688-profit-card {
        background: linear-gradient(135deg, #f0fdf4, #dcfce7);
        border: 1px solid #86efac;
        border-radius: 8px;
        padding: 12px;
        text-align: center;
        margin-bottom: 10px;
      }

      .buyda-1688-profit-card.red-card {
        background: linear-gradient(135deg, #fef2f2, #fee2e2);
        border-color: #fca5a5;
      }

      .buyda-1688-profit-main {
        font-size: 22px;
        font-weight: 800;
        color: #16a34a;
        margin-bottom: 4px;
      }

      .buyda-1688-profit-main.red-text { color: #dc2626; }
      .buyda-1688-profit-sub { font-size: 12px; color: #475569; }

      .buyda-1688-btn {
        width: 100%;
        padding: 10px;
        border: none;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        margin-bottom: 7px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }

      .buyda-1688-btn-primary {
        background: linear-gradient(135deg, #f97316, #ea580c);
        color: white;
        box-shadow: 0 3px 10px rgba(249,115,22,0.3);
      }

      .buyda-1688-btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 5px 14px rgba(249,115,22,0.4);
      }

      .buyda-1688-btn-secondary {
        background: #eff6ff;
        color: #2563eb;
        border: 1px solid #bfdbfe;
      }

      .buyda-1688-btn-secondary:hover { background: #dbeafe; }

      .buyda-1688-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 700;
      }

      .buyda-1688-exchange {
        text-align: center;
        font-size: 10px;
        color: #94a3b8;
        margin-top: 4px;
      }

      .buyda-1688-no-amazon {
        background: linear-gradient(135deg, #fffbeb, #fef9c3);
        border: 1px solid #fde68a;
        border-radius: 8px;
        padding: 11px;
        margin-bottom: 10px;
        font-size: 12px;
        color: #92400e;
        text-align: center;
        line-height: 1.5;
      }
    `;

    document.head.appendChild(style);
  }

  // ─── 创建1688面板 ──────────────────────────────────────────
  function createPanel() {
    const existing = document.getElementById('buyda-1688-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'buyda-1688-panel';
    panel.innerHTML = `
      <div class="buyda-1688-header">
        <div class="buyda-1688-header-title">
          🏭 Buyda 货源分析
        </div>
        <button class="buyda-1688-close" onclick="document.getElementById('buyda-1688-panel').remove()">✕</button>
      </div>
      <div class="buyda-1688-body">
        <div style="text-align:center;padding:24px 0;color:#94a3b8;font-size:13px">⏳ 正在分析...</div>
      </div>
    `;

    document.body.appendChild(panel);

    // 异步加载数据
    loadPanelData(panel);

    return panel;
  }

  // ─── 加载面板数据 ──────────────────────────────────────────
  async function loadPanelData(panel) {
    const product1688 = extract1688ProductData();
    const amazonProduct = await getAmazonCompareData();
    const body = panel.querySelector('.buyda-1688-body');

    if (!product1688) {
      body.innerHTML = `
        <div style="text-align:center;padding:20px;color:#64748b;font-size:12px;">
          <div style="font-size:32px;margin-bottom:10px">🏭</div>
          <div>请在1688产品页面使用</div>
          <div style="margin-top:6px;color:#94a3b8">将自动提取货源成本数据</div>
        </div>
      `;
      return;
    }

    let profitSection = '';
    let amazonSection = '';

    if (amazonProduct && amazonProduct.price > 0 && product1688.minPrice > 0) {
      const profit = calcProfit(product1688.minPrice, amazonProduct.price);
      const isProfit = parseFloat(profit.profit) > 0;

      profitSection = `
        <div class="buyda-1688-profit-card ${isProfit ? '' : 'red-card'}">
          <div class="buyda-1688-profit-main ${isProfit ? '' : 'red-text'}">
            $${profit.profit}
          </div>
          <div class="buyda-1688-profit-sub">
            预估每件利润 · 利润率 ${profit.profitRate}%
          </div>
        </div>

        <div class="buyda-1688-section">
          <div class="buyda-1688-section-title">💰 成本拆解</div>
          <div class="buyda-1688-row">
            <span class="buyda-1688-label">工厂采购 (¥${product1688.minPrice})</span>
            <span class="buyda-1688-value blue">$${profit.costUSD}</span>
          </div>
          <div class="buyda-1688-row">
            <span class="buyda-1688-label">头程运费（估）</span>
            <span class="buyda-1688-value">$${profit.shipping}</span>
          </div>
          <div class="buyda-1688-row">
            <span class="buyda-1688-label">FBA费用（15%）</span>
            <span class="buyda-1688-value">$${profit.fbaFee}</span>
          </div>
          <div class="buyda-1688-row">
            <span class="buyda-1688-label">广告费（10%）</span>
            <span class="buyda-1688-value">$${profit.adFee}</span>
          </div>
          <div class="buyda-1688-row" style="border-top:1px solid #e2e8f0;margin-top:4px;padding-top:8px">
            <span class="buyda-1688-label"><b>亚马逊售价</b></span>
            <span class="buyda-1688-value green"><b>$${amazonProduct.price}</b></span>
          </div>
        </div>
      `;

      amazonSection = `
        <div class="buyda-1688-section">
          <div class="buyda-1688-section-title">📦 亚马逊对比产品</div>
          <div class="buyda-1688-row">
            <span class="buyda-1688-label">ASIN</span>
            <span class="buyda-1688-value">${amazonProduct.asin || 'N/A'}</span>
          </div>
          <div class="buyda-1688-row">
            <span class="buyda-1688-label">售价</span>
            <span class="buyda-1688-value green">$${amazonProduct.price}</span>
          </div>
          <div class="buyda-1688-row">
            <span class="buyda-1688-label">BSR排名</span>
            <span class="buyda-1688-value">#${(amazonProduct.rank || 0).toLocaleString()}</span>
          </div>
        </div>
      `;
    } else {
      profitSection = `
        <div class="buyda-1688-no-amazon">
          💡 先分析亚马逊产品，再来1688找货源，可自动计算利润
        </div>
      `;
    }

    body.innerHTML = `
      <div class="buyda-1688-section">
        <div class="buyda-1688-section-title">🏭 货源信息</div>
        <div class="buyda-1688-row">
          <span class="buyda-1688-label">供应商</span>
          <span class="buyda-1688-value" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${product1688.supplierName || '未知'}</span>
        </div>
        <div class="buyda-1688-row">
          <span class="buyda-1688-label">批发价</span>
          <span class="buyda-1688-value orange">¥${product1688.minPrice}${product1688.maxPrice > product1688.minPrice ? ' - ¥' + product1688.maxPrice : ''}</span>
        </div>
        <div class="buyda-1688-row">
          <span class="buyda-1688-label">起订量</span>
          <span class="buyda-1688-value">${product1688.moq} 件</span>
        </div>
        <div class="buyda-1688-row">
          <span class="buyda-1688-label">月销量</span>
          <span class="buyda-1688-value">${product1688.monthlySales > 0 ? product1688.monthlySales + ' 件' : '未知'}</span>
        </div>
        <div class="buyda-1688-row">
          <span class="buyda-1688-label">供应商评分</span>
          <span class="buyda-1688-value ${product1688.supplierScore >= 4 ? 'green' : ''}">${product1688.supplierScore}</span>
        </div>
        <div class="buyda-1688-exchange">当前汇率: 1 USD ≈ ${USD_TO_CNY} CNY</div>
      </div>

      ${profitSection}
      ${amazonSection}

      <div style="display:flex;flex-direction:column;gap:7px">
        <button class="buyda-1688-btn buyda-1688-btn-primary" id="buyda-save-supplier">
          📋 保存到货源清单
        </button>
        <button class="buyda-1688-btn buyda-1688-btn-secondary" id="buyda-contact-supplier">
          💬 联系供应商
        </button>
      </div>
    `;

    // 绑定事件
    const saveBtn = document.getElementById('buyda-save-supplier');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        chrome.storage.local.get(['supplierList'], (result) => {
          const list = result.supplierList || [];
          const newItem = {
            ...product1688,
            savedAt: Date.now(),
            amazonAsin: amazonProduct?.asin || '',
            amazonPrice: amazonProduct?.price || 0,
          };
          if (!list.find(i => i.url === newItem.url)) {
            list.push(newItem);
            chrome.storage.local.set({ supplierList: list }, () => {
              saveBtn.textContent = '✅ 已保存！';
              saveBtn.style.background = 'linear-gradient(135deg, #16a34a, #22c55e)';
              setTimeout(() => {
                saveBtn.innerHTML = '📋 保存到货源清单';
                saveBtn.style.background = '';
              }, 2000);
            });
          } else {
            saveBtn.textContent = '⚠️ 已在清单中';
            setTimeout(() => { saveBtn.innerHTML = '📋 保存到货源清单'; }, 2000);
          }
        });
      });
    }

    const contactBtn = document.getElementById('buyda-contact-supplier');
    if (contactBtn) {
      contactBtn.addEventListener('click', () => {
        // 尝试点击旺旺联系按钮
        const contactEl =
          document.querySelector('[class*="contact"]') ||
          document.querySelector('[class*="wangwang"]') ||
          document.querySelector('.contact-btn');
        if (contactEl) {
          contactEl.click();
        } else {
          // 打开旺旺链接
          const shopLink = document.querySelector('.company-name a') || document.querySelector('.shop-name a');
          if (shopLink) {
            const shopUrl = shopLink.href;
            window.open(shopUrl, '_blank');
          }
        }
      });
    }
  }

  // ─── 初始化 ────────────────────────────────────────────────
  function init() {
    console.log('[Buyda1688] 初始化货源分析...');

    injectStyles();

    // 检查是否在1688产品页面
    const is1688Product =
      window.location.hostname.includes('1688.com') &&
      (window.location.pathname.includes('/offer/') ||
       window.location.pathname.includes('/chanpin/') ||
       window.location.pathname.includes('/product/'));

    if (is1688Product) {
      // 延迟等待页面加载
      setTimeout(() => {
        createPanel();
      }, 1500);
    }

    // 监听来自 popup 的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('[Buyda1688] 收到消息:', request.type);

      if (request.type === 'GET_1688_DATA') {
        const data = extract1688ProductData();
        sendResponse({ success: true, data });
      } else if (request.type === 'SHOW_1688_PANEL') {
        createPanel();
        sendResponse({ success: true });
      }

      return true;
    });
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
