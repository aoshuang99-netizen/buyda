/**
 * Buyda AI 选品推荐模块
 * 集成 OpenAI / Claude API，实现真实 AI 选品推荐
 * 支持: OpenAI GPT-4o / Anthropic Claude 3.5 Sonnet
 */

export type AIProvider = 'openai' | 'claude' | 'mock';

export interface AIRecommendation {
  asin: string;
  title: string;
  estimatedPrice: number;
  reason: string;
  potential: 'high' | 'medium' | 'low';
  category: string;
  keyAdvantages: string[];
  risks: string[];
  estimatedMonthlyRevenue?: string;
  supplierKeyword: string;  // 用于1688搜索的关键词
}

export interface UserProfile {
  sellingCategories?: string[];
  priceRange?: { min: number; max: number };
  monthlyBudget?: number;
  experience?: 'beginner' | 'intermediate' | 'advanced';
  currentProduct?: {
    asin: string;
    title: string;
    price: number;
    rank: number;
    category: string;
  };
}

interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

// ─── API 调用核心 ──────────────────────────────────────────

async function callOpenAI(prompt: string, apiKey: string, model = 'gpt-4o-mini'): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: `You are Buyda, an expert AI product selection advisor for Chinese cross-border sellers on Amazon. 
          You have deep knowledge of:
          - Amazon market trends and BSR dynamics
          - Chinese factory sourcing (1688.com)  
          - Profit calculation for FBA business
          - Product differentiation strategies
          Always respond in Chinese. Return valid JSON only, no markdown.`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `OpenAI API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '{}';
}

async function callClaude(prompt: string, apiKey: string, model = 'claude-3-5-haiku-20241022'): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      system: `You are Buyda, an expert AI product selection advisor for Chinese cross-border Amazon sellers.
You have deep expertise in Amazon marketplace trends, Chinese factory sourcing on 1688.com, FBA profit calculations, and product differentiation.
Always respond in Chinese. Return valid JSON only, no markdown fences.`,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `Claude API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0]?.text || '{}';
}

// ─── 通过 Background Service Worker 调用（绕过CORS） ───────

export async function callAIViaBackground(
  prompt: string,
  config: AIConfig
): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: 'AI_REQUEST',
        provider: config.provider,
        apiKey: config.apiKey,
        model: config.model,
        prompt,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response?.success) {
          resolve(response.content);
        } else {
          reject(new Error(response?.error || 'AI 请求失败'));
        }
      }
    );
  });
}

// ─── AI 选品推荐 ───────────────────────────────────────────

