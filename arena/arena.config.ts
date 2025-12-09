/**
 * 🏟️ ARENA CONFIG
 * 
 * 競賽評分規則（AI 看不到這裡的邏輯）
 * 
 * 核心原則：
 * - 測試全過只是入場券
 * - 最短 + 最快 = 冠軍
 * - 其他全部淘汰
 */

export interface TaskConfig {
  /** 入口函數名稱 */
  entryFunction: string;
  
  /** 單次執行超時 (ms) */
  maxRunMs: number;
  
  /** 效能測試回合數 */
  perfRounds: number;
  
  /** 單一函數行數上限 */
  maxFunctionLines: number;
  
  /** 最大巢狀層數 */
  maxNestingDepth: number;
  
  /** Fuzz 測試回合數（抓邊界問題） */
  fuzzRounds: number;
  
  /** 壓力測試資料量 */
  stressDataSize: number;
}

/** 地獄模式配置（G2 觸發時使用） */
export interface HellModeConfig {
  /** Fuzz 回合數倍數 */
  fuzzMultiplier: number;
  /** 壓力測試倍數 */
  stressMultiplier: number;
  /** 效能測試回合倍數 */
  perfMultiplier: number;
  /** 超時閾值倍數（更嚴格 = 除以這個數） */
  timeoutDivisor: number;
}

export const HELL_MODE: HellModeConfig = {
  fuzzMultiplier: 3,      // Fuzz 測試 3 倍
  stressMultiplier: 5,    // 壓力測試 5 倍
  perfMultiplier: 2,      // 效能測試 2 倍
  timeoutDivisor: 2,      // 超時閾值減半
};

export const ARENA_CONFIG: Record<string, TaskConfig> = {
  // 範例任務：UAG 評分
  uag_score: {
    entryFunction: "uagScore",
    maxRunMs: 200,
    perfRounds: 30,
    maxFunctionLines: 60,
    maxNestingDepth: 3,
    fuzzRounds: 100,      // 100 組隨機邊界測資
    stressDataSize: 10000, // 10000 筆壓力測試
  },
  
  // 範例任務：物件過濾
  property_filter: {
    entryFunction: "filterProperties",
    maxRunMs: 150,
    perfRounds: 50,
    maxFunctionLines: 40,
    maxNestingDepth: 2,
    fuzzRounds: 200,
    stressDataSize: 50000,
  },
};

/** 排名權重 */
export const RANKING_WEIGHTS = {
  /** 效能權重 (越快越好) */
  performance: 0.6,
  /** 行數權重 (越少越好) */
  codeSize: 0.4,
};

/** 淘汰條件（任一觸發即出局） */
export const ELIMINATION_RULES = {
  /** 公開測試未全過 */
  testFailed: true,
  /** 任一執行超時 */
  timeout: true,
  /** 任一執行 throw */
  throws: true,
  /** Fuzz 測試失敗率 > 5% */
  fuzzFailRate: 0.05,
  /** 壓力測試超時 */
  stressTimeout: true,
  /** 函數太長 */
  functionTooLong: true,
  /** 巢狀太深 */
  nestingTooDeep: true,
};
