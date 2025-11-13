# 🚀 快速參考指南

## 📦 主要腳本

| 腳本 | 用途 | 使用時機 |
|------|------|----------|
| `check-conflicts.sh` | 快速檢查衝突 | 提交前、合併後 |
| `auto-fix.sh` | 自動修復問題 | 發現問題時 |
| `start-aider.sh` | 啟動 Aider | 需要手動編輯時 |

## 🔄 自動觸發機制

### Git Hooks（自動運行）

```bash
# pre-commit: 提交前檢查衝突標記
git commit -m "..."  → 自動檢查

# post-commit: 提交後檢查代碼
git commit -m "..."  → 自動檢查

# post-merge: 拉取/合併後檢查
git pull  → 自動檢查並詢問是否修復
```

## 🛠️ 手動使用

### 1. 快速檢查
```bash
./check-conflicts.sh
```

### 2. 自動修復
```bash
# 設定 API Key
export OPENAI_API_KEY=sk-proj-你的金鑰

# 運行自動修復
./auto-fix.sh
```

### 3. 手動編輯
```bash
./start-aider.sh src/App.tsx
```

## 📋 工作流程

### 日常開發
```bash
# 1. 拉取代碼（自動檢查）
git pull

# 2. 開發...

# 3. 提交（自動檢查衝突）
git add .
git commit -m "feat: 新功能"
```

### 發現問題時
```bash
# 1. 手動檢查
./check-conflicts.sh

# 2. 自動修復
./auto-fix.sh

# 或手動編輯
./start-aider.sh
```

## 🎯 觸發時機

| 動作 | 觸發檢查 | 自動修復 |
|------|---------|---------|
| `git commit` | ✅ 是 | ❌ 否 |
| `git pull` | ✅ 是 | 🤔 詢問 |
| `git merge` | ✅ 是 | 🤔 詢問 |
| 手動運行 | ✅ 是 | ✅ 是 |

## 💡 最佳實踐

1. **讓 Git hooks 自動檢查** - 不需要手動運行
2. **只在需要時修復** - 發現問題後運行 `./auto-fix.sh`
3. **定期清理** - 移除 console.log 和 debugger

## 🐛 故障排除

```bash
# 檢查 hooks 是否生效
ls -la .git/hooks/

# 測試 hook
.git/hooks/pre-commit

# 重新設定權限
chmod +x .git/hooks/*
chmod +x *.sh
```

---

💡 **提示**: Git hooks 會自動運行，無需手動操作！
