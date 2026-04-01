import React from 'react';
import { type AIProductAnalysis } from '../utils/aiApi';
import { detectPitfalls } from '../utils/pitfallDetection';

interface ProductData {
  asin: string;
  title: string;
  price: number;
  rank: number;
  rating: number;
  reviews: number;
  imageUrl: string;
  category: string;
}

interface CommandCenterProps {
  productData: ProductData | null;
  aiAnalysis: AIProductAnalysis | null;
  profitResult: { gross: number; rate: number } | null;
  setActiveTab: (tab: any) => void;
}

// ─── 内联样式常量 (Sophos Design System) ─────────────────
const COLORS = {
  bg: '#F0F4F8',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  brand: '#1D4ED8',
  brandLight: '#EFF6FF',
  success: '#16A34A',
  successLight: '#F0FDF4',
  successBorder: '#86EFAC',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  warningBorder: '#FDE68A',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  dangerBorder: '#FCA5A5',
  dark: '#0F172A',
  darkCard: '#1E293B',
};

const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: COLORS.surface,
  borderRadius: 10,
  border: `1px solid ${COLORS.border}`,
  overflow: 'hidden',
  ...extra,
});

// ─── 评分环形进度条组件 ────────────────────────────────────
const ScoreRing: React.FC<{ score: number; size?: number; label?: string }> = ({ score, size = 64, label }) => {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? COLORS.success : score >= 50 ? COLORS.warning : COLORS.danger;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={COLORS.border} strokeWidth={6} />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={color} strokeWidth={6}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: size > 56 ? 16 : 13, fontWeight: 800, color }}>{score}</span>
        </div>
      </div>
      {label && <span style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 500 }}>{label}</span>}
    </div>
  );
};

// ─── 指标卡组件 ─────────────────────────────────────────────
const MetricCard: React.FC<{
  label: string; value: string; sub?: string;
  accent?: string; onClick?: () => void; icon?: string;
}> = ({ label, value, sub, accent, onClick, icon }) => (
  <div
    onClick={onClick}
    style={{
      ...card(),
      padding: '12px 14px',
      cursor: onClick ? 'pointer' : 'default',
      borderLeft: accent ? `3px solid ${accent}` : `1px solid ${COLORS.border}`,
      transition: 'box-shadow 0.15s',
    }}
    onMouseEnter={e => onClick && ((e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)')}
    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 500, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: accent || COLORS.textPrimary, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>{sub}</div>}
      </div>
      {icon && <span style={{ fontSize: 18, opacity: 0.6 }}>{icon}</span>}
    </div>
  </div>
);

// ─── 风险标签 ────────────────────────────────────────────────
const RiskTag: React.FC<{ severity: string; title: string; description: string; onLearn: () => void }> = ({
  severity, title, description, onLearn
}) => {
  const cfg = severity === 'high'
    ? { bg: COLORS.dangerLight, border: COLORS.dangerBorder, text: COLORS.danger, icon: '🔴' }
    : severity === 'medium'
      ? { bg: COLORS.warningLight, border: COLORS.warningBorder, text: COLORS.warning, icon: '🟡' }
      : { bg: COLORS.brandLight, border: '#BFDBFE', text: COLORS.brand, icon: '🔵' };

  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderLeft: `3px solid ${cfg.text}`,
      borderRadius: 8, padding: '8px 10px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 12 }}>{cfg.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: cfg.text }}>{title}</span>
        </div>
        <button
          onClick={onLearn}
          style={{
            fontSize: 10, color: COLORS.textMuted, background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, textDecoration: 'underline', whiteSpace: 'nowrap',
          }}
        >
          查看应对方案 →
        </button>
      </div>
      <p style={{ fontSize: 11, color: COLORS.textSecondary, margin: '4px 0 0 0', lineHeight: 1.5 }}>{description}</p>
    </div>
  );
};

