# AI选品助手 - Chrome Extension

> 🤖 AI驱动的跨境电商选品工具，帮助卖家快速发现高利润产品，智能匹配优质货源
>
> **MVP 版本已发布！** 立即体验核心功能：产品分析、利润测算、AI 评估、监控清单

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://chrome.google.com/webstore)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/your-repo/ai-selection-extension)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## ✨ 功能特性

### 当前版本 (v1.0.0) - MVP

- ✅ **亚马逊产品实时分析** - 自动提取标题、价格、BSR 排名、评分、评论数等 10+ 维度数据
- ✅ **AI 快速评估** - 智能评分算法，一键识别高潜力产品（高/中/低潜力分级）
- ✅ **浮动分析面板** - 页面右侧自动显示产品分析，无需频繁切换
- ✅ **利润计算器** - 支持工厂成本、运费、FBA 费用、广告费，自动计算毛利和利润率
- ✅ **选品监控清单** - 保存感兴趣的产品，统一管理追踪
- ✅ **AI 推荐展示** - 展示例推荐产品，包含 1688 货源链接
- ✅ **API Key 配置** - 支持 Keepa API Key 配置（为后续功能做准备）

### 核心亮点

🎯 **精准提取** - 多选择器策略，适配亚马逊不同页面结构
⚡ **即时显示** - 页面加载后 2-3 秒内显示分析结果
🧠 **智能评分** - 综合评分、评论、排名、价格、Prime、库存等 7 个维度
💎 **极简设计** - 直观的 UI，清晰的视觉反馈（绿色=好，黄色=一般，红色=差）

## 🚀 快速开始

### 安装方式

#### 方式1: 从Chrome商店安装（推荐）

1. 访问 [Chrome Web Store](https://chrome.google.com/webstore)
2. 搜索"AI选品助手"
3. 点击"添加到Chrome"

#### 方式2: 开发者安装

```bash
# 克隆仓库
git clone https://github.com/your-repo/ai-selection-extension.git

# 进入项目目录
cd ai-selection-extension

# 安装依赖
npm install

# 构建项目
npm run build

# 加载到Chrome
1. 打开 chrome://extensions/
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 dist 目录
```

## 📖 使用说明

### 1. 分析亚马逊产品

**方式一：使用浮动面板（推荐）**
1. 打开任意亚马逊产品页面
2. 页面右侧会自动显示 **AI 选品分析** 浮动面板
3. 查看产品信息和 AI 评估结果
4. 点击"保存到监控清单"或"计算利润"

**方式二：使用 Popup**
1. 打开任意亚马逊产品页面
2. 点击浏览器工具栏的插件图标
3. 切换到"分析"标签
4. 点击"开始分析"按钮
5. 查看详细分析结果

### 2. 计算利润

1. 在产品分析页面或浮动面板点击"计算利润"
2. 输入以下成本：
   - 工厂成本（CNY）
   - 运费成本（USD）
   - FBA 费用（USD）
   - 广告费（USD）
3. 点击"计算利润"按钮
4. 查看毛利和利润率（颜色编码：绿色 >20%，黄色 10-20%，红色 <10%）

### 3. 管理监控清单

1. 分析产品后，点击"保存到监控清单"
2. 切换到"监控"标签页查看所有保存的产品
3. 可以查看保存时间、产品信息
4. 点击"删除"移除不需要的产品

### 4. 配置 API Key

1. 点击插件图标
2. 切换到"设置"标签页
3. 在"Keepa API Key"输入框中输入您的 API Key
4. 点击"保存"按钮
5. 重新打开设置页验证是否保存成功

**获取免费 API Key：**
- 访问 [Keepa](https://keepa.com/)
- 注册账号
- 在 Settings > API 中申请 API Key
- 免费账号每月 60,000 次请求

## 🛠️ 开发

### 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **图表**: ECharts
- **API**: Keepa API

### 项目结构

```
ai-selection-extension/
├── public/
│   ├── manifest.json      # Chrome Extension配置
│   └── icons/             # 插件图标
├── src/
│   ├── popup/             # 弹窗页面
│   ├── content/           # 内容脚本
│   ├── background/        # 后台脚本
│   ├── components/        # 共用组件
│   ├── utils/             # 工具函数
│   └── types/             # TypeScript类型
├── package.json
├── vite.config.ts
└── README.md
```

### 开发命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 调试

**Popup调试：**
- 右键点击插件图标 → 检查弹出内容

**Content Script调试：**
- 打开目标网页（如亚马逊）
- 按 F12 打开开发者工具
- 在 Console 中调试

**Background Script调试：**
- 在 `chrome://extensions/` 中
- 找到插件 → 检查视图 → Service Worker

## 📊 功能规划

### 第一阶段 (v1.0.0 - 已发布) ✅
- ✅ 亚马逊产品实时分析
- ✅ AI 快速评估（7 维度评分算法）
- ✅ 浮动分析面板
- ✅ 利润计算器
- ✅ 监控清单管理
- ✅ Popup 完整 UI（5 个标签页）

### 第二阶段 (v1.1.0 - 开发中)
- 🔲 **ECharts 价格趋势图** - 可视化价格历史
- 🔲 **Keepa API 集成** - 获取详细历史数据
- 🔲 **竞品分析** - 对比同类产品
- 🔲 **评论情感分析** - 识别用户痛点

### 第三阶段 (v1.2.0 - 规划中)
- 🔲 **1688 货源匹配** - 自动匹配优质工厂
- 🔲 **1688 浮动面板** - 在 1688 页面显示成本分析
- 🔲 **供应商评分** - 基于销量、评价、响应速度
- 🔲 **询价助手** - 一键发送询价模板

### 第四阶段 (v2.0.0 - 规划中)
- 🔲 **OpenAI/Claude API 集成** - 真实 AI 推荐
- 🔲 **用户画像系统** - 学习用户偏好
- 🔲 **对话式查询** - 自然语言搜索产品
- 🔲 **侵权检测** - 识别潜在 IP 风险

### 第五阶段 (v3.0.0 - 规划中)
- 🔲 **Web 数据看板** - 统一管理所有产品
- 🔲 **市场监控** - 价格、排名变化提醒
- 🔲 **自训练模型** - 基于用户数据优化推荐
- 🔲 **API 开放** - 第三方集成

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Keepa](https://keepa.com/) - 亚马逊产品数据API
- [Chrome Extensions](https://developer.chrome.com/docs/extensions/) - Chrome扩展开发文档
- [React](https://reactjs.org/) - UI框架

## 📮 联系我们

- GitHub Issues: [提交问题](https://github.com/your-repo/ai-selection-extension/issues)
- Email: support@aiselection.com

---

**⭐ 如果这个项目对您有帮助，请给我们一个 Star！**
