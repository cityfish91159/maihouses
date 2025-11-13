#!/bin/bash
# 自動加速腳本 - 每2小時執行一次清理
# 運行時間: 10:00 - 22:00

# 動態獲取工作目錄（支持 /workspaces 和 /home/user 兩種環境）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$WORK_DIR/.speedup.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

speedup() {
    log "🚀 開始自動加速清理..."
    
    cd "$WORK_DIR" || exit 1
    
    # 清理 Vite 快取
    rm -rf node_modules/.vite .cache 2>/dev/null || true
    log "✅ 清理 Vite 快取完成"
    
    # 清理 Git GC (每次執行)
    git gc --auto --quiet 2>/dev/null || true
    log "✅ Git GC 完成"
    
    # 清理 npm 快取 (較溫和的方式)
    npm cache verify 2>/dev/null || true
    log "✅ NPM 快取驗證完成"
    
    # 清理 TypeScript 暫存
    rm -rf .tsbuildinfo 2>/dev/null || true
    
    log "✨ 加速清理完成"
}

# 主循環
log "======================================"
log "自動加速腳本已啟動 (10:00-22:00)"
log "======================================"

while true; do
    CURRENT_HOUR=$(date +%H)
    
    # 只在 10:00-22:00 之間執行
    if [ "$CURRENT_HOUR" -ge 10 ] && [ "$CURRENT_HOUR" -lt 22 ]; then
        speedup
        log "⏰ 下次清理: 2 小時後"
        sleep 7200  # 2 小時 = 7200 秒
    else
        log "💤 非工作時間,休眠中..."
        sleep 3600  # 1 小時檢查一次
    fi
done
