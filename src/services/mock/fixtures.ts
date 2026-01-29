import type { PropertyCard, ReviewSnippet, CommunityPreview } from '../../types';

let seed = 97;
const rnd = () => (seed = ((seed * 9301 + 49297) % 233280) / 233280);

const COMM = ['惠宇上晴', '單元二新苑', '水湳青庭', '七期晶華', '北屯新苑', '西屯國際'];
const LOC = ['台中西屯', '台中北屯', '台中南屯', '台中西區', '台中北區', '台中南區'];
const HL = ['雙車位', '採光佳', '邊間', '屋況佳', '近公園', '24H管理', '格局方正'];
const AU = ['住戶A', '住戶B', '住戶C', '準住戶D', '住戶E'];
const TX = ['管理嚴謹', '機能方便', '中庭維護佳', '車位好停', '生活圈便利'];

const hash32 = (s: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.codePointAt(i) ?? 0;
    h = (h * 16777619) >>> 0;
  }
  return h;
};

export const reseed = (k: number) => {
  seed = (k % 233279) + 1;
};

export const makeReview = (i: number): ReviewSnippet => ({
  id: `r${i}`,
  authorMask: AU[i % AU.length] ?? '',
  content: TX[Math.floor(rnd() * TX.length)] ?? '',
  ts: new Date(Date.now() - i * 36e5).toISOString(),
});

export function makeProperty(i: number): PropertyCard {
  const cname = COMM[i % COMM.length] ?? '';
  const highlights = [
    HL[Math.floor(rnd() * HL.length)] ?? '',
    HL[Math.floor(rnd() * HL.length)] ?? '',
  ].filter(Boolean);
  return {
    id: `p${i}`,
    title: `${cname} 景觀${(i % 3) + 2}房`,
    price: 1500 + Math.floor(rnd() * 2000),
    communityId: `c${i % COMM.length}`,
    communityName: cname,
    cover: `https://picsum.photos/seed/mai-${i}/800/450`,
    highlights,
    reviewsTop2: [makeReview(i * 2), makeReview(i * 2 + 1)],
  };
}

export function makeCommunity(i: number): CommunityPreview {
  return {
    id: `c${i}`,
    name: COMM[i % COMM.length] ?? '',
    cover: `https://picsum.photos/seed/comm-${i}/600/300`,
    score: 4 + Math.floor(rnd() * 10) / 10,
    reviewCount: 10 + Math.floor(rnd() * 90),
    location: LOC[i % LOC.length] ?? '',
  };
}

export const makeProperties = (n = 24) => Array.from({ length: n }, (_, i) => makeProperty(i + 1));
export const makeCommunities = (n = 6) => Array.from({ length: n }, (_, i) => makeCommunity(i));

export const makePropertiesDeterministic = (key: string, n = 24) => {
  reseed(hash32(key));
  return makeProperties(n);
};

// ====== 固定社區評價（社區牆六則） ======
// 社區：惠宇上晴（c0）
// 來源：MVP 靜態頁面 community_wall_MVP_green_tags.html
// 只保留必要欄位（未加 rating / tags，可日後擴充型別）
export const COMMUNITY_REVIEWS: Record<string, ReviewSnippet[]> = {
  c0: [
    {
      id: 'c0r1',
      authorMask: 'J***',
      content: '公設維護得乾淨，假日草皮有人整理。之前反映停車動線，管委會一週內就公告改善。',
      ts: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: 'c0r2',
      authorMask: 'W***',
      content: '住起來整體舒服，但面向上路的低樓層在上下班尖峰車聲明顯，喜靜的買家可考慮中高樓層。',
      ts: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
    {
      id: 'c0r3',
      authorMask: 'L***',
      content: '頂樓排水設計不錯，颱風天也沒有積水問題。不過垃圾車時間稍晚，家裡偶爾會有下水道味。',
      ts: new Date(Date.now() - 6 * 3600000).toISOString(),
    },
    // 另外三則（原頁面隱藏）自擬內容，提供更完整測試資料
    {
      id: 'c0r4',
      authorMask: 'H***',
      content: '晚間公共照明足夠，走廊不陰暗。建議之後能更新健身房幾台老舊器材。',
      ts: new Date(Date.now() - 8 * 3600000).toISOString(),
    },
    {
      id: 'c0r5',
      authorMask: 'A***',
      content: '垃圾分類與回收管理還不錯，管理員態度親切。有時收包裹要稍等，但整體效率可以接受。',
      ts: new Date(Date.now() - 10 * 3600000).toISOString(),
    },
    {
      id: 'c0r6',
      authorMask: 'K***',
      content: '車道轉彎半徑偏小，新手第一次會緊張；不過停車場指示標示清楚，熟悉後就順手。',
      ts: new Date(Date.now() - 12 * 3600000).toISOString(),
    },
  ],
};
