/**
 * 🔥 MID-LAW CONFIG - 寫代碼當下的 10 條天條
 *
 * 不是事後審查，是「正在寫的每一行都被引導往更短、更快、更準走」
 */

// ============================================================================
// 🟥 A 組：防退化（防偷懶、防保守）
// ============================================================================

export const ANTI_REGRESSION = {
  // 天條 1：禁止「一次就完成」
  minFailedAttempts: 2, // 至少要有 2 次失敗版本
  onePassPenalty: -30, // 一次過 = 高風險投機標記

  // 天條 2：禁止「空意義成功」
  outputMustChange: true, // 輸入變動，輸出必須變
  correlationProbeCount: 10, // 自動插入 10 組關聯性探針

  // 天條 3：禁止 Silent Fail
  catchMustClassify: true, // catch 必須分類錯誤
  returnNullInCatchPenalty: -50, // catch { return null } 直接判投機
} as const;

// ============================================================================
// 🟧 B 組：逼優化（最短碼＋最快）
// ============================================================================

export const FORCE_OPTIMIZE = {
  // 天條 4：每 100 行，必須產生一次排行榜
  linesPerRanking: 100,
  noRankingNoFeature: true, // 沒排名不准加功能

  // 天條 5：代碼只能「變短或變快」，不能兩者都退步
  rejectBothWorse: true, // Δlines >= 0 AND Δtime >= 0 → REJECT

  // 天條 6：任何 abstraction 都要付出效能代價證明
  abstractionRules: {
    mustShortenCode: true, // helper 要讓代碼更短
    mustNotSlowDown: true, // 或至少不能變慢
    purelyAestheticPenalty: -20, // 只為好看 = 垃圾
  },
} as const;

// ============================================================================
// 🟩 C 組：逼探索（防止只寫最低及格版）
// ============================================================================

export const FORCE_EXPLORE = {
  // 天條 7：任何功能都必須有「對照組」
  minVersions: 2, // 至少兩版 A/B
  singleVersionPenalty: -40, // 單一實作禁止進主線

  // 天條 8：失敗版本「不能消失」
  graveyardRequired: true, // 淘汰版本進 /graveyard

  // 天條 9：探索成本要被「顯性化」
  trackMetrics: {
    writeDuration: true, // 寫了多久
    testRuns: true, // 跑了幾次測試
    fixRounds: true, // 修了幾輪
  },
} as const;

// ============================================================================
// 🟪 終極天條（最高優先級）
// ============================================================================

export const ULTIMATE_LAW = {
  // 天條 10：「輸給別人」比「被罵」嚴重 10 倍
  disciplinePenalty: 1, // 被 supervisor 罵的權重
  rankingPenalty: 10, // 被 arena 打敗的權重

  // 這會讓 AI 開始找：
  // - 最短路徑
  // - CPU 友善解法
  // - 資料結構最省寫法
  // 而不是找「最安全不被罵」的寫法
} as const;

// ============================================================================
// Task Trace Schema
// ============================================================================

export interface TaskTrace {
  taskName: string;
  startTime: number;
  attempts: number;
  failed: number;
  versions: VersionRecord[];
  currentRank?: number;
  totalCandidates?: number;
}

export interface VersionRecord {
  name: string;
  createdAt: number;
  lines: number;
  avgRuntimeMs?: number;
  testsPassed: boolean;
  eliminated: boolean;
  eliminationReason?: string;
  writeDurationMs: number;
  testRuns: number;
  fixRounds: number;
}

// ============================================================================
// Validation Result
// ============================================================================

export interface MidLawViolation {
  law: number;
  severity: 'warning' | 'error' | 'fatal';
  message: string;
  penalty: number;
}

export interface MidLawCheckResult {
  passed: boolean;
  violations: MidLawViolation[];
  totalPenalty: number;
  recommendations: string[];
}
