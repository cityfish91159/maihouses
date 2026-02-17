# #8c Strict Audit + Zero-Slack 修復報告（2026-02-17）

## 範圍
- `api/community/list.ts`
- `api/community/__tests__/list.test.ts`（本次新增）
- `.claude/tickets/MOCK-SYSTEM.md`（施工紀錄補充）

## 原始問題（Phase 2）
1. High: 全量查詢 + 記憶體分頁，擴展性風險高  
   - 證據：`api/community/list.ts`（修復前）全表查詢 `communities` + 全量查詢 `community_posts` 後 `slice`
2. Medium: magic number 與快取字串散落  
   - 證據：`api/community/list.ts`（修復前）`20`/`100`/cache-control 字串重複
3. Medium: 405 錯誤文案非繁中  
   - 證據：`api/community/list.ts`（修復前）`Method ${req.method} Not Allowed`
4. Medium: CORS 拒絕回應未採統一結構  
   - 證據：`#8c` 端點透過 `enforceCors` 路徑回傳非 `ApiResponse` 結構
5. Medium: 缺少 #8c endpoint 專屬測試  
   - 證據：修復前無 `api/community/__tests__/list.test.ts`

## 已完成修復
1. 分頁策略改為分批掃描（batch）收斂，不再一次性全量載入  
   - 檔案：`api/community/list.ts`
   - 關鍵：以 `COMMUNITY_BATCH_SIZE` 分批查詢 `communities`，累積到 `offset + limit` 即停止
2. 抽出常數，消除散落硬編碼  
   - 檔案：`api/community/list.ts`
   - 常數：`DEFAULT_OFFSET`、`DEFAULT_LIMIT`、`MAX_LIMIT`、`COMMUNITY_BATCH_SIZE`、`CACHE_CONTROL_HEADER`
3. 405 文案統一繁中  
   - 檔案：`api/community/list.ts`
   - 文案：`僅支援 GET 請求`
4. #8c CORS 拒絕改為結構化錯誤回應  
   - 檔案：`api/community/list.ts`
   - 實作：`enforceListCors` + `errorResponse(API_ERROR_CODES.FORBIDDEN, '來源網域未被允許')`
5. 新增 #8c 專屬測試  
   - 檔案：`api/community/__tests__/list.test.ts`
   - 覆蓋：`OPTIONS`、disallowed origin、405、invalid query、過濾+分頁成功路徑
6. 工單紀錄更新  
   - 檔案：`.claude/tickets/MOCK-SYSTEM.md`
   - 內容：新增「第二輪優化」與「第二輪驗證」區塊

## 驗證結果
- [x] `npm run check:utf8`
- [x] `cmd /c npm run test -- api/community/__tests__/list.test.ts`（5 passed）
- [x] `cmd /c npm run typecheck`
- [x] `cmd /c npm run gate`

## 殘餘風險（已揭露）
1. `post_count` 仍透過 `community_posts` 明細計算，不是 SQL `GROUP BY` 聚合結果。  
   - 目前已由「全量掃描」降為「分批掃描」，風險顯著下降；若未來社區貼文量極大，建議升級為 DB 端聚合/RPC。

