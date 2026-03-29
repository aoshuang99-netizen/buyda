import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import {
  getAIRecommendations,
  analyzeProductWithAI,
  loadAIConfig,
  saveAIConfig,
  type AIRecommendation,
  type AIProductAnalysis,
  type UserProfile,
} from '../utils/aiApi';
import { fetchKeepaViaBackground } from '../utils/keepaApi';

const PriceChart = lazy(() => import('../components/PriceChart'));
type GenerateFn = typeof import('../components/PriceChart')['generateMockPriceHistory'];
let _generateMockFn: GenerateFn | null = null;
async function getMockHistory(price: number) {
  if (!_generateMockFn) {
    const mod = await import('../components/PriceChart');
    _generateMockFn = mod.generateMockPriceHistory;
  }
  return _generateMockFn(price);
}

type PricePoint = { date: string; price: number; timestamp?: number };

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
  brand?: string;
  availability?: string;
  primeEligible?: boolean;
  url: string;
}

interface ProfitCalc {
  costPrice: string;
  shippingCost: string;
  fbaFee: string;
  adFee: string;
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
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('analyze');
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIProductAnalysis | null>(null);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [keepaStatus, setKeepaStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [keepaApiKey, setKeepaApiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [aiProvider, setAiProvider] = useState<'mock' | 'openai' | 'claude'>('mock');
  const [profit, setProfit] = useState<ProfitCalc>({ costPrice: '', shippingCost: '', fbaFee: '', adFee: '' });
  const [profitResult, setProfitResult] = useState<{ gross: number; rate: number } | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [currentUrl, setCurrentUrl] = useState('');
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [recLoading, setRecLoading] = useState(false);

  useEffect(() => {
    loadSettings();
    loadSavedCount();
    getCurrentTab();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.local.get(['keepaApiKey', 'openaiKey', 'claudeKey', 'aiProvider']);
      if (result.keepaApiKey) setKeepaApiKey(result.keepaApiKey as string);
      if (result.openaiKey) setOpenaiKey(result.openaiKey as string);
      if (result.claudeKey) setClaudeKey(result.claudeKey as string);
      if (result.aiProvider) setAiProvider(result.aiProvider as any);
    } catch {}
  };

  const loadSavedCount = async () => {
    try {
      const result = await chrome.storage.local.get(['watchlist']);
      setSavedCount(((result.watchlist as any[]) || []).length);
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

  // ── 分析产品 ──
  const handleAnalyze = useCallback(async () => {
    if (!asinFromUrl) {
      alert('请先打开一个亚马逊产品页面');
      return;
    }
    setLoading(true);
    setAiAnalysis(null);
    setPriceHistory([]);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['amazon-content.js'],
        });
      } catch {}

      await new Promise(resolve => setTimeout(resolve, 500));

      chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_DATA' }, async (response) => {
        if (chrome.runtime.lastError) {
          console.error('消息失败:', chrome.runtime.lastError);
          alert('无法与页面通信，请刷新页面后重试');
          setLoading(false);
          return;
        }

        let data: ProductData;
        if (response?.success && response?.data) {
          const d = response.data;
          data = {
            asin: d.asin,
            title: d.title,
            price: d.price,
            originalPrice: d.price * 1.2,
            rank: d.rank,
            rating: d.rating,
            reviews: d.reviewCount,
            imageUrl: d.imageUrl,
            category: d.category,
            brand: d.brand,
            availability: d.availability,
            primeEligible: d.primeEligible,
            url: currentUrl,
          };
        } else {
          data = {
            asin: asinFromUrl, title: '无法获取标题', price: 0,
            rank: 0, rating: 0, reviews: 0, imageUrl: '',
            category: '', url: currentUrl,
          };
        }

        setProductData(data);
        setLoading(false);

        // 保存最近分析的产品（供1688面板使用）
        chrome.runtime.sendMessage({ type: 'SAVE_ANALYZED_PRODUCT', product: data });

        // 异步获取 Keepa 价格历史
        if (keepaApiKey && data.asin) {
          loadKeepaHistory(data.asin, data.price);
        } else {
          // 使用 Mock 数据
          getMockHistory(data.price || 30).then(setPriceHistory);
        }

        // 异步获取 AI 分析
        loadAIAnalysis(data);
      });
    } catch (error) {
      console.error('分析失败:', error);
      alert('获取产品数据失败，请刷新页面后重试');
      setLoading(false);
    }
  }, [asinFromUrl, currentUrl, keepaApiKey]);

  // ── 加载 Keepa 历史数据 ──
  const loadKeepaHistory = async (asin: string, currentPrice: number) => {
    setKeepaStatus('loading');
    try {
      const result = await fetchKeepaViaBackground(asin, keepaApiKey);
      if (result.success && result.products?.[0]?.priceHistory?.length) {
        setPriceHistory(result.products[0].priceHistory as PricePoint[]);
        setKeepaStatus('success');
      } else {
        // Keepa 失败，用 Mock 数据
        getMockHistory(currentPrice).then(setPriceHistory);
        setKeepaStatus('error');
      }
    } catch {
      getMockHistory(currentPrice).then(setPriceHistory);
      setKeepaStatus('error');
    }
  };

  // ── AI 产品分析 ──
  const loadAIAnalysis = async (data: ProductData) => {
    setAiLoading(true);
    try {
      const config = await loadAIConfig();
      const analysis = await analyzeProductWithAI({
        asin: data.asin,
        title: data.title,
        price: data.price,
        rank: data.rank,
        rating: data.rating,
        reviews: data.reviews,
        category: data.category,
      }, config);
      setAiAnalysis(analysis);
    } catch (e) {
      console.error('AI 分析失败:', e);
    } finally {
      setAiLoading(false);
    }
  };

  // ── 加载 AI 推荐 ──
  const loadRecommendations = async () => {
    setRecLoading(true);
    try {
      const config = await loadAIConfig();
      const profile: UserProfile = {
        experience: 'intermediate',
        priceRange: { min: 10, max: 60 },
        currentProduct: productData ? {
          asin: productData.asin,
          title: productData.title,
          price: productData.price,
          rank: productData.rank,
          category: productData.category,
        } : undefined,
      };
      const recs = await getAIRecommendations(profile, config);
      setRecommendations(recs);
    } catch (e) {
      console.error('AI 推荐失败:', e);
    } finally {
      setRecLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'recommend' && recommendations.length === 0) {
      loadRecommendations();
    }
  }, [activeTab]);

  const calcProfit = () => {
    if (!productData) return;
    const sell = productData.price;
    const cost = parseFloat(profit.costPrice) || 0;
    const ship = parseFloat(profit.shippingCost) || 0;
    const fba = parseFloat(profit.fbaFee) || sell * 0.15;
    const ad = parseFloat(profit.adFee) || sell * 0.10;
    const gross = sell - cost - ship - fba - ad;
    setProfitResult({ gross, rate: (gross / sell) * 100 });
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

  const saveSettings = async () => {
    await chrome.storage.local.set({
      keepaApiKey,
      openaiKey,
      claudeKey,
      aiProvider,
    });
    await saveAIConfig({ provider: aiProvider, apiKey: aiProvider === 'openai' ? openaiKey : claudeKey });
    alert('✅ 配置已保存');
  };

  const tabs: { key: TabType; icon: string; label: string }[] = [
    { key: 'analyze', icon: '🔍', label: '分析' },
    { key: 'profit', icon: '💰', label: '利润' },
    { key: 'recommend', icon: '🤖', label: 'AI推荐' },
    { key: 'watchlist', icon: '📋', label: `监控(${savedCount})` },
    { key: 'settings', icon: '⚙️', label: '设置' },
  ];

  const verdictColor = (v: string) => {
    if (v === '强烈推荐') return { bg: '#f0fdf4', color: '#16a34a', border: '#86efac' };
    if (v === '推荐') return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
    if (v === '谨慎') return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
    return { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' };
  };

  return (
    <div style={{ width: 360, minHeight: 520, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#F8FAFC' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', padding: '12px 16px', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>🤖</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Buyda 选品智能体</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>AI驱动 · 价格趋势 · 货源匹配</div>
          </div>
          {isAmazonPage && asinFromUrl && (
            <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: '2px 8px', fontSize: 11 }}>
              {asinFromUrl}
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
                <button onClick={() => chrome.tabs.create({ url: 'https://www.amazon.com' })}
                  style={{ background: '#ff9900', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                  打开亚马逊
                </button>
              </div>
            ) : (
              <>
                <button onClick={handleAnalyze} disabled={loading} style={{
                  width: '100%', padding: '12px',
                  background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                  color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 14,
                }}>
                  {loading ? '⏳ 正在分析...' : '🔍 分析当前产品'}
                </button>

                {productData && (
                  <div>
                    {/* 核心指标 */}
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

                    {/* 价格趋势图 */}
                    {priceHistory.length > 0 && (
                      <Suspense fallback={
                        <div style={{ background: 'white', borderRadius: 10, padding: 14, marginBottom: 12, border: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                          📈 加载价格图表...
                        </div>
                      }>
                        <PriceChart
                          data={priceHistory}
                          currentPrice={productData.price}
                        />
                      </Suspense>
                    )}
                    {keepaApiKey && keepaStatus === 'loading' && (
                      <div style={{ background: '#eff6ff', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 11, color: '#2563eb' }}>
                        🔄 从 Keepa 获取历史价格...
                      </div>
                    )}

                    {/* AI 深度分析 */}
                    {aiLoading ? (
                      <div style={{ background: 'white', borderRadius: 10, padding: 14, marginBottom: 12, border: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                        🤖 AI 深度分析中...
                      </div>
                    ) : aiAnalysis ? (
                      <div style={{ background: 'white', borderRadius: 10, padding: 14, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>🤖 AI 深度评估</div>
                          <div style={{
                            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                            background: verdictColor(aiAnalysis.verdict).bg,
                            color: verdictColor(aiAnalysis.verdict).color,
                            border: `1px solid ${verdictColor(aiAnalysis.verdict).border}`,
                          }}>
                            {aiAnalysis.verdict}
                          </div>
                        </div>

                        {/* 综合评分 */}
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: '#475569' }}>综合选品评分</span>
                            <span style={{ fontWeight: 700, color: aiAnalysis.overallScore >= 70 ? '#16a34a' : aiAnalysis.overallScore >= 50 ? '#d97706' : '#dc2626' }}>
                              {aiAnalysis.overallScore}/100
                            </span>
                          </div>
                          <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${aiAnalysis.overallScore}%`,
                              background: `linear-gradient(90deg, #3b82f6, ${aiAnalysis.overallScore >= 70 ? '#10b981' : '#f59e0b'})`,
                              borderRadius: 4,
                              transition: 'width 0.8s ease',
                            }} />
                          </div>
                        </div>

                        <div style={{ fontSize: 12, color: '#475569', marginBottom: 8, lineHeight: 1.5 }}>{aiAnalysis.summary}</div>

                        {/* 优劣势 */}
                        {aiAnalysis.strengths.length > 0 && (
                          <div style={{ marginBottom: 6 }}>
                            {aiAnalysis.strengths.slice(0, 2).map((s, i) => (
                              <div key={i} style={{ fontSize: 11, color: '#16a34a', marginBottom: 2 }}>✅ {s}</div>
                            ))}
                            {aiAnalysis.weaknesses.slice(0, 1).map((w, i) => (
                              <div key={i} style={{ fontSize: 11, color: '#dc2626', marginBottom: 2 }}>⚠️ {w}</div>
                            ))}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <div style={{ flex: 1, background: '#f8fafc', borderRadius: 6, padding: '6px 8px' }}>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>入场难度</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{aiAnalysis.entryDifficulty}</div>
                          </div>
                          <div style={{ flex: 1, background: '#f8fafc', borderRadius: 6, padding: '6px 8px' }}>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>启动资金</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{aiAnalysis.estimatedLaunchCost}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // 原有的简单AI评估（fallback）
                      <div style={{ background: 'white', borderRadius: 10, padding: 14, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>🤖 快速评估</div>
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
                              <div style={{ height: '100%', width: `${item.score}%`, background: item.color, borderRadius: 3 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={saveToWatchlist} style={{ flex: 1, padding: '9px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                        📋 加入监控
                      </button>
                      <button onClick={() => setActiveTab('profit')} style={{ flex: 1, padding: '9px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                        💰 算利润
                      </button>
                      <button onClick={() => chrome.tabs.create({ url: `https://www.1688.com/chanpin/${encodeURIComponent(productData.title.split(' ').slice(0, 3).join('+'))}.html` })} style={{ flex: 1, padding: '9px', background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
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
                  <input type="number" placeholder={field.placeholder}
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
              }}>
                计算利润
              </button>
            </div>

            {profitResult && (
              <div style={{
                background: profitResult.rate > 20 ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : profitResult.rate > 0 ? 'linear-gradient(135deg, #fffbeb, #fef9c3)' : 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                borderRadius: 10, padding: 16,
                border: `1px solid ${profitResult.rate > 20 ? '#86efac' : profitResult.rate > 0 ? '#fde047' : '#fca5a5'}`,
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
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                🤖 {aiProvider === 'mock' ? 'AI 示例推荐' : 'AI 个性化推荐'}
              </div>
              <button onClick={loadRecommendations} disabled={recLoading} style={{
                fontSize: 11, color: '#2563eb', background: 'none', border: 'none',
                cursor: recLoading ? 'not-allowed' : 'pointer', padding: '2px 6px',
              }}>
                {recLoading ? '⏳' : '🔄 刷新'}
              </button>
            </div>

            {recLoading ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: 13 }}>
                🤖 AI 正在分析市场机会...
              </div>
            ) : recommendations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: 13 }}>
                点击刷新获取推荐
              </div>
            ) : (
              <>
                {recommendations.map((rec, idx) => (
                  <div key={idx} style={{
                    background: 'white', borderRadius: 10, padding: 12, marginBottom: 10,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', flex: 1, paddingRight: 8, lineHeight: 1.4 }}>
                        {rec.title}
                      </div>
                      <span style={{
                        fontSize: 11, borderRadius: 12, padding: '2px 8px', whiteSpace: 'nowrap',
                        background: rec.potential === 'high' ? '#f0fdf4' : rec.potential === 'medium' ? '#fffbeb' : '#fef2f2',
                        color: rec.potential === 'high' ? '#16a34a' : rec.potential === 'medium' ? '#d97706' : '#dc2626',
                        border: `1px solid ${rec.potential === 'high' ? '#bbf7d0' : rec.potential === 'medium' ? '#fde68a' : '#fca5a5'}`,
                        fontWeight: 600,
                      }}>
                        {getPotentialLabel(rec.potential)}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8, lineHeight: 1.5 }}>
                      💡 {rec.reason}
                    </div>
                    {rec.keyAdvantages?.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        {rec.keyAdvantages.slice(0, 2).map((adv, i) => (
                          <span key={i} style={{ display: 'inline-block', fontSize: 10, background: '#eff6ff', color: '#2563eb', borderRadius: 8, padding: '1px 7px', marginRight: 4, marginBottom: 3 }}>
                            {adv}
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>${rec.estimatedPrice}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => chrome.tabs.create({ url: `https://www.amazon.com/s?k=${encodeURIComponent(rec.title)}` })} style={{
                          padding: '5px 10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
                          borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 600,
                        }}>
                          亚马逊
                        </button>
                        <button onClick={() => chrome.tabs.create({ url: `https://s.1688.com/selloffer/offer_search.htm?keywords=${encodeURIComponent(rec.supplierKeyword || rec.title.split(' ')[0])}` })} style={{
                          padding: '5px 10px', background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa',
                          borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 600,
                        }}>
                          1688货源
                        </button>
                      </div>
                    </div>
                    {rec.estimatedMonthlyRevenue && (
                      <div style={{ marginTop: 6, fontSize: 11, color: '#64748b' }}>
                        💰 预估月收入: <strong>{rec.estimatedMonthlyRevenue}</strong>
                      </div>
                    )}
                  </div>
                ))}

                {aiProvider === 'mock' && (
                  <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: 10, padding: 12, border: '1px solid #bfdbfe', textAlign: 'center', fontSize: 12, color: '#1d4ed8' }}>
                    💡 在设置中配置 OpenAI / Claude API Key，获取个性化 AI 推荐
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── 监控清单 Tab ── */}
        {activeTab === 'watchlist' && (
          <WatchlistTab onCountChange={setSavedCount} />
        )}

        {/* ── 设置 Tab ── */}
        {activeTab === 'settings' && (
          <div>
            {/* Keepa 配置 */}
            <div style={{ background: 'white', borderRadius: 10, padding: 14, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>📈 Keepa API（价格趋势）</div>
              <input type="password" value={keepaApiKey} onChange={e => setKeepaApiKey(e.target.value)}
                placeholder="输入 Keepa API Key 获取真实价格历史"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, outline: 'none', marginBottom: 6, boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
                免费注册 → <span style={{ color: '#3b82f6', cursor: 'pointer' }} onClick={() => chrome.tabs.create({ url: 'https://keepa.com/' })}>keepa.com</span>（60,000次/月）
              </div>
            </div>

            {/* AI 配置 */}
            <div style={{ background: 'white', borderRadius: 10, padding: 14, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>🤖 AI 推荐引擎</div>

              {/* Provider 选择 */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {(['mock', 'openai', 'claude'] as const).map(p => (
                  <button key={p} onClick={() => setAiProvider(p)} style={{
                    flex: 1, padding: '6px', fontSize: 11, borderRadius: 7, cursor: 'pointer', fontWeight: 600,
                    background: aiProvider === p ? '#eff6ff' : '#f8fafc',
                    color: aiProvider === p ? '#2563eb' : '#64748b',
                    border: `1px solid ${aiProvider === p ? '#bfdbfe' : '#e2e8f0'}`,
                  }}>
                    {p === 'mock' ? '🎲 示例' : p === 'openai' ? '🧠 GPT' : '✨ Claude'}
                  </button>
                ))}
              </div>

              {aiProvider === 'openai' && (
                <>
                  <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 4 }}>OpenAI API Key</label>
                  <input type="password" value={openaiKey} onChange={e => setOpenaiKey(e.target.value)}
                    placeholder="sk-..."
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, outline: 'none', marginBottom: 6, boxSizing: 'border-box' }}
                  />
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    获取: <span style={{ color: '#3b82f6', cursor: 'pointer' }} onClick={() => chrome.tabs.create({ url: 'https://platform.openai.com/api-keys' })}>platform.openai.com</span>
                  </div>
                </>
              )}

              {aiProvider === 'claude' && (
                <>
                  <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 4 }}>Anthropic Claude API Key</label>
                  <input type="password" value={claudeKey} onChange={e => setClaudeKey(e.target.value)}
                    placeholder="sk-ant-..."
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, outline: 'none', marginBottom: 6, boxSizing: 'border-box' }}
                  />
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    获取: <span style={{ color: '#3b82f6', cursor: 'pointer' }} onClick={() => chrome.tabs.create({ url: 'https://console.anthropic.com/' })}>console.anthropic.com</span>
                  </div>
                </>
              )}
            </div>

            <button onClick={saveSettings} style={{
              width: '100%', padding: '10px', background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              color: 'white', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600,
              marginBottom: 12,
            }}>
              💾 保存所有配置
            </button>

            <div style={{ background: 'white', borderRadius: 10, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>ℹ️ 关于 Buyda</div>
              {[
                ['版本', 'v1.1.0'],
                ['新功能', '价格趋势图 + AI分析'],
                ['AI支持', 'GPT-4o / Claude 3.5'],
                ['状态', '🟢 免费开放'],
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
        <div style={{ fontSize: 11, color: '#94a3b8' }}>💖 Buyda v1.1.0 · AI驱动 · 价格趋势 · 货源匹配</div>
      </div>
    </div>
  );
};

// ─── 监控清单子组件 ──────────────────────────────────────
const WatchlistTab: React.FC<{ onCountChange: (n: number) => void }> = ({ onCountChange }) => {
  const [list, setList] = useState<any[]>([]);
  const [filter, setFilter] = useState('');

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

  const filtered = filter ? list.filter(i => i.asin?.includes(filter) || i.title?.toLowerCase().includes(filter.toLowerCase())) : list;

  if (list.length === 0) return (
    <div style={{ textAlign: 'center', padding: '24px 16px' }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
      <div style={{ fontSize: 13, color: '#64748b' }}>暂无监控产品</div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>在产品分析页点击"加入监控"</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: '#64748b' }}>共 {list.length} 个监控产品</div>
        <input placeholder="搜索..." value={filter} onChange={e => setFilter(e.target.value)}
          style={{ fontSize: 11, padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6, outline: 'none', width: 80 }}
        />
      </div>
      {filtered.map((item: any) => (
        <div key={item.asin} style={{ background: 'white', borderRadius: 10, padding: 12, marginBottom: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, paddingRight: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', marginBottom: 3, lineHeight: 1.3 }}>
                {item.title || item.asin}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>${item.price}</span>
                {item.rank > 0 && <span style={{ fontSize: 11, color: '#94a3b8' }}>BSR #{item.rank.toLocaleString()}</span>}
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
                {new Date(item.savedAt).toLocaleDateString('zh-CN')} 添加
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button onClick={() => chrome.tabs.create({ url: item.url || `https://www.amazon.com/dp/${item.asin}` })} style={{
                padding: '4px 8px', background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: 5, fontSize: 10, cursor: 'pointer', fontWeight: 600,
              }}>查看</button>
              <button onClick={() => remove(item.asin)} style={{
                padding: '4px 8px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 5, fontSize: 10, cursor: 'pointer', fontWeight: 600,
              }}>删除</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default App;
