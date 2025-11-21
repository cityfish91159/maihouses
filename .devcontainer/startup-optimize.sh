#!/bin/bash
# Codespace 启动优化脚本

set -e

echo "🚀 开始 Codespace 启动优化..."

# 1. 预热 npm 缓存
echo "📦 预热 npm 缓存..."
npm config set prefer-offline true
npm config set fetch-retries 3
npm config set fetch-retry-mintimeout 10000

# 2. Git 优化
echo "🔧 优化 Git 配置..."
git config --global core.preloadindex true
git config --global core.fscache true
git config --global gc.auto 256
git config --global feature.manyFiles true

# 3. 清理不必要的缓存
echo "🧹 清理旧缓存..."
rm -rf node_modules/.vite
rm -rf .cache
rm -rf .tsbuildinfo

# 4. 启动后台自动加速服务（如果存在）
if [ -f "scripts/speedup-control.sh" ]; then
    echo "⚡ 启动自动加速服务..."
    bash scripts/speedup-control.sh start || true
fi

echo "✅ Codespace 优化完成！"
echo ""
echo "💡 可用命令:"
echo "   npm run dev           - 启动开发服务器"
echo "   npm run speedup:status - 查看加速服务状态"
echo "   npm run build         - 构建项目"
