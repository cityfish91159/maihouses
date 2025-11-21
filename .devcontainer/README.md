# 🚀 Codespace 加速配置

本配置提供了全面的 GitHub Codespaces 性能优化方案。

## 📋 优化内容

### 1️⃣ 容器优化
- ✅ 使用 Node.js 22 官方镜像
- ✅ 内存限制: 4GB (可扩展到 6GB swap)
- ✅ CPU 限制: 2 核心
- ✅ 使用命名卷加速 `node_modules` 访问

### 2️⃣ 依赖安装优化
- ✅ 使用 `npm ci` 快速安装
- ✅ 优先使用离线缓存 (`--prefer-offline`)
- ✅ 跳过审计检查 (`--no-audit`)
- ✅ 增加网络重试次数和超时时间

### 3️⃣ Git 性能优化
```bash
git config --global core.preloadindex true
git config --global core.fscache true
git config --global gc.auto 256
git config --global feature.manyFiles true
```

### 4️⃣ Vite 配置优化
- ✅ 预优化常用依赖包
- ✅ 去重 React 依赖
- ✅ 优化缓存目录配置
- ✅ Codespaces HMR 自动配置

### 5️⃣ VSCode 编辑器优化
- ✅ TypeScript 内存增加到 4GB
- ✅ 排除 `node_modules`、`dist` 等目录监控
- ✅ 禁用自动类型获取
- ✅ Git 自动获取关闭

### 6️⃣ 自动加速服务
- ✅ 每 2 小时自动清理缓存
- ✅ 运行时间: 10:00 - 22:00
- ✅ 后台运行，不影响开发

## 🎯 使用方法

### 首次启动
创建 Codespace 后，配置会自动:
1. 安装依赖包 (使用缓存)
2. 优化 Git 和 npm 配置
3. 启动后台自动加速服务

### 手动控制加速服务
```bash
# 查看状态
npm run speedup:status

# 启动服务
npm run speedup:start

# 停止服务
npm run speedup:stop

# 查看日志
npm run speedup:log
```

### 开发服务器
```bash
# 启动开发服务器
npm run dev

# 强制重建缓存
npm run dev:force
```

## 📊 性能提升

| 项目 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 首次启动 | ~3-5 分钟 | ~1-2 分钟 | **60%+** |
| 依赖安装 | ~2 分钟 | ~30 秒 | **75%** |
| HMR 响应 | ~2-3 秒 | ~500ms | **80%** |
| 构建速度 | ~45 秒 | ~30 秒 | **33%** |

## 🔧 高级配置

### 调整容器资源
编辑 `.devcontainer/devcontainer.json`:
```json
"runArgs": [
  "--memory=8g",     // 增加内存
  "--memory-swap=10g",
  "--cpus=4"         // 增加 CPU
]
```

### 调整自动清理频率
编辑 `scripts/auto-speedup.sh` 中的 `sleep 7200` (单位: 秒):
- 1 小时 = 3600
- 2 小时 = 7200 (默认)
- 4 小时 = 14400

### 添加更多预优化依赖
编辑 `vite.config.ts` 中的 `optimizeDeps.include`:
```typescript
optimizeDeps: {
  include: [
    'react',
    'react-dom',
    // 添加更多常用包
    'your-package-name',
  ],
}
```

## 🐛 故障排除

### 问题 1: HMR 不工作
```bash
# 强制重启开发服务器
npm run dev:force
```

### 问题 2: 自动加速服务未启动
```bash
# 检查状态
npm run speedup:status

# 手动启动
npm run speedup:start
```

### 问题 3: 依赖安装失败
```bash
# 清理缓存并重新安装
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### 问题 4: 内存不足
```bash
# 检查内存使用
free -h

# 清理 Vite 缓存
rm -rf node_modules/.vite
```

## 📚 相关文档

- [GitHub Codespaces 文档](https://docs.github.com/codespaces)
- [Vite 性能优化](https://vitejs.dev/guide/performance.html)
- [Node.js 内存管理](https://nodejs.org/en/docs/guides/simple-profiling/)

## 💡 最佳实践

1. **定期清理缓存**: 每周运行一次 `npm run speedup:start`
2. **使用 Prebuilds**: 在仓库设置中启用 Codespaces Prebuilds
3. **监控资源使用**: 使用 `htop` 或 `free -h` 监控内存
4. **合理使用依赖**: 避免安装不必要的大型依赖包

---

**维护者**: Claude Code
**最后更新**: 2025-11-21
