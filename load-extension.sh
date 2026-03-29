#!/bin/bash

# AI 选品助手 Chrome 扩展加载脚本
# 用于 macOS Chrome

echo "🚀 正在加载 AI 选品助手插件..."
echo ""

# 扩展目录
EXTENSION_DIR="/Users/frankzhao/WorkBuddy/20260327160327/ai-selection-extension/dist"

# 检查目录是否存在
if [ ! -d "$EXTENSION_DIR" ]; then
    echo "❌ 错误：目录不存在"
    echo "路径: $EXTENSION_DIR"
    exit 1
fi

echo "✅ 扩展目录存在: $EXTENSION_DIR"
echo ""

# 方法一：使用 open 命令打开 extensions 页面
echo "📂 方法一：打开 Chrome 扩展页面"
echo "1. 页面将自动打开"
echo "2. 请确保启用 '开发者模式'"
echo "3. 点击 '加载已解压的扩展程序'"
echo "4. 选择以下路径："
echo "   $EXTENSION_DIR"
echo ""

# 打开扩展页面
open "chrome://extensions/"

echo ""
echo "⏳ 等待 5 秒后打开 Finder 选择目录..."
sleep 5

# 方法二：使用 osascript 打开文件夹选择对话框
echo "📂 方法二：使用文件夹选择对话框"
osascript <<EOF
tell application "Finder"
    activate
    open folder POSIX file "$EXTENSION_DIR"
end tell
EOF

echo ""
echo "✅ Finder 已打开扩展目录"
echo "💡 提示：将此文件夹拖拽到 Chrome 扩展页面即可"
echo ""

# 方法三：尝试直接加载（需要 Chrome 已运行）
echo "📂 方法三：尝试直接加载"
echo "如果已在 'chrome://extensions/' 中启用了开发者模式，"
echo "请手动将以下文件夹拖拽到浏览器窗口："
echo ""
echo "📁 $EXTENSION_DIR"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 手动加载步骤（如果以上方法失败）："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. 在 Chrome 地址栏输入: chrome://extensions/"
echo "2. 右上角打开 '开发者模式' 开关"
echo "3. 点击 '加载已解压的扩展程序' 按钮"
echo "4. 在文件选择器中导航到："
echo "   /Users/frankzhao/WorkBuddy/20260327160327/ai-selection-extension/dist"
echo "5. 选择 'dist' 文件夹并确认"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ 加载成功后，您将看到："
echo "   - 插件名称: AI 选品助手"
echo "   - 版本号: 1.0.0"
echo "   - 图标显示在浏览器右上角"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🧪 测试插件："
echo "1. 访问任意亚马逊产品页面"
echo "   https://www.amazon.com/dp/B08N5KWB9H"
echo "2. 等待 2-3 秒"
echo "3. 页面右侧会自动出现 'AI 选品分析' 浮动面板"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
