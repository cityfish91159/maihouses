import { AppData, Lead, Listing, FeedPost, Grade, LeadStatus } from './types/uag.types';

export const MOCK_DB: AppData = {
  user: { points: 1280, quota: { s: 2, a: 3 } },
  leads: [
    // 已購：只保留 S/A 四則
    { 
      id: 'S-5566', name: '買家 S-5566', grade: 'S', intent: 98, prop: '捷運宅', visit: 15, price: 20, status: 'purchased', 
      purchased_at: Date.now() - 2 * 3600000, ai: 'S 級熱度拉滿，請優先處理。', remainingHours: 118 
    },
    { 
      id: 'S-9011', name: '買家 S-9011', grade: 'S', intent: 93, prop: '高樓景觀宅', visit: 11, price: 20, status: 'purchased', 
      purchased_at: Date.now() - 6 * 3600000, ai: '已連續三天造訪同社區。', remainingHours: 114 
    },
    { 
      id: 'A-7788', name: '買家 A-7788', grade: 'A', intent: 79, prop: '學區房', visit: 6, price: 10, status: 'purchased', 
      purchased_at: Date.now() - 20 * 3600000, ai: 'A 級學區需求穩定。', remainingHours: 52 
    },
    { 
      id: 'A-6600', name: '買家 A-6600', grade: 'A', intent: 74, prop: '預售捷運宅', visit: 5, price: 10, status: 'purchased', 
      purchased_at: Date.now() - 10 * 3600000, ai: '適合搭配預售案一次推薦。', remainingHours: 62 
    },

    // 雷達：更多可購買的模擬圓點 (status = new)
    { id: 'B218', name: '買家 B218', grade: 'S', intent: 92, prop: '捷運共構 3 房', visit: 7, price: 20, status: 'new', ai: '🔥 強烈建議立即發送訊息！', x: 25, y: 25 },
    { id: 'A103', name: '買家 A103', grade: 'S', intent: 88, prop: '惠宇上晴 12F', visit: 12, price: 20, status: 'new', ai: '建議立即發送獨家邀約！', x: 15, y: 45 },
    { id: 'S901', name: '買家 S901', grade: 'S', intent: 94, prop: '高樓景觀宅', visit: 9, price: 20, status: 'new', ai: '重複詢問同一社區，請發送簡訊跟進。', x: 40, y: 32 },
    { id: 'S880', name: '買家 S880', grade: 'S', intent: 90, prop: '預售捷運宅', visit: 8, price: 20, status: 'new', ai: '對捷運沿線有強烈偏好。', x: 60, y: 40 },

    { id: 'C055', name: '買家 C055', grade: 'A', intent: 75, prop: '南屯學區宅', visit: 4, price: 10, status: 'new', ai: 'A 級學區需求明確。', x: 60, y: 20 },
    { id: 'A230', name: '買家 A230', grade: 'A', intent: 71, prop: '次高樓層 3 房', visit: 3, price: 10, status: 'new', ai: '已追蹤兩個以上相似物件。', x: 70, y: 30 },
    { id: 'A550', name: '買家 A550', grade: 'A', intent: 69, prop: '公園首排', visit: 3, price: 10, status: 'new', ai: '假日時段瀏覽頻繁。', x: 50, y: 15 },

    { id: 'D330', name: '買家 D330', grade: 'B', intent: 62, prop: '捷運生活圈', visit: 3, price: 3, status: 'new', ai: '建議發送訊息提供車位資訊。', x: 40, y: 60 },
    { id: 'B778', name: '買家 B778', grade: 'B', intent: 58, prop: '小坪數投資宅', visit: 2, price: 3, status: 'new', ai: '屬於投資族群，可搭配多案推薦。', x: 30, y: 70 },

    { id: 'C021', name: '買家 C021', grade: 'C', intent: 48, prop: '老屋翻新', visit: 2, price: 1, status: 'new', ai: '對低總價物件有興趣。', x: 75, y: 55 },
    { id: 'C990', name: '買家 C990', grade: 'C', intent: 42, prop: '套房', visit: 1, price: 1, status: 'new', ai: '瀏覽時間短，建議先以訊息觸及。', x: 82, y: 65 },

    { id: 'H009', name: '買家 H009', grade: 'F', intent: 28, prop: '小坪數', visit: 1, price: 0.5, status: 'new', ai: '潛在客戶。', x: 70, y: 75 },
    { id: 'F778', name: '買家 F778', grade: 'F', intent: 22, prop: '套房出租', visit: 1, price: 0.5, status: 'new', ai: '互動較少，可作為備選追蹤。', x: 55, y: 80 }
  ],
  listings: [
    { title: '惠宇上晴｜12/15F 視野戶・雙平車', tags: ['南屯區','近捷運','雙平車'], view: 1284, click: 214, fav: 37, thumbColor: '#eef2ff' },
    { title: '捷運共構 3 房｜視野棟距佳', tags: ['捷運共構','次高樓層'], view: 986, click: 163, fav: 22, thumbColor: '#f0fdf4' },
    { title: '南屯捷運宅｜3房・高樓層', tags: ['近學區','雙衛浴'], view: 846, click: 128, fav: 15, thumbColor: '#fff7ed' }
  ],
  feed: [
    { title: '成交故事｜12F 視野戶為什麼受歡迎', meta: '來自：社區牆・成交故事', body: '買方看重的是採光、棟距與公設使用率。' },
    { title: '住戶心得｜公設使用率與噪音表現', meta: '本週一・互動 41', body: '晚間 9 點後社區安靜。' }
  ]
};

