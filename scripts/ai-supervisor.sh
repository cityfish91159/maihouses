#!/bin/bash

# ==============================================================================
# 👮 AI Agent Supervisor (AI 監工系統)
# ==============================================================================
# 用途：在 AI Agent 作業過程中，強制執行即時檢查，防止偷懶、犯錯或越權修改。
# 用法：./scripts/ai-supervisor.sh [scope_path]
# ==============================================================================

SCOPE=${1:-"src/components/layout"} # 預設檢查範圍
PROTECTED_FILES=("src/components/Header/Header.tsx" "src/pages/Home.tsx")

# 色彩定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}👮 [Supervisor] 啟動監控程序... 範圍: $SCOPE${NC}"

# ------------------------------------------------------------------------------
# 1. 禁區防護網 (Safety Net)
# ------------------------------------------------------------------------------
echo -e "🔒 正在檢查禁區檔案..."
CHANGED_FILES=$(git diff --name-only HEAD)
HAS_VIOLATION=0

for file in "${PROTECTED_FILES[@]}"; do
    if echo "$CHANGED_FILES" | grep -q "$file"; then
        echo -e "${RED}🚨 [嚴重違規] 你修改了受保護的檔案：$file${NC}"
        echo -e "${RED}   立即執行：git checkout $file 還原變更！${NC}"
        HAS_VIOLATION=1
    fi
done

if [ $HAS_VIOLATION -eq 1 ]; then
    exit 1
fi

# ------------------------------------------------------------------------------
# 2. 反偷懶偵測 (Anti-Laziness Check)
# ------------------------------------------------------------------------------
echo -e "👀 正在掃描偷懶行為..."

# 2.1 檢查 'any' 型別 (偷懶不寫型別)
if grep -r ": any" $SCOPE --include="*.tsx" --include="*.ts" | grep -v "node_modules"; then
    echo -e "${RED}❌ [偷懶偵測] 發現使用了 'any' 型別！請定義具體 Interface。${NC}"
    exit 1
fi

# 2.2 檢查未完成的 TODO (偷懶留坑)
if grep -r "TODO" $SCOPE --include="*.tsx" --include="*.ts"; then
    echo -e "${YELLOW}⚠️ [提醒] 發現 TODO 標記，請確認是否為本次任務範圍內應完成的項目。${NC}"
    # 這裡不強制 exit，因為有時是合理的註解，但會高亮提醒
fi

# 2.3 檢查 console.log (偷懶沒刪除除錯訊息)
if grep -r "console.log" $SCOPE --include="*.tsx" --include="*.ts"; then
    echo -e "${RED}❌ [髒代碼] 發現 console.log，請移除或改用 console.warn/error。${NC}"
    exit 1
fi

# ------------------------------------------------------------------------------
# 3. 結構完整性檢查 (Structural Integrity)
# ------------------------------------------------------------------------------
echo -e "🏗️ 正在檢查代碼結構..."

# 3.1 檢查是否遺漏了必要的 export
# 簡單檢查：如果是 index.ts，必須包含 export
if [[ "$SCOPE" == *"index.ts"* ]]; then
    if ! grep -q "export" "$SCOPE"; then
        echo -e "${RED}❌ [結構錯誤] index.ts 檔案似乎沒有導出任何內容。${NC}"
        exit 1
    fi
fi

# ------------------------------------------------------------------------------
# 4. TypeScript 快速檢查 (Quick Type Check)
# ------------------------------------------------------------------------------
# 僅對變更的檔案進行語法檢查 (不跑完整的 tsc 以節省時間，但確保基本語法正確)
# 這裡我們假設如果檔案有變更，就跑一次完整的 tsc --noEmit (雖然慢但安全)
echo -e "⚡ 執行 TypeScript 型別檢查..."
if ! npm run typecheck > /dev/null 2>&1; then
    echo -e "${RED}❌ [型別錯誤] TypeScript 檢查失敗！請修正紅字錯誤。${NC}"
    # 為了不讓 log 太長，建議開發者手動跑 npm run typecheck 看詳細
    echo -e "${YELLOW}   請執行 'npm run typecheck' 查看詳細錯誤。${NC}"
    exit 1
fi

echo -e "${GREEN}✅ [Supervisor] 檢查通過！你可以繼續下一步。${NC}"
exit 0
