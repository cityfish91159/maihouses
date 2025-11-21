# 使用官方 Node.js 22 镜像作为基础
FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

# 🚀 性能优化：安装常用工具
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    git \
    bash-completion \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# 📦 优化 npm 配置
RUN npm config set prefer-offline true \
    && npm config set fetch-retries 3 \
    && npm config set fetch-retry-mintimeout 10000

# 🔧 Git 全局优化
RUN git config --global core.preloadindex true \
    && git config --global core.fscache true \
    && git config --global gc.auto 256 \
    && git config --global feature.manyFiles true

# 设置工作目录
WORKDIR /workspace

# 设置环境变量优化 Node.js 性能
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV VITE_HOST="0.0.0.0"
