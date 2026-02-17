# Vercel Key 防盜用完整流程 Runbook

版本: v1.0  
最後更新: 2026-02-13  
適用專案: `maihouses`

## 1. 目標
1. 降低 Vercel Token、Supabase 高權限金鑰被盜用風險。
2. 在疑似外洩時，能在 60 分鐘內完成止血與輪替。
3. 將部署流程改為最小權限、可稽核、可定期演練。

## 2. 適用範圍
1. Vercel:
`VERCEL_TOKEN`、Project/Team 權限、Deployment 權限、Environment Variables。
2. Supabase:
`SUPABASE_SERVICE_ROLE_KEY`、專案 API keys/JWT secret。
3. GitHub/CI:
Actions Secrets、部署工作流、第三方外掛。
4. 本機開發機:
`.env*`、`.vercel/`、shell history、暫存檔。

## 3. 角色分工
1. Incident Owner:
主導止血、決策、對外同步。
2. Infra Owner:
執行 Vercel/Supabase/GitHub 金鑰輪替。
3. Repo Owner:
清理 repo、重寫歷史、提交修復。
4. Reviewer:
驗證流程完整性與回歸測試結果。

## 4. 事件分級
1. P0:
確認金鑰已外洩或被未授權使用。
2. P1:
疑似外洩，尚未看到濫用跡象。
3. P2:
僅發現流程風險，無外洩證據。

## 5. P0/P1 緊急應變流程

### 5.1 T+0 ~ T+15 分鐘: 立即止血
1. 暫停所有自動部署。
2. 撤銷所有疑似外洩的 Vercel Token。
3. 先拔除高風險環境變數讀取權限。
4. 在 Incident Channel 建立事件紀錄:
時間、影響範圍、第一位發現者、當前狀態。

### 5.2 T+15 ~ T+45 分鐘: 金鑰輪替
1. Vercel:
建立新 Token，更新 CI Secret，驗證舊 Token 無法再部署。
2. Supabase:
輪替服務端高權限 key，更新 Vercel Environment Variables。
3. GitHub:
更新所有相關 Secrets，重新觸發最小化 smoke deploy。

### 5.3 T+45 ~ T+60 分鐘: 快速驗證
1. 驗證 Production 部署正常。
2. 驗證 API 功能正常，無 401/500 激增。
3. 驗證舊 Token/舊 Key 全部失效。

## 6. 正式輪替與清理細節

### 6.1 Vercel Token 輪替
1. 到 Vercel Dashboard > Account Settings > Tokens。
2. 立即 Revoke 舊 Token。
3. 新建 Token，命名規則建議:
`ci-maihouses-YYYYMMDD`。
4. 只允許 CI 使用，不放本機長期保存。
5. 更新 GitHub Actions secret:
`VERCEL_TOKEN`。

### 6.2 Supabase Key 輪替
1. 盤點使用 `SUPABASE_SERVICE_ROLE_KEY` 的 API 路由。
2. 在維護時段輪替 Supabase 高權限 key。
3. 更新 Vercel 環境變數:
`SUPABASE_SERVICE_ROLE_KEY`。
4. 重新部署並檢查下列路由:
`/api/*` 中所有使用 service role 的端點。
5. 觀察 30 分鐘 error rate 與 audit logs。

### 6.3 GitHub Secrets 輪替
1. 更新 Repo/Org Secrets:
`VERCEL_TOKEN`、`SUPABASE_SERVICE_ROLE_KEY`、其他雲端金鑰。
2. 檢查 Workflow 檔案，確保不會把 secret echo 到 logs。
3. 重新執行部署工作流，確認 secrets 讀取正常。

## 7. Repo 與本機清理流程

### 7.1 版控清理
1. 確保 `.env*` 不進版控，僅保留 `.env.example`。
2. 確保 `.vercel/` 不進版控。
3. 執行:
```bash
git rm --cached .env .env.check .env.production 2>nul || true
git rm -r --cached .vercel 2>nul || true
```
4. 確認 `.gitignore` 具備:
```gitignore
.env
.env.*
!.env.example
.vercel/
```

### 7.2 本機清理
1. 刪除本機明碼檔:
`.env.check`、`.env.production`。
2. 清理 shell history 內可能出現的 token 指令。
3. 不再使用純文字檔保存金鑰，改用密碼管理器。

### 7.3 Git 歷史清理
1. 若密鑰曾進入 Git 歷史:
使用 `git filter-repo` 或 BFG 清理。
2. 清理後強制推送，所有協作者重新 clone。
3. 即使已清理歷史，也必須再次輪替金鑰。

## 8. CI/CD 強化標準
1. 優先使用 Vercel Git Integration，能不用 Token 就不用。
2. 若必須用 Token:
使用專用 CI 帳號，不用個人主帳號。
3. CI 工作流不得輸出 secrets:
禁止 `echo $VERCEL_TOKEN`。
4. 所有部署 job 加上 branch protection 與 required review。
5. 僅 Production job 可讀 Production secrets。

## 9. 權限最小化標準
1. Vercel Team:
只給必要成員部署權。
2. GitHub:
限制可修改 workflow/secrets 的人員。
3. Supabase:
service role 僅 server side 使用，前端永不持有。
4. 本機:
僅 Owner/Infra 可持有正式環境憑證。

## 10. 監控與告警
1. 開啟 Vercel Audit Logs 定期檢查:
token 建立、token 使用、部署異常尖峰。
2. 開啟 GitHub Secret Scanning。
3. 開啟 Gitleaks pre-commit 或 CI 掃描。
4. 建立告警:
非預期時段部署、非預期分支部署、API error rate 激增。

## 11. 驗證清單 (每次輪替必做)
1. 舊 Vercel Token 測試部署應失敗。
2. 新 Vercel Token 測試部署應成功。
3. `npm run gate` 通過。
4. 關鍵 API smoke test 通過。
5. `rg` 掃描無敏感字串洩漏:
```bash
rg -n "VERCEL_TOKEN|SUPABASE_SERVICE_ROLE_KEY|_authToken|Authorization: Bearer" . --glob "!node_modules/**" --glob "!.git/**"
```
6. Git 追蹤檔案檢查無 `.env` 與 `.vercel`:
```bash
git ls-files | rg "^\\.env|^\\.vercel/"
```

## 12. 每月維運節奏
1. 每月:
檢查 secrets 使用名單與最後使用時間。
2. 每季:
演練一次 P1 外洩流程 (桌面演練)。
3. 每 30~60 天:
輪替 CI 部署 Token。
4. 每次人員異動:
立即撤銷離職/離組人員金鑰與權限。

## 13. 一次性落地指令範本
```bash
# 1) 確認敏感檔不在 git 追蹤
git ls-files | rg "^\\.env|^\\.vercel/"

# 2) 若有追蹤，移除但保留本機檔
git rm --cached .env .env.check .env.production 2>nul || true
git rm -r --cached .vercel 2>nul || true

# 3) 檢查敏感字串
rg -n "VERCEL_TOKEN|SUPABASE_SERVICE_ROLE_KEY|_authToken|Authorization: Bearer" . --glob "!node_modules/**" --glob "!.git/**"

# 4) 品質檢查
npm run gate
```

## 14. 結案標準
1. 舊金鑰全部失效且已驗證。
2. 新金鑰已部署且服務正常。
3. Repo 與歷史清理完成。
4. Runbook 勾稽完成並有事件紀錄。
