# AI选品助手 - Chrome Extension 项目重命名指南

## 重命名任务：AI选品助手 → Buyda个性化选品智能体

## 需要修改的文件清单

### 1. 核心配置文件
- [x] `public/manifest.json` - 修改 name 和 description
- [ ] `package.json` - 修改 name 和 description
- [ ] `index.html` - 修改页面标题

### 2. 源代码文件
- [ ] `src/popup/App.tsx` - 修改 UI 中的标题和品牌名称
- [ ] `src/content/amazon-enhanced.js` - 修改浮动面板标题
- [ ] `src/background/service-worker.ts` - 修改日志和消息中的名称

### 3. 文档文件
- [ ] `README.md` - 更新项目描述
- [ ] `TESTING-GUIDE.md` - 更新测试指南中的名称
- [ ] `SOLUTION.md` - 更新解决方案文档
- [ ] `FIX-LOG.md` - 更新修复日志

### 4. 图标和资源（可选）
- [ ] `icons/` - 更新图标设计以匹配新品牌

## 重命名策略

### 命名规范
- **英文名称**: Buyda Selection Assistant
- **中文名称**: Buyda个性化选品智能体
- **简称**: Buyda
- **口号**: 智能选品，精准匹配

### 颜色方案（可选升级）
- 主色: #6366F1 (Indigo 500)
- 辅色: #8B5CF6 (Violet 500)
- 强调色: #EC4899 (Pink 500)

### UI 调整
- 浮动面板标题: "Buyda 智能分析"
- Popup 标题: "Buyda 选品助手"
- Logo 文字: "Buyda"

## 执行步骤

### Step 1: 修改配置文件
```bash
# 修改 manifest.json
- name: "AI选品助手" → "Buyda个性化选品智能体"
- description: "AI驱动的跨境电商选品工具..." → "Buyda智能化选品工具，基于AI分析亚马逊产品数据，为跨境电商卖家提供精准的选品建议..."
```

### Step 2: 修改源代码
```bash
# 修改所有显示名称的地方
src/popup/App.tsx: "AI 选品分析" → "Buyda 智能分析"
src/content/amazon-enhanced.js: "AI选品助手" → "Buyda选品助手"
```

### Step 3: 更新文档
```bash
# 更新 README.md 和其他文档
```

### Step 4: 重新构建
```bash
npm run build
```

### Step 5: 测试验证
- 加载插件到 Chrome
- 验证所有 UI 中的名称已更新
- 测试所有功能正常工作

## 完成标志

- [ ] 所有文件中的旧名称已替换
- [ ] 重新构建成功
- [ ] Chrome 扩展显示新名称
- [ ] 浮动面板显示新名称
- [ ] Popup 显示新名称
- [ ] 文档已更新

## 时间估算

- 配置文件修改: 5 分钟
- 源代码修改: 10 分钟
- 文档更新: 10 分钟
- 构建测试: 5 分钟
- **总计**: 约 30 分钟

## 注意事项

1. **保留品牌一致性** - 确保所有使用名称的地方都更新
2. **测试所有入口点** - 包括浮动面板、Popup、错误提示等
3. **更新存储键名** - 如果使用 localStorage/chrome.storage 中的键名包含旧名称，需要考虑迁移策略
4. **版本号更新** - 在 manifest.json 中更新 version 到 1.1.0

## 执行状态

**状态**: 待执行

**开始时间**: 待定

**完成时间**: 待定