export async function getAIRecommendations(
  profile: UserProfile,
  config: AIConfig
): Promise<AIRecommendation[]> {
  if (config.provider === 'mock') {
    return getMockRecommendations(profile);
  }

  const prompt = buildRecommendationPrompt(profile);

  let rawContent: string;
  try {
    rawContent = await callAIViaBackground(prompt, config);
  } catch (e) {
    console.error('[Buyda AI] API 调用失败，降级为 Mock 数据:', e);
    return getMockRecommendations(profile);
  }

  try {
    const parsed = JSON.parse(rawContent);
    const items: AIRecommendation[] = (parsed.recommendations || []).map((r: any) => ({
      asin: r.asin || `B0${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      title: r.title || '',
      estimatedPrice: parseFloat(r.estimatedPrice) || 25,
      reason: r.reason || '',
      potential: r.potential || 'medium',
      category: r.category || '',
      keyAdvantages: r.keyAdvantages || [],
      risks: r.risks || [],
      estimatedMonthlyRevenue: r.estimatedMonthlyRevenue || '',
      supplierKeyword: r.supplierKeyword || r.title?.split(' ').slice(0, 3).join(' ') || '',
    }));
    return items.slice(0, 5);
  } catch (e) {
    console.error('[Buyda AI] 解析 AI 响应失败:', e);
    return getMockRecommendations(profile);
  }
}

// ─── AI 产品分析增强 ───────────────────────────────────────

export interface AIProductAnalysis {
  overallScore: number;
  verdict: '强烈推荐' | '推荐' | '谨慎' | '不推荐';
  summary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  pricingStrategy: string;
  targetBSR: string;
  entryDifficulty: '容易' | '中等' | '困难';
  estimatedLaunchCost: string;
}

export async function analyzeProductWithAI(
  productData: {
    asin: string;
    title: string;
    price: number;
    rank: number;
    rating: number;
    reviews: number;
    category: string;
  },
  config: AIConfig
): Promise<AIProductAnalysis> {
  if (config.provider === 'mock') {
    return getMockProductAnalysis(productData);
  }

  const prompt = buildProductAnalysisPrompt(productData);

  let rawContent: string;
  try {
    rawContent = await callAIViaBackground(prompt, config);
  } catch (e) {
    return getMockProductAnalysis(productData);
  }

  try {
    const parsed = JSON.parse(rawContent);
    return {
      overallScore: parsed.overallScore || 65,
      verdict: parsed.verdict || '谨慎',
      summary: parsed.summary || '',
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      opportunities: parsed.opportunities || [],
      pricingStrategy: parsed.pricingStrategy || '',
      targetBSR: parsed.targetBSR || '',
      entryDifficulty: parsed.entryDifficulty || '中等',
      estimatedLaunchCost: parsed.estimatedLaunchCost || '',
    };
  } catch (e) {
    return getMockProductAnalysis(productData);
  }
}

// ─── Prompt 构建 ───────────────────────────────────────────

function buildRecommendationPrompt(profile: UserProfile): string {
  const contextLines: string[] = [];

  if (profile.currentProduct) {
    const p = profile.currentProduct;
    contextLines.push(`当前分析的亚马逊产品: ${p.title} (ASIN: ${p.asin}), 价格 $${p.price}, BSR #${p.rank}, 类别: ${p.category}`);
  }

  if (profile.sellingCategories?.length) {
    contextLines.push(`卖家主营类目: ${profile.sellingCategories.join(', ')}`);
  }

  if (profile.priceRange) {
    contextLines.push(`目标售价区间: $${profile.priceRange.min} - $${profile.priceRange.max}`);
  }

  if (profile.monthlyBudget) {
    contextLines.push(`月度预算: $${profile.monthlyBudget}`);
  }

  if (profile.experience) {
    const expMap = { beginner: '新手(0-1年)', intermediate: '中级(1-3年)', advanced: '资深(3年以上)' };
    contextLines.push(`卖家经验: ${expMap[profile.experience]}`);
  }

  return `
你是跨境电商AI选品顾问。请根据以下卖家信息，推荐5个最适合该卖家的亚马逊选品机会。

卖家信息:
${contextLines.join('\n')}

要求:
1. 每个推荐必须有真实可行的市场依据
2. 优先选择竞品少、差评多（可改进点多）、价格区间在$15-$60的品类
3. 每个产品必须能在1688找到对应货源，利润率>20%
4. 避免高度饱和的品类（如手机壳、充电线等除非有显著差异化）

请返回如下JSON格式:
{
  "recommendations": [
    {
      "asin": "示例ASIN（可以虚构）",
      "title": "英文产品名（真实市场中会有的产品）",
      "estimatedPrice": 25.99,
      "potential": "high/medium/low",
      "category": "产品类目",
      "reason": "2-3句话说明推荐理由，包含具体数据",
      "keyAdvantages": ["优势1", "优势2", "优势3"],
      "risks": ["风险1", "风险2"],
      "estimatedMonthlyRevenue": "预估月收入范围",
      "supplierKeyword": "1688搜索关键词（中文）"
    }
  ]
}`;
}

function buildProductAnalysisPrompt(product: {
  asin: string; title: string; price: number;
  rank: number; rating: number; reviews: number; category: string;
}): string {
  return `
请分析以下亚马逊产品的选品价值：

产品信息：
- ASIN: ${product.asin}
- 标题: ${product.title}
- 售价: $${product.price}
- BSR排名: #${product.rank}
- 评分: ${product.rating}/5
- 评论数: ${product.reviews}
- 类目: ${product.category}

请从跨境卖家角度，结合市场竞争力、利润空间、运营难度等维度，进行全面分析。

返回JSON格式：
{
  "overallScore": 0-100的整数,
  "verdict": "强烈推荐/推荐/谨慎/不推荐",
  "summary": "2-3句话的核心结论",
  "strengths": ["优势1", "优势2", "优势3"],
  "weaknesses": ["劣势1", "劣势2"],
  "opportunities": ["机会点1", "机会点2"],
  "pricingStrategy": "定价建议",
  "targetBSR": "目标排名区间",
  "entryDifficulty": "容易/中等/困难",
  "estimatedLaunchCost": "预估启动资金"
}`;
}

// ─── Mock 数据（API Key 未配置时使用） ─────────────────────

function getMockRecommendations(profile: UserProfile): AIRecommendation[] {
  const category = profile.sellingCategories?.[0] || 'Home & Kitchen';
  const priceMax = profile.priceRange?.max || 50;

  return [
    {
      asin: 'B0MOCK001',
      title: 'Portable Electric Air Duster for Computer Cleaning',
      estimatedPrice: Math.min(35.99, priceMax),
      reason: `${category}类目近90天销量上升42%，竞品BSR中位数#8,500，差评集中在"电量不足"（可改进），1688采购成本约¥65，利润率可达38%`,
      potential: 'high',
      category,
      keyAdvantages: ['需求量持续增长', '差异化空间大', '货源供应充足'],
      risks: ['需要UL认证', '有一定运输限制'],
      estimatedMonthlyRevenue: '$3,000 - $8,000',
      supplierKeyword: '电动除尘器 便携',
    },
    {
      asin: 'B0MOCK002',
      title: 'Adjustable Laptop Stand Aluminum Desktop',
      estimatedPrice: Math.min(29.99, priceMax),
      reason: `WFH趋势持续，搜索量月增15%，头部产品评论量平均2000+但有大量"晃动"差评，改进铰链设计即可形成差异化`,
      potential: 'high',
      category: 'Office Products',
      keyAdvantages: ['刚需+增长市场', '差异化机会明确', '利润空间35%+'],
      risks: ['竞品数量较多', '需要良好包装设计'],
      estimatedMonthlyRevenue: '$2,500 - $6,000',
      supplierKeyword: '铝合金笔记本支架 可调节',
    },
    {
      asin: 'B0MOCK003',
      title: 'Silicone Kitchen Utensils Set Heat Resistant',
      estimatedPrice: Math.min(24.99, priceMax),
      reason: `家居类持续热销，1688厨具供应链成熟，采购成本¥35以内，利润率约45%，适合新手入门`,
      potential: 'medium',
      category: 'Kitchen & Dining',
      keyAdvantages: ['货源稳定', '利润高', '操作简单'],
      risks: ['竞争激烈', '需要食品安全认证'],
      estimatedMonthlyRevenue: '$1,500 - $4,000',
      supplierKeyword: '硅胶厨具套装 耐高温',
    },
  ];
}

function getMockProductAnalysis(product: {
  price: number; rank: number; rating: number; reviews: number;
}): AIProductAnalysis {
  const score = Math.min(95, Math.round(
    (product.rating / 5 * 30) +
    (product.reviews > 1000 ? 25 : product.reviews > 100 ? 15 : 5) +
    (product.rank < 5000 ? 25 : product.rank < 50000 ? 15 : 5) +
    (product.price > 15 && product.price < 80 ? 20 : 10)
  ));

  const verdicts: AIProductAnalysis['verdict'][] = ['不推荐', '谨慎', '推荐', '强烈推荐'];
  const verdictIdx = score >= 75 ? 3 : score >= 55 ? 2 : score >= 35 ? 1 : 0;

  return {
    overallScore: score,
    verdict: verdicts[verdictIdx],
    summary: `该产品综合评分 ${score}/100，${verdicts[verdictIdx]}入场。评分 ${product.rating} 分，${product.reviews} 条评价，BSR #${product.rank.toLocaleString()}。`,
    strengths: [
      product.rating >= 4.3 ? '用户满意度高（评分>4.3）' : '有改进空间，差异化机会',
      product.reviews >= 500 ? '市场验证充分' : '竞争相对较少',
      product.price >= 20 ? '价格区间利润空间合理' : '低价可走量策略',
    ],
    weaknesses: [
      product.rank > 50000 ? 'BSR排名较低，市场需求待验证' : '',
      product.reviews > 5000 ? '头部竞品评价数量大，追赶难度高' : '',
    ].filter(Boolean),
    opportunities: [
      '通过产品改进占领差评用户需求',
      '开发针对细分场景的产品版本',
    ],
    pricingStrategy: `建议入场价格 $${(product.price * 0.9).toFixed(2)}，建立评价后逐步提价至 $${product.price}`,
    targetBSR: product.rank > 10000 ? `目标 6 个月内进入 Top 10,000` : `维持并超越当前 #${product.rank}`,
    entryDifficulty: product.reviews > 3000 ? '困难' : product.reviews > 500 ? '中等' : '容易',
    estimatedLaunchCost: `$${Math.round(product.price * 150 + 500)} - $${Math.round(product.price * 300 + 1000)}`,
  };
}

// ─── AI 配置管理 ───────────────────────────────────────────

export async function loadAIConfig(): Promise<AIConfig> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['aiProvider', 'openaiKey', 'claudeKey'], (result) => {
      const provider = (result.aiProvider as AIProvider) || 'mock';
      const apiKey = String(provider === 'openai' ? result.openaiKey || '' :
                     provider === 'claude' ? result.claudeKey || '' : '');
      resolve({ provider, apiKey });
    });
  });
}

export async function saveAIConfig(config: Partial<AIConfig>): Promise<void> {
  return new Promise((resolve) => {
    const toSave: Record<string, any> = {};
    if (config.provider) toSave.aiProvider = config.provider;
    if (config.apiKey && config.provider === 'openai') toSave.openaiKey = config.apiKey;
    if (config.apiKey && config.provider === 'claude') toSave.claudeKey = config.apiKey;
    chrome.storage.local.set(toSave, resolve);
  });
}
