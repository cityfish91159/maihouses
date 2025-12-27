#!/usr/bin/env bash
set -euo pipefail

echo "== 0) 基本環境與快取 =="
node -v || true
npm -v || true
echo "清理 Vite 快取與舊輸出..."
rm -rf node_modules/.vite dist .parcel-cache .cache 2>/dev/null || true

echo
echo "== 1) 文字樣式衝突（Tailwind 類名互斥/重複） =="
# 同一行同時出現多個 text-*、font-*、leading-*、tracking-*（可能彼此覆蓋）
rg -n --hidden -S "(text-(xs|sm|base|lg|xl|[2-9]xl)).*(text-(xs|sm|base|lg|xl|[2-9]xl))" src || true
rg -n --hidden -S "(font-(thin|extralight|light|normal|medium|semibold|bold|black)).*(font-(thin|extralight|light|normal|medium|semibold|bold|black))" src || true
rg -n --hidden -S "(leading-[0-9a-z\[\]\.]+).*(leading-[0-9a-z\[\]\.]+)" src || true
rg -n --hidden -S "(tracking-[0-9a-z\-\[\]\.]+).*(tracking-[0-9a-z\-\[\]\.]+)" src || true

echo
echo "== 2) CSS / SCSS 內部衝突（同 selector 重複宣告字體屬性） =="
# 找出同檔同 selector 重複宣告 font-size / line-height / letter-spacing / font-weight
rg -n --hidden -S "font-size|line-height|letter-spacing|font-weight" src | sed 's#:.*##' | sort | uniq -c | sort -nr | head -20

echo
echo "== 3) 被 !important 壓住（可能導致你的修改沒生效） =="
rg -n --hidden -S "!important" src || true

echo
echo "== 4) 類名打錯 / 未被 Tailwind 生成（常見原因：動態字串、沒在 content 範圍） =="
# 可疑：動態 className、模板字串或自拼接，Tailwind 可能不會產生對應 CSS
rg -n --hidden -S -P "(class(Name)?=.*[\`\'].*\${)|(class(Name)?=.*\\+\\s*[\"\'])" src || true

echo
echo "== 5) 找出會覆蓋 Body/全局字體的規則（高特異度選擇器） =="
rg -n --hidden -S "html|body|\\*|:root" src | rg -n "font-|letter|line-height" || true

echo
echo "== 6) 檢查是否有多份 CSS 重複載入（順序覆蓋） =="
# 看 import 次數
rg -n --hidden -S "@import|import\\s+['\"'][^'\"]+\\.css" src || true

echo
echo "== 7) 重新啟動 Dev Server（強制重建） =="
echo "提示：用下列任一指令強制重編："
echo "  npx vite --force"
echo "  npm run dev -- --force"
