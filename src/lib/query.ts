/**
 * 口語查詢解析 - 自由文本 → 結構化查詢
 * 用於首頁 AI 找房助理、搜尋框等
 */

export type Query = {
  city?: string
  dist?: string
  rooms?: number
  priceMax?: number // 單位：TWD
  priceMin?: number
  area?: number // 坪數
  nearMRT?: boolean
}

/**
 * 解析自由文本為結構化查詢
 * @example parseFreeText('台中西屯3房1500萬')
 */
export function parseFreeText(input: string): Query {
  const q: Query = {}
  const s = input.trim()

  // 城市／行政區
  if (s.includes('台中') || s.includes('臺中')) q.city = '台中市'
  if (s.includes('台北') || s.includes('臺北')) q.city = '台北市'
  if (s.includes('新北')) q.city = '新北市'
  
  if (s.includes('西屯')) q.dist = '西屯區'
  if (s.includes('北屯')) q.dist = '北屯區'
  if (s.includes('南屯')) q.dist = '南屯區'
  if (s.includes('中正')) q.dist = '中正區'
  if (s.includes('大安')) q.dist = '大安區'
  if (s.includes('信義')) q.dist = '信義區'

  // 房數（2房、3房、兩房、三房）
  const mRooms = s.match(/([0-9一二三四五兩]+)\s*房/)
  if (mRooms?.[1]) {
    const numMap: Record<string, number> = { 一: 1, 二: 2, 兩: 2, 三: 3, 四: 4, 五: 5 }
    q.rooms = numMap[mRooms[1]] ?? Number(mRooms[1])
  }

  // 金額（1500萬、1500萬元、15000000）
  const mWan = s.match(/([0-9]+)\s*萬/)
  if (mWan) {
    q.priceMax = Number(mWan[1]) * 10000
  } else {
    const mNum = s.match(/([1-9][0-9]{6,})/) // 7000000 以上視為 TWD
    if (mNum) q.priceMax = Number(mNum[1])
  }

  // 坪數
  const mArea = s.match(/([0-9]+)\s*坪/)
  if (mArea) q.area = Number(mArea[1])

  // 捷運
  if (s.includes('近捷運') || s.includes('捷運站')) q.nearMRT = true

  return q
}
