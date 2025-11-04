import type { PropertyCard, ReviewSnippet, CommunityPreview } from '../../types'

let seed = 97
const rnd = () => ((seed = ((seed * 9301 + 49297) % 233280) / 233280))

const COMM = ['惠宇上晴', '單元二新苑', '水湳青庭', '七期晶華', '北屯新苑', '西屯國際']
const LOC = ['台中西屯', '台中北屯', '台中南屯', '台中西區', '台中北區', '台中南區']
const HL = ['雙車位', '採光佳', '邊間', '屋況佳', '近公園', '24H管理', '格局方正']
const AU = ['住戶A', '住戶B', '住戶C', '準住戶D', '住戶E']
const TX = ['管理嚴謹', '機能方便', '中庭維護佳', '車位好停', '生活圈便利']

const hash32 = (s: string) => {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = (h * 16777619) >>> 0
  }
  return h
}

export const reseed = (k: number) => {
  seed = (k % 233279) + 1
}

export const makeReview = (i: number): ReviewSnippet => ({
  id: `r${i}`,
  authorMask: AU[i % AU.length],
  content: TX[Math.floor(rnd() * TX.length)],
  ts: new Date(Date.now() - i * 36e5).toISOString()
})

export function makeProperty(i: number): PropertyCard {
  const cname = COMM[i % COMM.length]
  const highlights = [HL[Math.floor(rnd() * HL.length)], HL[Math.floor(rnd() * HL.length)]]
  return {
    id: `p${i}`,
    title: `${cname} 景觀${(i % 3) + 2}房`,
    price: 1500 + Math.floor(rnd() * 2000),
    communityId: `c${i % COMM.length}`,
    communityName: cname,
    cover: `https://picsum.photos/seed/mai-${i}/800/450`,
    highlights,
    reviewsTop2: [makeReview(i * 2), makeReview(i * 2 + 1)]
  }
}

export function makeCommunity(i: number): CommunityPreview {
  return {
    id: `c${i}`,
    name: COMM[i % COMM.length],
    cover: `https://picsum.photos/seed/comm-${i}/600/300`,
    score: 4.0 + Math.floor(rnd() * 10) / 10,
    reviewCount: 10 + Math.floor(rnd() * 90),
    location: LOC[i % LOC.length]
  }
}

export const makeProperties = (n = 24) => Array.from({ length: n }, (_, i) => makeProperty(i + 1))
export const makeCommunities = (n = 6) => Array.from({ length: n }, (_, i) => makeCommunity(i))

export const makePropertiesDeterministic = (key: string, n = 24) => {
  reseed(hash32(key))
  return makeProperties(n)
}
