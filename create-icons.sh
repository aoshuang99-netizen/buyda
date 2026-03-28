#!/bin/bash

# 创建简单的PNG图标（使用ImageMagick创建占位图标）
# 如果没有ImageMagick，这些只是占位符

# 创建16x16图标
echo "创建16x16图标..."
convert -size 16x16 xc:#3B82F6 -font Arial -pointsize 12 -gravity center -fill white label:🤖 dist/icons/icon16.png 2>/dev/null || echo "16x16图标创建失败（需要ImageMagick）"

# 创建48x48图标
echo "创建48x48图标..."
convert -size 48x48 xc:#3B82F6 -font Arial -pointsize 32 -gravity center -fill white label:🤖 dist/icons/icon48.png 2>/dev/null || echo "48x48图标创建失败（需要ImageMagick）"

# 创建128x128图标
echo "创建128x128图标..."
convert -size 128x128 xc:#3B82F6 -font Arial -pointsize 96 -gravity center -fill white label:🤖 dist/icons/icon128.png 2>/dev/null || echo "128x128图标创建失败（需要ImageMagick）"

echo "图标创建完成！"
echo ""
echo "如果没有ImageMagick，请手动创建以下图标："
echo "- dist/icons/icon16.png (16x16)"
echo "- dist/icons/icon48.png (48x48)"
echo "- dist/icons/icon128.png (128x128)"
echo ""
echo "可以使用在线工具如 https://www.favicon-generator.org/"
