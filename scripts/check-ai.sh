#!/usr/bin/env bash
set -euo pipefail

# 簡單檢查：本機是否設定了 VITE_OPENAI_API_KEY 或 VITE_AI_PROXY_URL，並測試可連通性

ROOT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"

load_env() {
  # 載入 .env 與 .env.local（若存在），只匯入以 VITE_ 開頭的鍵
  for f in "$ROOT_DIR/.env" "$ROOT_DIR/.env.local"; do
    if [[ -f "$f" ]]; then
      # 過濾註解與空白行
      while IFS='=' read -r k v; do
        [[ -z "${k:-}" ]] && continue
        [[ "$k" =~ ^# ]] && continue
        if [[ "$k" =~ ^VITE_ ]]; then
          # 去除包裹的引號（若有）
          v="${v%\r}"
          v="${v%\n}"
          v="${v#\"}"
          v="${v%\"}"
          export "$k"="$v"
        fi
      done < <(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$f" || true)
    fi
  done
}

http_status() {
  local url="$1"
  shift
  curl -sS -o /dev/null -w "%{http_code}" "$url" "$@"
}

echo "[check-ai] 讀取環境變數…"
load_env

KEY="${VITE_OPENAI_API_KEY:-}"
PROXY="${VITE_AI_PROXY_URL:-}"

if [[ -n "$KEY" ]]; then
  echo "[check-ai] 發現 VITE_OPENAI_API_KEY（僅測連通性，不輸出金鑰）"
  code=$(http_status "https://api.openai.com/v1/models" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" || true)
  echo "[check-ai] OpenAI API /v1/models 回應狀態: $code"
  case "$code" in
    200)
      echo "[OK] 金鑰有效、可用。" ;;
    401)
      echo "[WARN] 金鑰無效或權限問題（401），但網路連通正常。請檢查金鑰是否過期/拼寫。" ;;
    429)
      echo "[WARN] 已達速率/額度限制（429），但金鑰存在且連線正常。" ;;
    5??)
      echo "[WARN] OpenAI 伺服器錯誤（$code）。稍後再試。" ;;
    *)
      echo "[ERR] 無法確認金鑰可用（HTTP $code）。請檢查網路或防火牆。" ;;
  esac
  exit 0
fi

if [[ -n "$PROXY" ]]; then
  echo "[check-ai] 未設金鑰，改檢查代理：$PROXY"
  # 嘗試 HEAD，若不支援則用 GET
  code=$(curl -sS -o /dev/null -w "%{http_code}" -X HEAD "$PROXY" || true)
  if [[ "$code" == "000" || "$code" -ge 400 ]]; then
    code=$(http_status "$PROXY" || true)
  fi
  echo "[check-ai] 代理回應狀態: $code"
  if [[ "$code" =~ ^2 ]]; then
    echo "[OK] 代理可連通。建議於 .env 設定 VITE_AI_PROXY_URL=$PROXY 並於前端使用此 URL。"
    exit 0
  else
    echo "[ERR] 代理不可用（HTTP $code）。請確認 Workers/反向代理是否部署正確。"
    exit 1
  fi
fi

echo "[check-ai] 未偵測到 VITE_OPENAI_API_KEY 或 VITE_AI_PROXY_URL。"
echo "[HINT] 在根目錄建立 .env，內容例如：\nVITE_AI_PROXY_URL=https://<your-worker>.workers.dev/api/chat\n# 或\nVITE_OPENAI_API_KEY=sk-proj-XXXX"
exit 2
