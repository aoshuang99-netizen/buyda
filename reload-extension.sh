#!/bin/bash

echo "========================================="
echo "Buyda 个性化选品智能体 - 重新加载插件"
echo "========================================="
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "错误：请在项目根目录运行此脚本"
    exit 1
fi

# 重新构建
echo "1. 重新构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "错误：构建失败"
    exit 1
fi

echo ""
echo "✅ 构建成功！"
echo ""

# 检查 dist 目录
echo "2. 检查构建文件..."
ls -lh dist/

echo ""
echo "========================================="
echo "✅ 插件已准备好！"
echo "========================================="
echo ""
echo "下一步操作："
echo "1. 打开 Chrome 浏览器"
echo "2. 访问：chrome://extensions/"
echo "3. 找到 'Buyda个性化选品智能体'"
echo "4. 点击刷新按钮 🔄"
echo "5. 访问 Amazon 产品页面测试功能"
echo ""
