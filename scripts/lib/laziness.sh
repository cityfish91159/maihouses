#!/bin/bash
# ============================================================================
# AI Supervisor - 偷懶偵測模組
# ============================================================================

# 偵測偷懶模式
# 返回: 0=乾淨, 1=發現偷懶
detect_laziness() {
    local file="$1"
    local found=0

    [ ! -f "$file" ] && return 0

    # 只檢查 ts/tsx
    [[ ! "$file" =~ \.(ts|tsx)$ ]] && return 0

    # 1. 檢查 any 類型
    if grep -q ": any" "$file" 2>/dev/null; then
        echo -e "${RED}發現 'any' 類型: $file${NC}"
        grep -n ": any" "$file" | head -3
        found=1
    fi

    # 2. 檢查 @ts-ignore
    if grep -qE "@ts-ignore|@ts-nocheck" "$file" 2>/dev/null; then
        echo -e "${RED}發現 @ts-ignore: $file${NC}"
        grep -n "@ts-ignore\|@ts-nocheck" "$file" | head -3
        found=1
    fi

    # 3. 檢查 eslint-disable
    if grep -q "eslint-disable" "$file" 2>/dev/null; then
        echo -e "${RED}發現 eslint-disable: $file${NC}"
        grep -n "eslint-disable" "$file" | head -3
        found=1
    fi

    # 4. 檢查空 catch
    if grep -qE "catch\s*\([^)]*\)\s*\{\s*\}" "$file" 2>/dev/null; then
        echo -e "${RED}發現空 catch: $file${NC}"
        found=1
    fi

    # 5. console.log (警告但不阻斷)
    if grep -q "console\.log" "$file" 2>/dev/null; then
        echo -e "${YELLOW}警告: 發現 console.log: $file${NC}"
    fi

    return $found
}

# 掃描整個目錄
scan_laziness() {
    local dir="${1:-$PROJECT_ROOT/src}"
    local lazy_count=0

    print_header "🔍 偷懶掃描"
    echo "掃描目錄: $dir"
    echo ""

    while IFS= read -r -d '' file; do
        if ! detect_laziness "$file" > /dev/null 2>&1; then
            echo -e "${RED}  ⚠️ $file${NC}"
            lazy_count=$((lazy_count + 1))
        fi
    done < <(find "$dir" -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 2>/dev/null)

    echo ""
    if [ "$lazy_count" -eq 0 ]; then
        success "未發現偷懶模式"
    else
        error "發現 $lazy_count 個檔案有偷懶模式"
        return 1
    fi
}

# 檢查 Section/List 組件的 Empty State
check_empty_state() {
    local file="$1"

    # 只檢查 Section/List/Grid/Table 組件
    [[ ! "$file" =~ (Section|List|Grid|Table|Cards)\.tsx$ ]] && return 0

    [ ! -f "$file" ] && return 0

    # 檢查是否有處理空資料
    if ! grep -qE "(\.length\s*(===|==|>|<)\s*0|isEmpty|EmptyState|NoData|沒有.*資料|尚無|還沒有)" "$file" 2>/dev/null; then
        echo -e "${RED}缺少 Empty State 處理: $file${NC}"
        return 1
    fi

    return 0
}
