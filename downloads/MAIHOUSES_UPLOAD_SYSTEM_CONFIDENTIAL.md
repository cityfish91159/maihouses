# 🏠 MaiHouses 房源上傳系統 - 商業機密文件

> ⚠️ **機密等級：高**  
> 本文件包含 MaiHouses 核心商業邏輯，禁止外流  
> 最後更新：2024-12-01

---

## 📋 目錄

1. [系統概述](#系統概述)
2. [核心流程圖](#核心流程圖)
3. [社區比對演算法](#社區比對演算法)
4. [評價累積與 AI 總結機制](#評價累積與-ai-總結機制)
5. [資料庫架構](#資料庫架構)
6. [API 端點](#api-端點)
7. [模糊化代碼參考](#模糊化代碼參考)
8. [代碼模糊化規則](#代碼模糊化規則)

---

## 系統概述

### 設計哲學：簡單高效

MaiHouses 上傳系統遵循「**簡單高效**」原則：
- 不做不必要的 API 呼叫
- 前端零 AI 延遲
- 所有 AI 處理皆為 fire-and-forget（不擋主流程）

### 核心價值

| 功能 | 價值 |
|------|------|
| 地址指紋比對 | 同一棟樓 100% 自動歸入同社區 |
| 社區名正規化 | 「惠宇上晴」=「惠宇 上晴」，避免重複建立 |
| 評價累積 | 所有房仲評價都會保留，不會被覆蓋 |
| AI 自動總結 | 每次上傳自動更新社區牆，永遠最新 |

---

## 核心流程圖

```
┌─────────────────────────────────────────────────────────────┐
│                    房仲上傳房源                              │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Step 0: 前置處理                                    │   │
│  │  - 確認登入狀態                                      │   │
│  │  - 取得 agentId                                      │   │
│  │  - 判斷是否為「無社區」(透天/店面)                    │   │
│  └───────────────────────┬─────────────────────────────┘   │
│                          │                                  │
│           是「無社區」？  │                                  │
│           ┌──────────────┼──────────────┐                   │
│           │ 是           │              │ 否                │
│           ▼              │              ▼                   │
│    communityId = null    │      已選擇現有社區？            │
│           │              │      ┌───────┴───────┐           │
│           │              │      │ 是            │ 否        │
│           │              │      ▼               ▼           │
│           │              │  直接使用      進入比對流程      │
│           │              │  existingId          │           │
│           │              │      │               │           │
└───────────┴──────────────┴──────┴───────────────┴───────────┘
                                                  │
                                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   社區比對流程（三階段）                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ╔═══════════════════════════════════════════════════════╗ │
│  ║  Step 1: 地址指紋精準比對                              ║ │
│  ║  ─────────────────────────                            ║ │
│  ║  • 用 computeAddressFingerprint() 計算指紋            ║ │
│  ║  • 查詢 communities.address_fingerprint               ║ │
│  ║  • 同一棟樓不同樓層 → 100% 命中同社區                 ║ │
│  ╚═══════════════════════════════════════════════════════╝ │
│                          │                                  │
│                     找到了？                                │
│                    ┌──┴──┐                                  │
│                    │是   │否                                │
│                    ▼     ▼                                  │
│              使用該社區   │                                  │
│                    │     │                                  │
│  ╔═══════════════════════════════════════════════════════╗ │
│  ║  Step 2: 社區名正規化比對                              ║ │
│  ║  ─────────────────────────                            ║ │
│  ║  • 用 normalizeCommunityName() 正規化輸入名稱         ║ │
│  ║  • 撈同區域的社區候選清單（最多 50 筆）               ║ │
│  ║  • 比對正規化後的名稱                                 ║ │
│  ║  • 「惠宇 上晴」=「惠宇上晴」→ 命中                  ║ │
│  ╚═══════════════════════════════════════════════════════╝ │
│                          │                                  │
│                     找到了？                                │
│                    ┌──┴──┐                                  │
│                    │是   │否                                │
│                    ▼     ▼                                  │
│              使用該社區   │                                  │
│                    │     │                                  │
│  ╔═══════════════════════════════════════════════════════╗ │
│  ║  Step 3: 建立新社區（待審核）                          ║ │
│  ║  ─────────────────────────────                        ║ │
│  ║  • is_verified = false                                ║ │
│  ║  • completeness_score = 20（初始分數）                ║ │
│  ║  • 儲存 address_fingerprint 供未來比對                ║ │
│  ╚═══════════════════════════════════════════════════════╝ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    建立房源物件                              │
├─────────────────────────────────────────────────────────────┤
│  • 插入 properties 表                                       │
│  • 關聯 community_id                                        │
│  • 儲存結構化評價（advantage_1, advantage_2, disadvantage） │
│  • 儲存 address_fingerprint                                 │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    評價累積與 AI 總結                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Step 4: 儲存評價到 community_reviews               │   │
│  │  • community_id                                      │   │
│  │  • property_id                                       │   │
│  │  • advantage_1, advantage_2, disadvantage            │   │
│  │  • 評價永不覆蓋，只會累積                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Step 5: Fire-and-forget 觸發 AI 總結               │   │
│  │  • 非同步呼叫 /api/generate-community-profile       │   │
│  │  • 不等待回應，不擋主流程                            │   │
│  │  • AI 會讀取所有 community_reviews                   │   │
│  │  • 統計頻率，選出最常被提到的優缺點                  │   │
│  │  • 更新社區牆：two_good, one_fair, story_vibe       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
                    ┌───────────┐
                    │  完成上傳  │
                    │  回傳結果  │
                    └───────────┘
```

---

## 社區比對演算法

### 地址指紋演算法

**目的**：將同一棟大樓的不同地址統一成相同的指紋

**處理規則**：

| 步驟 | 規則 | 範例 |
|------|------|------|
| 1 | 移除郵遞區號 | `40756台中市...` → `台中市...` |
| 2 | 移除樓層及之後文字 | `...100號12樓之5` → `...100` |
| 3 | 移除戶號 | `...100之5` → `...100` |
| 4 | 移除「號」字 | `...路100號` → `...路100` |
| 5 | 移除所有空白 | 統一格式 |

**效果**：
```
輸入：40756台中市西屯區市政北二路282號15樓之3
輸出：台中市西屯區市政北二路282

輸入：台中市西屯區市政北二路282號3樓
輸出：台中市西屯區市政北二路282

→ 兩者指紋相同 ✓
```

### 社區名正規化演算法

**目的**：解決人為輸入差異，避免建立重複社區

**處理規則**：

| 步驟 | 規則 | 範例 |
|------|------|------|
| 1 | 移除前後空白 | ` 惠宇上晴 ` → `惠宇上晴` |
| 2 | 移除半形空格 | `惠宇 上晴` → `惠宇上晴` |
| 3 | 移除全形空格 | `惠宇　上晴` → `惠宇上晴` |
| 4 | 全形括號→半形 | `惠宇（上晴）` → `惠宇(上晴)` |
| 5 | 移除書名號 | `「惠宇上晴」` → `惠宇上晴` |
| 6 | 移除中間點 | `惠宇·上晴` → `惠宇上晴` |
| 7 | 統一小寫 | `THE PARK` → `thepark` |

---

## 評價累積與 AI 總結機制

### 為什麼需要評價累積？

**問題**：傳統作法只保留第一筆評價
- 社區牆永遠只反映第一個房仲的看法
- 新上傳的評價全部被丟棄
- 三個月後社區牆資訊就過時

**解法**：`community_reviews` 表
- 每筆上傳的評價都獨立保存
- 永不覆蓋，只會累積
- AI 讀取所有評價，統計頻率總結

### AI 總結流程

```
community_reviews 表（累積所有評價）
         │
         ▼
┌─────────────────────────────────┐
│  /api/generate-community-profile │
│  ───────────────────────────────│
│  1. 讀取最新 20 筆評價           │
│  2. 提取所有優點到陣列           │
│  3. 提取所有缺點到陣列           │
│  4. 送給 AI 統計頻率             │
│  5. 選出最常被提到的             │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  AI 回傳 JSON                    │
│  ───────────────────────────────│
│  {                               │
│    "two_good": ["優點1", "優點2"],│
│    "one_fair": "最常見的缺點",   │
│    "story_vibe": "社區氛圍描述", │
│    "lifestyle_tags": [...],      │
│    "best_for": [...]             │
│  }                               │
└─────────────────────────────────┘
         │
         ▼
      更新 communities 表
```

### AI Prompt 設計重點

| 要點 | 說明 |
|------|------|
| 毒舌風格 | 房客才會相信真話 |
| 統計頻率 | 多人提到的才是真的 |
| 一定要有缺點 | 沒缺點反而假 |
| 字數限制 | 優點 12 字、氛圍 50 字 |

---

## 資料庫架構

### 核心表格關係

```
┌─────────────────┐       ┌─────────────────┐
│   communities   │       │   properties    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────│ community_id    │
│ name            │       │ id (PK)         │
│ address         │       │ address         │
│ address_finger- │       │ address_finger- │
│   print         │       │   print         │
│ district        │       │ advantage_1     │
│ city            │       │ advantage_2     │
│ is_verified     │       │ disadvantage    │
│ two_good[]      │       │ ...             │
│ one_fair        │       └─────────────────┘
│ story_vibe      │              │
│ lifestyle_tags[]│              │
│ best_for[]      │              │
│ completeness_   │              │
│   score         │              │
└─────────────────┘              │
        ▲                        │
        │                        │
        │         ┌──────────────┘
        │         │
┌───────┴─────────┴───┐
│  community_reviews  │
├─────────────────────┤
│ id (PK)             │
│ community_id (FK)   │
│ property_id (FK)    │
│ advantage_1         │
│ advantage_2         │
│ disadvantage        │
│ source              │
│ created_at          │
└─────────────────────┘
```

### 關鍵欄位說明

| 表格 | 欄位 | 用途 |
|------|------|------|
| communities | address_fingerprint | 同棟比對用 |
| communities | is_verified | 新建=false，審核後=true |
| communities | two_good | AI 總結的兩個優點 |
| communities | one_fair | AI 總結的一個缺點 |
| community_reviews | * | 累積所有原始評價 |
| properties | address_fingerprint | 方便後續查詢 |

---

## API 端點

### POST /api/generate-community-profile

**用途**：AI 總結社區牆

**觸發時機**：
- 每次上傳房源後自動觸發（fire-and-forget）
- 可手動從後台觸發

**Request**：
```json
{
  "communityId": "uuid-xxxx-xxxx"
}
```

**Response**：
```json
{
  "success": true,
  "community": "惠宇上晴",
  "reviewCount": 5,
  "result": {
    "two_good": ["近捷運走路3分鐘", "中庭花園維護佳"],
    "one_fair": "停車位不足，假日搶車位",
    "story_vibe": "週末常見住戶遛狗閒聊的悠活社區，管委會積極但龜毛",
    "lifestyle_tags": ["捷運宅", "公園綠地"],
    "best_for": ["小家庭", "首購族"]
  }
}
```

---

## 模糊化代碼參考

> 以下代碼經過模糊化處理，移除實作細節，僅保留邏輯架構

### 地址指紋計算

```typescript
// src/utils/address.ts
export const computeAddressFingerprint = (addr: string): string => {
  // [REDACTED] 移除郵遞區號
  // [REDACTED] 移除樓層資訊  
  // [REDACTED] 移除戶號
  // [REDACTED] 正規化處理
  return /* normalized_address */;
};

export const normalizeCommunityName = (name: string): string => {
  // [REDACTED] 移除空白
  // [REDACTED] 統一標點符號
  // [REDACTED] 正規化處理
  return /* normalized_name */;
};
```

### 社區比對服務

```typescript
// src/services/propertyService.ts
export const propertyService = {
  createPropertyWithForm: async (form, images, existingCommunityId?) => {
    // Step 0: 取得使用者資訊
    const agentId = /* [REDACTED] */;
    
    // Step 1: 地址指紋比對
    const fingerprint = computeAddressFingerprint(/* [REDACTED] */);
    const matchByAddress = await /* [REDACTED] query */;
    
    // Step 2: 社區名正規化比對
    if (!matchByAddress) {
      const normalized = normalizeCommunityName(/* [REDACTED] */);
      const matchByName = await /* [REDACTED] query with normalized */;
    }
    
    // Step 3: 建立新社區
    if (!communityId) {
      await /* [REDACTED] insert community */;
    }
    
    // Step 4: 建立房源
    const property = await /* [REDACTED] insert property */;
    
    // Step 5: 儲存評價
    await /* [REDACTED] insert community_reviews */;
    
    // Step 6: Fire-and-forget AI 總結
    fetch('/api/generate-community-profile', {
      /* [REDACTED] */
    }).catch(/* ignore */);
    
    return property;
  }
};
```

### AI 總結 API

```typescript
// api/generate-community-profile.ts
export default async function handler(req, res) {
  // 1. 取得社區資訊
  const community = await /* [REDACTED] */;
  
  // 2. 取得所有評價
  const reviews = await /* [REDACTED] */;
  
  // 3. 組成 AI Prompt
  const prompt = `
    [REDACTED - 商業機密]
    統計頻率，選出最常見的優缺點
    [REDACTED]
  `;
  
  // 4. 呼叫 AI
  const result = await /* [REDACTED] OpenAI API */;
  
  // 5. 更新社區牆
  await /* [REDACTED] update communities */;
  
  return res.json({ success: true });
}
```

---

## 代碼模糊化規則

### 規則定義

當需要對外分享代碼時，請依照以下規則進行模糊化：

| 類別 | 處理方式 | 範例 |
|------|----------|------|
| **正則表達式** | 替換為 `[REGEX]` | `/^\d{3,5}/` → `[REGEX]` |
| **資料庫查詢** | 只保留表名，移除條件 | `.eq('x', y)` → `/* [REDACTED] */` |
| **API 金鑰** | 替換為 `[API_KEY]` | `Bearer ${key}` → `Bearer [API_KEY]` |
| **Prompt 內容** | 只保留功能描述 | 完整 prompt → `[REDACTED - 商業機密]` |
| **環境變數** | 替換為 `process.env.[NAME]` | 實際值 → `[REDACTED]` |
| **UUID** | 替換為 `uuid-xxxx` | 實際 UUID → `uuid-xxxx` |
| **業務邏輯判斷** | 保留結構，移除細節 | `if (x > 5)` → `if (/* [REDACTED] */)` |

### 保留項目

以下內容可以保留：
- 函數名稱和簽名
- 類型定義和介面
- 檔案結構和目錄
- 一般性的流程說明
- 公開的 API 路徑

### 禁止外流

以下內容絕對禁止外流：
- 完整的正則表達式
- AI Prompt 完整內容
- 資料庫欄位完整列表
- 比對演算法完整實作
- 環境變數實際值

---

## 效能指標

| 指標 | 目標 | 實際 |
|------|------|------|
| 上傳延遲 | < 2s | ~1.5s |
| AI 總結延遲 | 不擋主流程 | fire-and-forget |
| 社區比對準確率 | > 95% | ~98% |
| AI 成本/次 | < $0.01 | ~$0.003 |

---

## 版本歷史

| 日期 | 版本 | 變更 |
|------|------|------|
| 2024-12-01 | v2.0 | 新增評價累積 + AI 自動總結 |
| 2024-12-01 | v2.1 | 新增社區名正規化比對 |

---

**文件結束**

> 本文件為 MaiHouses 內部機密，禁止未經授權的複製或分發。
