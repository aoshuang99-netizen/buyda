# 🔧 解决方案：Content Script 未注入问题

## 问题原因

你遇到的错误 **"无法与页面通信，请刷新页面后重试"** 是因为：

**Content Script（内容脚本）只在页面加载时注入**，不会自动注入到已经打开的标签页。

如果你的操作顺序是：
1. ✅ 打开 Amazon 产品页面
2. ✅ 加载插件到 Chrome
3. ❌ 点击"分析当前产品"

那么第 3 步会失败，因为 content script 没有注入到这个已经打开的页面。

---

## ✅ 解决方案（3 种方法）

### 方法一：刷新页面（最简单）⭐

1. **保持 Amazon 产品页面打开**
2. **按 Cmd+R (Mac) 或 F5 (Windows) 刷新页面**
3. **等待页面完全加载**
4. **点击插件图标 → 点击"分析当前产品"**

这样 content script 会在页面刷新时重新注入。

---

### 方法二：重新打开页面

1. **关闭当前的 Amazon 产品页面**
2. **打开一个新的 Amazon 产品页面**
   - 例如：https://www.amazon.com/dp/B08N5KWB9H
3. **等待页面完全加载（2-3秒）**
4. **点击插件图标 → 点击"分析当前产品"**

---

### 方法三：使用编程注入（高级）

如果需要支持已打开的页面，可以修改代码使用 chrome.scripting API：

```javascript
// 在 popup/App.tsx 中修改 handleAnalyze 函数
const handleAnalyze = async () => {
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
};
```

**注意**：使用方法三需要在 manifest.json 中添加 `scripting` 权限（已经有了），并且需要处理重复注入的问题。

---

## 🧪 验证 Content Script 是否注入

打开浏览器控制台（F12）：

1. **在 Amazon 页面按 F12**
2. **点击 Console 标签**
3. **输入以下代码**：

```javascript
// 检查是否有 AI 选品助手的元素
document.getElementById('ai-selection-extension-container')
```

4. **按回车**
   - ✅ 如果返回 `<div>` 元素 → content script 已注入
   - ❌ 如果返回 `null` → content script 未注入

5. **检查是否有消息监听器**

```javascript
// 检查 Console 是否有插件日志
// 如果 content script 已注入，你应该能看到类似的日志：
// "AI选品助手 - Amazon内容脚本加载中..."
```

---

## 📝 推荐操作流程

### 正确的使用顺序：

1. **加载插件到 Chrome**
   - 访问 `chrome://extensions/`
   - 点击"加载未打包的扩展程序"
   - 选择 dist 文件夹

2. **打开 Amazon 产品页面**
   - 访问 https://www.amazon.com/dp/B08N5KWB9H
   - 等待页面完全加载

3. **测试插件**
   - 点击浏览器右上角的插件图标
   - 点击"🔍 分析当前产品"
   - 查看是否显示产品数据

4. **检查浮动面板**
   - 查看页面右侧是否出现"AI 选品分析"面板

---

## 🔍 如果仍然失败

### 步骤 1：检查插件权限

1. 访问 `chrome://extensions/`
2. 找到"AI选品助手"
3. 点击"详细信息"
4. 检查以下权限是否启用：
   - ✅ 在所有网站上读取和更改数据（amazon.com, amazon.cn）
   - ✅ 访问标签页
   - ✅ 存储

### 步骤 2：重新加载插件

1. `chrome://extensions/` 页面
2. 找到"AI选品助手"
3. 点击刷新按钮 🔄

### 步骤 3：清除缓存并刷新

1. 在 Amazon 页面按 Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows)
2. 这会强制刷新页面并清除缓存

### 步骤 4：查看详细错误

1. 在 Amazon 页面按 F12
2. 点击 Console 标签
3. 点击插件中的"分析当前产品"
4. 查看是否有红色错误
5. 将错误信息告诉我

---

## ✨ 快速验证步骤

1. **关闭所有 Amazon 标签页**
2. **打开一个新的 Amazon 产品页面**
   - https://www.amazon.com/dp/B08N5KWB9H
3. **等待 3 秒**
4. **打开插件 Popup**
5. **点击"分析当前产品"**

这次应该能正常工作了！🚀
