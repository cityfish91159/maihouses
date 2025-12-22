# 🏠 MaiHouses 物件上傳優化 TODO (SSOT)

> **最後更新**: 2025-12-22
> **首頁**: https://maihouses.vercel.app/maihouses/
> **上傳頁**: https://maihouses.vercel.app/maihouses/property/upload

---

## 📋 摘要

| 優先級 | 任務 | 狀態 |
|:---:|:---|:---:|
| P0 | UP-1 表單自動快照 | ✅ 98/100 |
| P0 | UP-2 圖片前端壓縮 | ✅ 完成 |
| P1 | UP-3 圖片管理重構 | ⬜ |
| P1 | UP-4 亮點膠囊分流 | ⬜ |

---

## 🚀 待辦任務

### UP-3: 圖片管理重構

| ID | 任務 | 狀態 |
|:---|:---|:---:|
| UP-3.1 | 定義 ManagedImage 介面 | ⬜ |
| UP-3.2 | 重構 UploadContext 狀態管理 | ⬜ |
| UP-3.3 | 實作「設為封面」功能 | ⬜ |
| UP-3.4 | 發布時 images[0] 為封面 | ⬜ |

**AC**: 點擊任一張圖為封面 → 發布後 images[0] 為該張

---

### UP-4: 亮點膠囊分流

| ID | 任務 | 狀態 |
|:---|:---|:---:|
| UP-4.1 | 上傳頁：亮點改為手動勾選 | ⬜ |
| UP-4.2 | 首頁卡片：僅渲染 tags 前兩位 | ⬜ |
| UP-4.3 | 列表頁：移除重複規格膠囊 | ⬜ |
| UP-4.4 | 詳情頁：亮點與規格分區 | ⬜ |

**AC**: 卡片不再出現「23坪」「3房」重複膠囊

---

## ✅ 已完成

### UP-1: 表單自動快照 ✅ 98/100
- 草稿 Key: `mh_draft_{userId}`
- 7 天過期、版本檢查、匿名遷移
- `npm test` 通過

### UP-2: 圖片前端壓縮 ✅
- 壓縮: 2048px / 1.5MB / quality 0.85
- 並發控制 (concurrency=3)
- HEIC 轉 JPEG
- 重試機制 (0.85→0.7)
- 壓縮進度 UI
- `npm test` 通過

### 其他已完成
- KC-5: 測試補強 ✅
- KC-4: AI 膠囊生成 ✅ 97/100
- KC-3: 列表頁膠囊渲染 ✅
- P11: 房源列表頁升級 ✅

---

> 完整歷史：見 `docs/COMMUNITY_WALL_DEV_LOG.md`
