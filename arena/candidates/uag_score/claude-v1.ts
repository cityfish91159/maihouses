/**
 * UAG Score - Claude v1 (按規格實作)
 *
 * 規格：
 * - verification: hasVerifiedOwner +15, hasRealPhotos +15 (max 30)
 * - quality: avgRating * 5 (max 25)
 * - responsiveness: max(0, 25 - responseTimeHours * 2) (max 25)
 * - history: min(20, reviewCount + updateFrequency * 2) (max 20)
 */

interface UAGInput {
  hasVerifiedOwner?: boolean;
  hasRealPhotos?: boolean;
  hasPriceHistory?: boolean;
  responseTimeHours?: number;
  reviewCount?: number;
  avgRating?: number;
  listingAgeDays?: number;
  updateFrequency?: number;
}

interface UAGOutput {
  score: number;
  level: "S" | "A" | "B" | "C" | "F";
  breakdown: {
    verification: number;
    quality: number;
    responsiveness: number;
    history: number;
  };
}

function safeNum(v: unknown, fallback: number): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return fallback;
  return v;
}

export function uagScore(input: unknown): UAGOutput {
  const empty: UAGOutput = {
    score: 0,
    level: "F",
    breakdown: { verification: 0, quality: 0, responsiveness: 0, history: 0 },
  };

  if (!input || typeof input !== "object") return empty;

  const d = input as UAGInput;

  // verification: hasVerifiedOwner +15, hasRealPhotos +15
  const verification =
    (d.hasVerifiedOwner === true ? 15 : 0) +
    (d.hasRealPhotos === true ? 15 : 0);

  // quality: avgRating * 5 (max 25)
  const rating = Math.max(0, Math.min(5, safeNum(d.avgRating, 0)));
  const quality = Math.min(25, Math.floor(rating * 5));

  // responsiveness: max(0, 25 - responseTimeHours * 2)
  const hours = safeNum(d.responseTimeHours, 999);
  const responsiveness = Math.max(0, Math.floor(25 - hours * 2));

  // history: min(20, reviewCount + updateFrequency * 2)
  const reviews = Math.max(0, safeNum(d.reviewCount, 0));
  const freq = Math.max(0, safeNum(d.updateFrequency, 0));
  const history = Math.min(20, Math.floor(reviews + freq * 2));

  const score = verification + quality + responsiveness + history;

  let level: "S" | "A" | "B" | "C" | "F";
  if (score >= 90) level = "S";
  else if (score >= 75) level = "A";
  else if (score >= 60) level = "B";
  else if (score >= 40) level = "C";
  else level = "F";

  return {
    score,
    level,
    breakdown: { verification, quality, responsiveness, history },
  };
}
