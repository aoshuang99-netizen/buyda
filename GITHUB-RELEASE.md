# GitHub 发布指南 - Buyda v1.1.0

## 🚀 快速发布步骤

### 1. 创建 GitHub 仓库
```bash
# 登录 GitHub，创建新仓库
# 推荐仓库名: buyda-selection-extension

# 然后在本地执行：
cd ai-selection-extension
git remote add origin https://github.com/YOUR_USERNAME/buyda-selection-extension.git
git branch -M main
git push -u origin main
```

### 2. 创建 Release
在 GitHub 仓库页面:
1. 点击 "Releases" → "Create a new release"
2. Tag: `v1.1.0`
3. Title: `Buyda v1.1.0 - AI选品智能体`
4. 描述（见下方）

### 3. 上传 Chrome Extension 压缩包
```bash
# 打包 dist 目录
cd ai-selection-extension
zip -r buyda-v1.1.0.zip dist/
```
将 `buyda-v1.1.0.zip` 上传到 Release Assets

---

## 📋 Release 描述模板

```markdown
## 🎉 Buyda v1.1.0 发布！

### 新功能

🔥 **ECharts 价格趋势图**
- 可视化 90 天价格历史
- 自动标注最高价/最低价/均价
- 精准计算价格涨跌幅

💎 **Keepa API 深度集成**  
- 获取亚马逊真实历史价格数据
- 支持配置免费 Keepa API Key（60,000次/月）
- 无 Key 时使用模拟数据，功能完整可用

🏭 **1688 货源匹配浮动面板**
- 在 1688 产品页自动显示货源分析
- 关联亚马逊产品，一键计算利润
- 显示供应商评分、月销量、起订量
- 支持保存到货源清单

🤖 **真实 AI 推荐（支持 GPT-4o / Claude 3.5）**
- 配置 API Key 后获取个性化推荐
- 无 API Key 时使用内置示例推荐
- 包含关键优势、风险提示、预估收入
- 直接跳转 1688 货源搜索

### 安装方式

1. 下载 `buyda-v1.1.0.zip` 并解压
2. 打开 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"，选择解压目录

### 配置（可选）

- **Keepa API Key**: 在设置页配置，获取真实价格历史
- **AI Provider**: 选择 GPT-4o / Claude 3.5 / 示例模式
- 所有配置可选，不配置也能使用基础功能

### 完整功能列表

✅ 亚马逊产品实时分析（10+ 维度）  
✅ 90天价格趋势图（ECharts）  
✅ Keepa API 真实价格历史  
✅ AI 深度分析（综合评分 + 入场建议）  
✅ 利润测算器  
✅ 1688 货源匹配面板  
✅ AI 个性化推荐（GPT-4o / Claude）  
✅ 产品监控清单（含搜索过滤）  
✅ 自动显示浮动面板（无需手动点击）  
```

---

## 📁 当前仓库状态

```
ai-selection-extension/
├── dist/                   ← 安装此目录
│   ├── popup.html
│   ├── popup.js           (226KB - 主界面)
│   ├── PriceChart.js      (565KB - ECharts图表)
│   ├── service-worker.js  (4KB - 后台服务)
│   ├── amazon-content.js  (13KB - Amazon分析)
│   ├── 1688-content.js    (9KB - 货源匹配)
│   ├── manifest.json      (v1.1.0)
│   └── icons/
├── src/
│   ├── popup/App.tsx      ← 主界面（React）
│   ├── components/PriceChart.tsx  ← ECharts组件
│   ├── content/
│   │   ├── amazon-vanilla.js    ← Amazon分析脚本
│   │   └── 1688-matching.js     ← 1688货源脚本
│   ├── utils/
│   │   ├── keepaApi.ts    ← Keepa集成
│   │   └── aiApi.ts       ← AI集成
│   └── background/service-worker.ts
└── package.json (v1.1.0)
```

## Git 提交历史
- `74f525d` - MVP v1.0.0 初始发布
- `1d19e91` - 修复 Content Script 通信问题
- `b643eb2` - v1.1.0 完整功能发布 ← 当前
