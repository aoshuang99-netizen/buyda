import React, { useState, useEffect, useCallback } from 'react';

// ─── 类型定义 ───────────────────────────────────────────
interface ProductData {
  asin: string;
  title: string;
  price: number;
  originalPrice?: number;
  rank: number;
  rating: number;
  reviews: number;
  imageUrl: string;
  category: string;
  url: string;
}

interface ProfitCalc {
  costPrice: string;
  shippingCost: string;
  fbaFee: string;
  adFee: string;
}

interface Recommendation {
  id: number;
  asin: string;
  title: string;
  price: number;
  reason: string;
  potential: 'high' | 'medium' | 'low';
}

type TabType = 'analyze' | 'profit' | 'recommend' | 'watchlist' | 'settings';

// ─── 工具函数 ───────────────────────────────────────────
const getPotentialColor = (level: string) => {
  if (level === 'high') return 'bg-green-100 text-green-700 border border-green-200';
  if (level === 'medium') return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
  return 'bg-red-100 text-red-700 border border-red-200';
};

const getPotentialLabel = (level: string) => {
  if (level === 'high') return '🔥 高潜力';
  if (level === 'medium') return '⚡ 中潜力';
  return '❄️ 低潜力';
};

const formatNumber = (n: number) => n.toLocaleString();