// ─── 主组件 ──────────────────────────────────────────────────
export const CommandCenterTab: React.FC<CommandCenterProps> = ({
  productData, aiAnalysis, profitResult, setActiveTab
}) => {
  // 未分析状态
  if (!productData) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: COLORS.textMuted }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, #1e3a5f, #1d4ed8)',
          margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32,
        }}>🛡️</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 6 }}>
          指挥中心待命中
        </div>
        <p style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.6 }}>
          请打开亚马逊商品页面<br />点击「分析当前产品」启动 AI 选品评估
        </p>
        <button
          onClick={() => setActiveTab('analyze')}
          style={{
            marginTop: 16, padding: '8px 20px', borderRadius: 6,
            background: COLORS.brand, color: 'white', border: 'none',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          前往分析页 →
        </button>
      </div>
    );
  }

  // ── 数据计算 ──────────────────────────────────────────────
  const pitfallMetrics = {
    dailySales: 100,
    profitMargin: profitResult?.rate,
    monthlySearchVolume: 100000,
    newProductRatio: 15,
    cr3: 45,
    adDensity: 20,
    supplyScore: 85,
    deliveryDays: 5,
    hasMarketData: !!aiAnalysis,
  };

  const pitfallReport = detectPitfalls(pitfallMetrics);
  const hasHighRisk = pitfallReport.highSeverity > 0;
  const hasMediumRisk = pitfallReport.mediumSeverity > 0;
  const overallScore = aiAnalysis?.overallScore || 0;

  // 综合判定
  type VerdictKey = 'CLEAR' | 'CAUTION' | 'BLOCKED';
  const verdictKey: VerdictKey = hasHighRisk ? 'BLOCKED' : hasMediumRisk || (profitResult && profitResult.rate < 20) ? 'CAUTION' : 'CLEAR';

  const VERDICT_MAP: Record<VerdictKey, { bg: string; badge: string; label: string; sub: string; icon: string }> = {
    CLEAR: {
      bg: 'linear-gradient(135deg, #064e3b, #16a34a)',
      badge: COLORS.successLight,
      label: '建议入手',
      sub: '各项指标健康，未发现明显短板，可进入下一步',
      icon: '✅',
    },
    CAUTION: {
      bg: 'linear-gradient(135deg, #78350f, #d97706)',
      badge: COLORS.warningLight,
      label: '谨慎评估',
      sub: '存在潜在风险，建议制定详细应对策略后再入场',
      icon: '⚠️',
    },
    BLOCKED: {
      bg: 'linear-gradient(135deg, #7f1d1d, #dc2626)',
      badge: COLORS.dangerLight,
      label: '高危拦截',
      sub: '系统检测到致命风险，已触发拦截机制，建议放弃',
      icon: '🛑',
    },
  };

  const verdict = VERDICT_MAP[verdictKey];

  // 利润颜色
  const profitColor = !profitResult ? COLORS.textMuted
    : profitResult.rate >= 20 ? COLORS.success
    : profitResult.rate >= 10 ? COLORS.warning
    : COLORS.danger;

  return (
    <div style={{ padding: '0 2px', paddingBottom: 16 }}>

      {/* ── 产品摘要条 ─────────────────────────────────── */}
      <div style={{ ...card({ borderRadius: '0 0 10px 10px', borderTop: 'none' }), padding: '10px 14px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {productData.imageUrl
            ? <img src={productData.imageUrl} alt="p" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 6, border: `1px solid ${COLORS.border}` }} />
            : <div style={{ width: 40, height: 40, background: COLORS.surfaceAlt, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={productData.title}>
              {productData.title}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 3, fontSize: 10, color: COLORS.textMuted }}>
              <span style={{ fontFamily: 'monospace', background: COLORS.surfaceAlt, borderRadius: 3, padding: '1px 4px' }}>{productData.asin}</span>
              <span>💰 ${productData.price}</span>
              <span>⭐ {productData.rating} ({productData.reviews}评)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 核心决策横幅 ────────────────────────────────── */}
      <div style={{ background: verdict.bg, borderRadius: 12, padding: '14px 16px', marginBottom: 12, color: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, opacity: 0.75, textTransform: 'uppercase', marginBottom: 6 }}>
              AI 综合决策 · 选品指挥中心
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28 }}>{verdict.icon}</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1 }}>{verdict.label}</div>
                <div style={{ fontSize: 10, opacity: 0.85, marginTop: 4, maxWidth: 200, lineHeight: 1.5 }}>{verdict.sub}</div>
              </div>
            </div>
          </div>
          {overallScore > 0 && (
            <div style={{ textAlign: 'center', opacity: 0.9 }}>
              <ScoreRing score={overallScore} size={60} />
              <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2, letterSpacing: 0.5 }}>综合评分</div>
            </div>
          )}
        </div>

        {/* 风险摘要徽章 */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          {pitfallReport.highSeverity > 0 && (
            <span style={{ background: 'rgba(220,38,38,0.8)', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
              🔴 {pitfallReport.highSeverity} 个致命风险
            </span>
          )}
          {pitfallReport.mediumSeverity > 0 && (
            <span style={{ background: 'rgba(217,119,6,0.8)', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
              🟡 {pitfallReport.mediumSeverity} 个中等风险
            </span>
          )}
          {pitfallReport.highSeverity === 0 && pitfallReport.mediumSeverity === 0 && (
            <span style={{ background: 'rgba(22,163,74,0.8)', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
              ✅ 通过风险拦截检测
            </span>
          )}
        </div>
      </div>

      {/* ── 核心指标四宫格 ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <MetricCard
          label="毛利率预测"
          value={profitResult ? `${profitResult.rate.toFixed(1)}%` : '未测算'}
          sub="点击进行精确利润测算"
          accent={profitColor}
          icon="💰"
          onClick={() => setActiveTab('profit')}
        />
        <MetricCard
          label="AI 竞争力评分"
          value={overallScore > 0 ? `${overallScore} 分` : '未分析'}
          sub={aiAnalysis?.verdict || '点击查看雷达图'}
          accent={overallScore >= 70 ? COLORS.success : overallScore >= 50 ? COLORS.warning : undefined}
          icon="📊"
          onClick={() => setActiveTab('scoring')}
        />
        <MetricCard
          label="产品排名 BSR"
          value={productData.rank > 0 ? `#${productData.rank.toLocaleString()}` : '--'}
          sub={`类目: ${productData.category || '未知'}`}
          accent={productData.rank > 0 && productData.rank < 5000 ? COLORS.success : COLORS.warning}
          icon="📈"
          onClick={() => setActiveTab('market')}
        />
        <MetricCard
          label="评价健康度"
          value={productData.rating > 0 ? `${productData.rating}⭐` : '--'}
          sub={`${productData.reviews.toLocaleString()} 条评论`}
          accent={productData.rating >= 4.2 ? COLORS.success : productData.rating >= 3.8 ? COLORS.warning : COLORS.danger}
          icon="💬"
          onClick={() => setActiveTab('analyze')}
        />
      </div>

      {/* ── AI 分析摘要 ─────────────────────────────────── */}
      {aiAnalysis && (
        <div style={{ ...card(), marginBottom: 12 }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.surfaceAlt, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary }}>🤖 AI 分析摘要</span>
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>{aiAnalysis.entryDifficulty} 难度入场</span>
          </div>
          <div style={{ padding: '10px 14px' }}>
            <p style={{ fontSize: 11, color: COLORS.textSecondary, lineHeight: 1.6, margin: '0 0 10px' }}>
              {aiAnalysis.summary}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {aiAnalysis.strengths.slice(0, 2).map((s, i) => (
                <div key={i} style={{ fontSize: 10, color: COLORS.success, background: COLORS.successLight, borderRadius: 5, padding: '4px 8px', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                  <span>✓</span><span>{s}</span>
                </div>
              ))}
              {aiAnalysis.weaknesses.slice(0, 2).map((w, i) => (
                <div key={i} style={{ fontSize: 10, color: COLORS.danger, background: COLORS.dangerLight, borderRadius: 5, padding: '4px 8px', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                  <span>✗</span><span>{w}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 风险拦截雷达 ────────────────────────────────── */}
      <div style={{ ...card(), marginBottom: 12 }}>
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.surfaceAlt, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary }}>🛡️ 风险拦截雷达</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {pitfallReport.highSeverity > 0 && (
              <span style={{ fontSize: 10, background: COLORS.dangerLight, color: COLORS.danger, border: `1px solid ${COLORS.dangerBorder}`, borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>
                高危 {pitfallReport.highSeverity}
              </span>
            )}
            {pitfallReport.mediumSeverity > 0 && (
              <span style={{ fontSize: 10, background: COLORS.warningLight, color: COLORS.warning, border: `1px solid ${COLORS.warningBorder}`, borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>
                预警 {pitfallReport.mediumSeverity}
              </span>
            )}
            {pitfallReport.totalPitfalls === 0 && (
              <span style={{ fontSize: 10, background: COLORS.successLight, color: COLORS.success, border: `1px solid ${COLORS.successBorder}`, borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>
                全部通过
              </span>
            )}
          </div>
        </div>
        <div style={{ padding: '10px 14px' }}>
          {pitfallReport.totalPitfalls === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: COLORS.success }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🎉</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>未检测到明显认知误区或供应链风险</div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>继续关注价格波动和竞品动态</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pitfallReport.pitfalls.map((p, i) => (
                <RiskTag
                  key={i}
                  severity={p.severity}
                  title={p.title}
                  description={p.description}
                  onLearn={() => setActiveTab('ai')}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 行动剧本 (Playbook) ──────────────────────────── */}
      <div style={{ background: COLORS.darkCard, borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'white', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>⚡</span> 推荐行动剧本 (Playbook)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {hasHighRisk ? (
            <>
              <PlaybookButton icon="📖" label="学习如何规避当前致命风险" primary onClick={() => setActiveTab('ai')} />
              <PlaybookButton icon="🔍" label="寻找同类目低风险替代品" onClick={() => setActiveTab('recommend')} />
              <PlaybookButton icon="📊" label="查看五维评分分析" onClick={() => setActiveTab('scoring')} />
            </>
          ) : hasMediumRisk ? (
            <>
              <PlaybookButton icon="💰" label="进行精确利润压力测试" primary onClick={() => setActiveTab('profit')} />
              <PlaybookButton icon="📖" label="查看风险应对方案" onClick={() => setActiveTab('ai')} />
              <PlaybookButton icon="📦" label="评估供应链稳定性" onClick={() => setActiveTab('supply')} />
            </>
          ) : (
            <>
              <PlaybookButton icon="💰" label="进行精确利润测算" primary onClick={() => setActiveTab('profit')} />
              <PlaybookButton icon="📦" label="匹配 1688 优质源头工厂" onClick={() => setActiveTab('supply')} />
              <PlaybookButton icon="🎯" label="加入选品漏斗持续追踪" onClick={() => setActiveTab('funnel')} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── PlaybookButton 子组件 ───────────────────────────────────
const PlaybookButton: React.FC<{
  icon: string; label: string; primary?: boolean; onClick: () => void;
}> = ({ icon, label, primary, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%', textAlign: 'left', padding: '9px 12px',
      borderRadius: 7, border: 'none', cursor: 'pointer',
      background: primary ? '#1d4ed8' : 'rgba(255,255,255,0.06)',
      color: 'white', fontSize: 12, fontWeight: primary ? 700 : 400,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => (e.currentTarget.style.background = primary ? '#2563eb' : 'rgba(255,255,255,0.12)')}
    onMouseLeave={e => (e.currentTarget.style.background = primary ? '#1d4ed8' : 'rgba(255,255,255,0.06)')}
  >
    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>{icon}</span>
      <span>{label}</span>
    </span>
    <span style={{ opacity: 0.6 }}>→</span>
  </button>
);
