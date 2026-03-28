// 通用类型定义

export interface Product {
  asin: string;
  title: string;
  price: number;
  rank: number;
  rating: number;
  reviews: number;
  imageUrl: string;
  category: string;
}

export interface ProductAnalysis {
  product: Product;
  priceTrend: 'up' | 'down' | 'stable';
  rankTrend: 'up' | 'down' | 'stable';
  priceHistory: Array<{ date: number; price: number }>;
  rankHistory: Array<{ date: number; rank: number }>;
  profitRate?: number;
  competitionLevel: 'low' | 'medium' | 'high';
  potentialScore: number;
  potentialLevel: 'high' | 'medium' | 'low';
  reasons: string[];
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'zh-CN' | 'en-US';
  autoAnalyze: boolean;
  showFloatingPanel: boolean;
  keepaApiKey?: string;
}

export interface SelectionItem {
  id: string;
  asin: string;
  title: string;
  price: number;
  rank: number;
  profitRate: number;
  status: 'pending' | 'analyzing' | 'approved' | 'rejected';
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface AIRecommendation {
  id: string;
  asin: string;
  title: string;
  reason: string;
  confidence: number;
  createdAt: number;
}

export interface MessagePayload {
  type: string;
  [key: string]: any;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