// ─── 主组件 ────────────────────────────────────────────
const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('analyze');
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [profit, setProfit] = useState<ProfitCalc>({ costPrice: '', shippingCost: '', fbaFee: '', adFee: '' });
  const [profitResult, setProfitResult] = useState<{ gross: number; rate: number } | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [currentUrl, setCurrentUrl] = useState('');
  const [recommendations] = useState<Recommendation[]>([
    { id: 1, asin: 'B0XXXXXXX1', title: '便携式电动打气泵 无线充气泵', price: 35.99, reason: '月销量上升38%，竞品少于20个，评价差评率低', potential: 'high' },
    { id: 2, asin: 'B0XXXXXXX2', title: '厨房硅胶铲锅铲耐高温套装', price: 19.99, reason: '家居品类持续热销，1688成本约¥15，利润率可达55%', potential: 'high' },
    { id: 3, asin: 'B0XXXXXXX3', title: 'LED灯带USB氛围灯卧室', price: 12.99, reason: '搜索量增加22%，但竞争加剧，建议谨慎', potential: 'medium' },
  ]);

  useEffect(() => {
    loadSettings();
    loadSavedCount();
    getCurrentTab();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.local.get(['keepaApiKey']);
      if (result.keepaApiKey) setApiKey(result.keepaApiKey as string);
    } catch {}
  };

  const loadSavedCount = async () => {
    try {
      const result = await chrome.storage.local.get(['watchlist']);
      const list = (result.watchlist as any[]) || [];
      setSavedCount(list.length);
    } catch {}
  };

  const getCurrentTab = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) setCurrentUrl(tab.url);
    } catch {}
  };

  const isAmazonPage = currentUrl.includes('amazon.com') || currentUrl.includes('amazon.cn');
  const asinMatch = currentUrl.match(/\/dp\/([A-Z0-9]{10})/i) || currentUrl.match(/\/([A-Z0-9]{10})(?:\/|\?|$)/);
  const asinFromUrl = asinMatch?.[1] || '';

  const handleAnalyze = useCallback(async () => {
    if (!asinFromUrl) {
      alert('请先打开一个亚马逊产品页面');
      return;
    }
    setLoading(true);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      // 尝试注入 content script（如果未注入）
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['amazon-content.js']
        });
      } catch (e) {
        // 脚本可能已经注入，忽略错误
        console.log('Script may already be injected:', e);
      }

      // 等待一下让脚本初始化
      await new Promise(resolve => setTimeout(resolve, 500));

      // 发送消息获取数据
      chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_DATA' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('消息发送失败:', chrome.runtime.lastError);
          alert('无法与页面通信，请刷新页面后重试');
          setLoading(false);
          return;
        }

        if (response?.success && response?.data) {
          const data = response.data;
          setProductData({
            asin: data.asin,
            title: data.title,
            price: data.price,
            originalPrice: data.price * 1.2,
            rank: data.rank,
            rating: data.rating,
            reviews: data.reviewCount,
            imageUrl: data.imageUrl,
            category: data.category,
            url: currentUrl,
          });
          setLoading(false);
        } else {
          setProductData({
            asin: asinFromUrl,
            title: '无法获取产品标题',
            price: 0,
            originalPrice: 0,
            rank: 0,
            rating: 0,
            reviews: 0,
            imageUrl: '',
            category: '',
            url: currentUrl,
          });
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('获取产品数据失败:', error);
      alert('获取产品数据失败，请刷新页面后重试');
      setLoading(false);
    }
  }, [asinFromUrl, currentUrl]);

  const calcProfit = () => {
    if (!productData) return;
    const sell = productData.price;
    const cost = parseFloat(profit.costPrice) || 0;
    const ship = parseFloat(profit.shippingCost) || 0;
    const fba = parseFloat(profit.fbaFee) || sell * 0.15;
    const ad = parseFloat(profit.adFee) || sell * 0.10;
    const gross = sell - cost - ship - fba - ad;
    const rate = (gross / sell) * 100;
    setProfitResult({ gross, rate });
  };

  const saveToWatchlist = async () => {
    if (!productData) return;
    try {
      const result = await chrome.storage.local.get(['watchlist']);
      const list = (result.watchlist as any[]) || [];
      if (!list.find((i: any) => i.asin === productData.asin)) {
        list.push({ ...productData, savedAt: Date.now() });
        await chrome.storage.local.set({ watchlist: list });
        setSavedCount(list.length);
        alert('✅ 已加入监控清单！');
      } else {
        alert('该产品已在监控清单中');
      }
    } catch {}
  };

  const tabs: { key: TabType; icon: string; label: string }[] = [
    { key: 'analyze', icon: '🔍', label: '分析' },
    { key: 'profit', icon: '💰', label: '利润' },
    { key: 'recommend', icon: '🤖', label: 'AI推荐' },
    { key: 'watchlist', icon: '📋', label: `监控(${savedCount})` },
    { key: 'settings', icon: '⚙️', label: '设置' },
  ];

  return (
    <div style={{ width: 360, minHeight: 520, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#F8FAFC' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', padding: '12px 16px', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>🤖</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>AI 选品助手</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>智能分析 · 免费使用 · 持续进化</div>
          </div>
          {isAmazonPage && asinFromUrl && (
            <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: '2px 8px', fontSize: 11 }}>
              ASIN: {asinFromUrl}
            </div>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            flex: 1, padding: '8px 2px', fontSize: 11, border: 'none', cursor: 'pointer',
            background: activeTab === t.key ? '#eff6ff' : 'white',
            color: activeTab === t.key ? '#1d4ed8' : '#64748b',
            borderBottom: activeTab === t.key ? '2px solid #3b82f6' : '2px solid transparent',
            fontWeight: activeTab === t.key ? 600 : 400,
            transition: 'all 0.2s',
          }}>
            <div>{t.icon}</div>
            <div style={{ marginTop: 1 }}>{t.label}</div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 14 }}>

        {/* ── 分析 Tab ── */}
        {activeTab === 'analyze' && (
          <div>
            {!isAmazonPage ? (
              <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>请打开亚马逊产品页面</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>跳转到 Amazon 产品页，再点击分析</div>
                <button onClick={() => chrome.tabs.create({ url: 'https://www.amazon.com' })}
                  style={{ background: '#ff9900', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                  打开亚马逊
                </button>
              </div>
            ) : (
              <>
                <button onClick={handleAnalyze} disabled={loading} style={{
                  width: '100%', padding: '12px', background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                  color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 14,
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(59,130,246,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  {loading ? '⏳ 正在分析...' : '🔍 分析当前产品'}
                </button>

                {productData && (
                  <div>
                    {/* 核心指标卡片 */}
                    <div style={{ background: 'white', borderRadius: 10, padding: 14, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>📊 核心数据</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {[
                          { label: '当前价格', value: `$${productData.price}`, color: '#16a34a', bg: '#f0fdf4' },
                          { label: 'BSR 排名', value: `#${formatNumber(productData.rank)}`, color: '#1d4ed8', bg: '#eff6ff' },
                          { label: '评分', value: `⭐ ${productData.rating}/5`, color: '#d97706', bg: '#fffbeb' },
                          { label: '评价数', value: formatNumber(productData.reviews), color: '#7c3aed', bg: '#f5f3ff' },
                        ].map(item => (
                          <div key={item.label} style={{ background: item.bg, borderRadius: 8, padding: '10px 12px' }}>
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{item.label}</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: item.color }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI 评估 */}
                    <div style={{ background: 'white', borderRadius: 10, padding: 14, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>🤖 AI 快速评估</div>
                      {[
                        { label: '市场竞争度', score: productData.rank < 5000 ? 75 : 45, color: '#ef4444' },
                        { label: '利润潜力', score: productData.price > 25 ? 70 : 40, color: '#16a34a' },
                        { label: '用户满意度', score: Math.round(productData.rating / 5 * 100), color: '#3b82f6' },
                      ].map(item => (
                        <div key={item.label} style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: '#475569' }}>{item.label}</span>
                            <span style={{ fontWeight: 600, color: item.color }}>{item.score}%</span>
                          </div>
                          <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${item.score}%`, background: item.color, borderRadius: 3, transition: 'width 0.8s ease' }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 操作按钮 */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={saveToWatchlist} style={{
                        flex: 1, padding: '9px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
                        borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600,
                      }}>
                        📋 加入监控
                      </button>
                      <button onClick={() => setActiveTab('profit')} style={{
                        flex: 1, padding: '9px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a',
                        borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600,
                      }}>
                        💰 算利润
                      </button>
                      <button onClick={() => chrome.tabs.create({ url: `https://www.1688.com/chanpin/${encodeURIComponent(productData.title.split(' ').slice(0, 4).join(' '))}.html` })} style={{
                        flex: 1, padding: '9px', background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa',
                        borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600,
                      }}>
                        🏭 找货源
                      </button>
                    </div>
                  </div>
                )}

                {!productData && !loading && (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: '12px 0' }}>
                    点击上方按钮开始分析当前产品
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── 利润计算 Tab ── */}
        {activeTab === 'profit' && (
          <div>
            <div style={{ background: 'white', borderRadius: 10, padding: 14, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>💰 利润测算器</div>
              {[
                { key: 'costPrice', label: '🏭 工厂采购成本 ($)', placeholder: '如：8.50' },
                { key: 'shippingCost', label: '✈️ 头程运费/件 ($)', placeholder: '如：2.00' },
                { key: 'fbaFee', label: '📦 FBA仓储费 ($)', placeholder: '留空=售价×15%' },
                { key: 'adFee', label: '📢 广告费/件 ($)', placeholder: '留空=售价×10%' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 4 }}>{field.label}</label>
                  <input
                    type="number"
                    placeholder={field.placeholder}
                    value={profit[field.key as keyof ProfitCalc]}
                    onChange={e => setProfit(p => ({ ...p, [field.key]: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              {productData && (
                <div style={{ background: '#f8fafc', borderRadius: 7, padding: '8px 10px', marginBottom: 10, fontSize: 12, color: '#64748b' }}>
                  📌 亚马逊售价：<strong style={{ color: '#1d4ed8' }}>${productData.price}</strong>
                </div>
              )}
              <button onClick={calcProfit} style={{
                width: '100%', padding: '10px', background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                color: 'white', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600,
                boxShadow: '0 3px 8px rgba(22,163,74,0.35)',
              }}>
                计算利润
              </button>
            </div>

            {profitResult && (
              <div style={{
                background: profitResult.rate > 20 ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : profitResult.rate > 0 ? 'linear-gradient(135deg, #fffbeb, #fef9c3)' : 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                borderRadius: 10, padding: 16, border: `1px solid ${profitResult.rate > 20 ? '#86efac' : profitResult.rate > 0 ? '#fde047' : '#fca5a5'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>每件净利润</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: profitResult.gross >= 0 ? '#16a34a' : '#dc2626' }}>
                      ${profitResult.gross.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>利润率</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: profitResult.rate >= 20 ? '#16a34a' : profitResult.rate >= 0 ? '#d97706' : '#dc2626' }}>
                      {profitResult.rate.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: '#475569' }}>
                  {profitResult.rate > 30 ? '🔥 超优质产品，强烈建议选品！' :
                   profitResult.rate > 20 ? '✅ 利润健康，值得考虑' :
                   profitResult.rate > 10 ? '⚠️ 利润偏低，需压缩成本' :
                   '❌ 利润不足，不建议选品'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AI推荐 Tab ── */}
        {activeTab === 'recommend' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>🤖 今日AI精选</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>每天更新</div>
            </div>
            {recommendations.map(rec => (
              <div key={rec.id} style={{
                background: 'white', borderRadius: 10, padding: 12, marginBottom: 10,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', flex: 1, paddingRight: 8, lineHeight: 1.4 }}>
                    {rec.title}
                  </div>
                  <span style={{ fontSize: 11, borderRadius: 12, padding: '2px 8px', whiteSpace: 'nowrap', ...getPotentialColor(rec.potential) as any }}>
                    {getPotentialLabel(rec.potential)}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8, lineHeight: 1.5 }}>
                  💡 {rec.reason}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>${rec.price}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => chrome.tabs.create({ url: `https://www.amazon.com/dp/${rec.asin}` })} style={{
                      padding: '5px 10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
                      borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 600,
                    }}>
                      看亚马逊
                    </button>
                    <button onClick={() => chrome.tabs.create({ url: `https://www.1688.com/chanpin/${encodeURIComponent(rec.title.split(' ')[0])}.html` })} style={{
                      padding: '5px 10px', background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa',
                      borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 600,
                    }}>
                      找货源
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: 10, padding: 12, border: '1px solid #bfdbfe', textAlign: 'center', fontSize: 12, color: '#1d4ed8' }}>
              ✨ AI推荐功能持续优化中，即将支持个性化画像匹配
            </div>
          </div>
        )}

        {/* ── 监控清单 Tab ── */}
        {activeTab === 'watchlist' && (
          <WatchlistTab onCountChange={setSavedCount} />
        )}

        {/* ── 设置 Tab ── */}
        {activeTab === 'settings' && (
          <div>
            <div style={{ background: 'white', borderRadius: 10, padding: 14, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>🔑 API 配置</div>
              <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 6 }}>Keepa API Key</label>
              <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                placeholder="输入 Keepa API Key 获取价格历史数据"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, outline: 'none', marginBottom: 8, boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>
                免费注册 → <span style={{ color: '#3b82f6', cursor: 'pointer' }} onClick={() => chrome.tabs.create({ url: 'https://keepa.com/' })}>keepa.com</span> 获取 API Key
              </div>
              <button onClick={async () => { await chrome.storage.local.set({ keepaApiKey: apiKey }); alert('✅ 保存成功'); }} style={{
                width: '100%', padding: '9px', background: '#1d4ed8', color: 'white',
                border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600,
              }}>
                保存配置
              </button>
            </div>
            <div style={{ background: 'white', borderRadius: 10, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>ℹ️ 关于</div>
              {[
                ['版本', 'v1.0.0 Beta'],
                ['状态', '🟢 免费开放'],
                ['GitHub', 'ai-selection-extension'],
                ['反馈', 'Issues 欢迎提交'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>{k}</span>
                  <span style={{ color: '#1e293b', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: '#f1f5f9', borderTop: '1px solid #e2e8f0', padding: '8px 14px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>💖 完全免费 · AI驱动 · 持续迭代 · 助你选品成功</div>
      </div>
    </div>
  );
};

// ─── 监控清单子组件 ──────────────────────────────────────
const WatchlistTab: React.FC<{ onCountChange: (n: number) => void }> = ({ onCountChange }) => {
  const [list, setList] = useState<any[]>([]);

  useEffect(() => {
    chrome.storage.local.get(['watchlist'], (r) => {
      setList((r.watchlist as any[]) || []);
    });
  }, []);

  const remove = async (asin: string) => {
    const newList = list.filter(i => i.asin !== asin);
    await chrome.storage.local.set({ watchlist: newList });
    setList(newList);
    onCountChange(newList.length);
  };

  if (list.length === 0) return (
    <div style={{ textAlign: 'center', padding: '24px 16px' }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
      <div style={{ fontSize: 13, color: '#64748b' }}>暂无监控产品</div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>在产品分析页点击"加入监控"</div>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>共 {list.length} 个监控产品</div>
      {list.map((item: any) => (
        <div key={item.asin} style={{ background: 'white', borderRadius: 10, padding: 12, marginBottom: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>{item.asin}</div>
              <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>${item.price}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => chrome.tabs.create({ url: item.url || `https://www.amazon.com/dp/${item.asin}` })} style={{
                padding: '5px 8px', background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: 5, fontSize: 11, cursor: 'pointer',
              }}>查看</button>
              <button onClick={() => remove(item.asin)} style={{
                padding: '5px 8px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 5, fontSize: 11, cursor: 'pointer',
              }}>删除</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default App;
