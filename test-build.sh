#!/bin/bash
# AI选品助手 - 自动化测试脚本
# 用于验证插件的所有功能是否正常工作

echo "================================"
echo "AI选品助手 - 自动化测试脚本"
echo "================================"
echo ""

# 检查 dist 目录
echo "1. 检查 dist 目录..."
if [ -d "dist" ]; then
    echo "✅ dist 目录存在"
else
    echo "❌ dist 目录不存在"
    exit 1
fi

# 检查必需文件
echo ""
echo "2. 检查必需文件..."
REQUIRED_FILES=(
    "manifest.json"
    "amazon-content.js"
    "1688-content.js"
    "popup.html"
    "popup.js"
    "service-worker.js"
    "icons/icon16.png"
    "icons/icon48.png"
    "icons/icon128.png"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "dist/$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 不存在"
        exit 1
    fi
done

# 检查文件大小
echo ""
echo "3. 检查关键文件大小..."
if [ -f "dist/popup.js" ]; then
    SIZE=$(stat -f%z "dist/popup.js" 2>/dev/null || stat -c%s "dist/popup.js" 2>/dev/null)
    echo "popup.js: $SIZE bytes"
    if [ "$SIZE" -gt 10000 ]; then
        echo "✅ popup.js 大小正常"
    else
        echo "⚠️ popup.js 大小异常"
    fi
fi

if [ -f "dist/amazon-content.js" ]; then
    SIZE=$(stat -f%z "dist/amazon-content.js" 2>/dev/null || stat -c%s "dist/amazon-content.js" 2>/dev/null)
    echo "amazon-content.js: $SIZE bytes"
    if [ "$SIZE" -gt 5000 ]; then
        echo "✅ amazon-content.js 大小正常"
    else
        echo "⚠️ amazon-content.js 大小可能异常"
    fi
fi

# 检查 manifest.json 格式
echo ""
echo "4. 检查 manifest.json..."
if command -v python3 &> /dev/null; then
    if python3 -m json.tool "dist/manifest.json" > /dev/null 2>&1; then
        echo "✅ manifest.json 格式正确"
    else
        echo "❌ manifest.json 格式错误"
        exit 1
    fi
else
    echo "⚠️ 无法验证 JSON 格式（未安装 Python3）"
fi

# 检查 content script 是否包含关键函数
echo ""
echo "5. 检查 content script 功能..."
if grep -q "extractProductData" "dist/amazon-content.js"; then
    echo "✅ extractProductData 函数存在"
else
    echo "❌ extractProductData 函数不存在"
    exit 1
fi

if grep -q "evaluateProduct" "dist/amazon-content.js"; then
    echo "✅ evaluateProduct 函数存在"
else
    echo "❌ evaluateProduct 函数不存在"
    exit 1
fi

if grep -q "chrome.runtime.onMessage" "dist/amazon-content.js"; then
    echo "✅ 消息监听器存在"
else
    echo "❌ 消息监听器不存在"
    exit 1
fi

# 检查选择器
echo ""
echo "6. 检查价格选择器..."
if grep -q "priceSelectors" "dist/amazon-content.js"; then
    echo "✅ 价格选择器存在"
    # 统计选择器数量
    COUNT=$(grep -o '"#.*"' "dist/amazon-content.js" | grep -i price | wc -l)
    echo "   找到 $COUNT 个价格选择器"
else
    echo "⚠️ 价格选择器可能不存在"
fi

echo ""
echo "7. 检查 BSR 选择器..."
if grep -q "rankSelectors" "dist/amazon-content.js"; then
    echo "✅ BSR 选择器存在"
    # 统计选择器数量
    COUNT=$(grep -o '"#.*"' "dist/amazon-content.js" | grep -i rank | wc -l)
    echo "   找到 $COUNT 个 BSR 选择器"
else
    echo "⚠️ BSR 选择器可能不存在"
fi

# 检查调试模式
echo ""
echo "8. 检查调试功能..."
if grep -q "DEBUG = true" "dist/amazon-content.js"; then
    echo "✅ 调试模式已启用"
else
    echo "⚠️ 调试模式未启用"
fi

if grep -q "console.log" "dist/amazon-content.js"; then
    echo "✅ 调试日志存在"
else
    echo "⚠️ 调试日志可能不存在"
fi

# 总结
echo ""
echo "================================"
echo "测试总结"
echo "================================"
echo ""
echo "所有检查完成！"
echo ""
echo "下一步操作："
echo "1. 打开 Chrome 浏览器"
echo "2. 访问 chrome://extensions/"
echo "3. 点击“加载未打包的扩展程序”"
echo "4. 选择 dist 目录"
echo "5. 访问 Amazon 产品页面测试功能"
echo ""
echo "调试提示："
echo "- 打开浏览器控制台 (F12)"
echo "- 查看 Console 标签中的 [AI选品助手] 日志"
echo "- 测试多个不同类型的 Amazon 产品"
echo ""
