#!/bin/bash
# 自動加速控制腳本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/../.auto-speedup.pid"
LOG_FILE="$SCRIPT_DIR/../.speedup.log"

case "$1" in
    start)
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if ps -p "$PID" > /dev/null 2>&1; then
                echo "❌ 自動加速已經在運行中 (PID: $PID)"
                exit 1
            fi
        fi
        
        echo "🚀 啟動自動加速服務..."
        nohup "$SCRIPT_DIR/auto-speedup.sh" > /dev/null 2>&1 &
        echo $! > "$PID_FILE"
        echo "✅ 自動加速已啟動 (PID: $(cat $PID_FILE))"
        echo "📝 日誌位置: $LOG_FILE"
        echo "⏰ 每 2 小時自動清理一次 (10:00-22:00)"
        ;;
        
    stop)
        if [ ! -f "$PID_FILE" ]; then
            echo "⚠️  自動加速未運行"
            exit 1
        fi
        
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            kill "$PID"
            rm -f "$PID_FILE"
            echo "✅ 自動加速已停止"
        else
            echo "⚠️  進程不存在,清理 PID 檔案"
            rm -f "$PID_FILE"
        fi
        ;;
        
    status)
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if ps -p "$PID" > /dev/null 2>&1; then
                echo "✅ 自動加速運行中 (PID: $PID)"
                if [ -f "$LOG_FILE" ]; then
                    echo ""
                    echo "📊 最近 5 條日誌:"
                    tail -n 5 "$LOG_FILE"
                fi
                exit 0
            fi
        fi
        echo "⚠️  自動加速未運行"
        exit 1
        ;;
        
    log)
        if [ -f "$LOG_FILE" ]; then
            tail -f "$LOG_FILE"
        else
            echo "⚠️  日誌檔案不存在"
        fi
        ;;
        
    *)
        echo "用法: $0 {start|stop|status|log}"
        echo ""
        echo "指令說明:"
        echo "  start   - 啟動自動加速服務"
        echo "  stop    - 停止自動加速服務"
        echo "  status  - 查看運行狀態"
        echo "  log     - 即時查看日誌"
        exit 1
        ;;
esac
