/**
 * UAG Score - Claude v2 (精簡版)
 */

interface I { hasVerifiedOwner?: boolean; hasRealPhotos?: boolean; responseTimeHours?: number; reviewCount?: number; avgRating?: number; updateFrequency?: number; }
interface O { score: number; level: "S"|"A"|"B"|"C"|"F"; breakdown: { verification: number; quality: number; responsiveness: number; history: number; }; }

const n = (v: unknown, d: number): number => typeof v === "number" && Number.isFinite(v) ? v : d;
const lvl = (s: number): "S"|"A"|"B"|"C"|"F" => s >= 90 ? "S" : s >= 75 ? "A" : s >= 60 ? "B" : s >= 40 ? "C" : "F";

export function uagScore(input: unknown): O {
  if (!input || typeof input !== "object") return { score: 0, level: "F", breakdown: { verification: 0, quality: 0, responsiveness: 0, history: 0 } };
  const d = input as I;
  const verification = (d.hasVerifiedOwner === true ? 15 : 0) + (d.hasRealPhotos === true ? 15 : 0);
  const quality = Math.min(25, Math.floor(Math.max(0, Math.min(5, n(d.avgRating, 0))) * 5));
  const responsiveness = Math.max(0, Math.floor(25 - n(d.responseTimeHours, 999) * 2));
  const history = Math.min(20, Math.floor(Math.max(0, n(d.reviewCount, 0)) + Math.max(0, n(d.updateFrequency, 0)) * 2));
  const score = verification + quality + responsiveness + history;
  return { score, level: lvl(score), breakdown: { verification, quality, responsiveness, history } };
}
