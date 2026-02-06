/**
 * Property Page Mock Data
 *
 * ⚠️ SSOT 警告：此檔案內容必須與 public/data/seed-property-page.json 保持同步！
 *
 * 為了首屏 0ms 載入，保留 JS 物件形式（瀏覽器直接解析）
 * 後端 API 失敗時也會使用 seed-property-page.json 作為 fallback
 *
 * @see public/data/seed-property-page.json - 單一真理來源
 * @see api/property/page-data.ts - 後端聚合 API
 */
export const propertyMockData = {
  default: {
    featured: {
      main: {
        badge: '熱門社區',
        image:
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1260&auto=format&fit=crop',
        title: '新光晴川 B棟 12樓',
        location: '📍 板橋區・江子翠生活圈',
        details: [
          '3房2廳2衛 + 平面車位・室內 23坪 / 主建物 26坪',
          '🏢 2020年完工・7棟・420戶',
          '👥 自住85%・首購換屋族群',
          '🚗 平面車位為主(好停)',
          '💰 管理費約 80元/坪',
        ],
        highlights: '🏪 5分鐘全聯・10分鐘捷運',
        rating: '4.4 分(63 則評價)',
        reviews: [
          {
            stars: '★★★★★',
            author: 'M*** ・ B棟住戶',
            tags: ['#物業/管理', '#安靜'],
            content: '晚上社區很安靜,附近河堤散步很舒服。管理室態度親切,包裹代收很方便。',
          },
          {
            stars: '★★★★☆',
            author: 'L*** ・ 12F住戶',
            tags: ['#採光佳', '#交通便利'],
            content: '中庭空間大,適合帶小孩放風。垃圾集中處理很乾淨。',
          },
        ],
        lockCount: 61,
        price: '1,050 萬',
        size: '約 23 坪',
      },
      sideTop: {
        badge: '高評價',
        image:
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop',
        title: '遠雄新未來',
        location: '📍 中和區・中和環球購物中心',
        details: ['2房2廳1衛・室內 18坪', '🏢 2019年完工・384戶', '👥 自住90%・首購族群'],
        rating: '4.5 分(78 則評價)',
        reviews: [
          {
            stars: '★★★★★',
            author: 'C***',
            content: '樓下就是環球購物中心,生活超方便!',
          },
          {
            stars: '★★★★☆',
            author: 'P***',
            content: '捷運中和新蘆線,通勤族首選。',
          },
        ],
        lockCount: 76,
        price: '880 萬',
        size: '約 18 坪',
      },
      sideBottom: {
        badge: '新上架',
        image:
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop',
        title: '國家大苑',
        location: '📍 永和區・永安市場商圈',
        details: ['3房2廳2衛・室內 28坪', '🏢 2018年完工・256戶', '👥 自住82%・換屋族群'],
        rating: '4.3 分(52 則評價)',
        reviews: [
          {
            stars: '★★★★★',
            author: 'F***',
            content: '永安市場站走路3分鐘,超方便!',
          },
          {
            stars: '★★★★☆',
            author: 'Y***',
            content: '社區管理好,樓下市場生活機能佳。',
          },
        ],
        lockCount: 50,
        price: '1,280 萬',
        size: '約 28 坪',
      },
    },
    listings: [
      {
        image:
          'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&auto=format&fit=crop',
        title: '冠德美麗大直・中山區',
        tag: '捷運劍南路站',
        price: '4 房 3,980 萬',
        size: '約 45 坪',
        rating: '4.5 分(92 則評價)・豪宅精選',
        reviews: [
          {
            badge: '內湖區第1名',
            content: '「社區環境優美,管理嚴謹,中庭花園很棒。」— J***',
          },
          {
            badge: '影片房源',
            content: '「交通便利,距離捷運劍南路站步行約 5 分鐘。」— K***',
          },
        ],
        note: '近美麗華商圈・適合高階主管家庭,生活品質佳。',
        lockLabel: '豪宅住戶真實評價',
        lockCount: 90,
      },
      {
        image:
          'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&auto=format&fit=crop',
        title: '日勝幸福・三重區',
        tag: '機捷 A2',
        price: '2 房 750 萬',
        size: '約 18 坪',
        rating: '4.0 分(58 則評價)・首購族最愛',
        reviews: [
          {
            badge: '影片房源',
            content: '「空間設計實用,適合小家庭,傢俱也不錯。」— A***',
          },
          {
            badge: '三重區第1名',
            content: '「走路就到機捷站,去機場很方便。」— G***',
          },
        ],
        note: '建議留意樓層高度,低樓層可能會有噪音問題。',
        lockLabel: '首購族完整評價',
        lockCount: 56,
      },
      {
        image:
          'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=600&auto=format&fit=crop',
        title: '文心大和・中正區',
        tag: '信義計畫區',
        price: '2 房 980 萬',
        size: '約 21 坪',
        rating: '4.3 分(47 則評價)・收租比例略高',
        reviews: [
          {
            badge: '中正區第1名',
            content: '「下樓有商場,生活很方便,購物用餐都方便。」— D***',
          },
          {
            badge: '影片房源',
            content: '「假日人潮多,喜歡熱鬧的人會喜歡。」— S***',
          },
        ],
        note: '可選包租管理・投報率與空租期需再評估。',
        lockLabel: '收租族完整心得',
        lockCount: 45,
      },
      {
        image:
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop',
        title: '合環青田・新莊區',
        tag: '副都心生活圈',
        price: '3 房 1,180 萬',
        size: '約 28 坪',
        rating: '4.2 分(35 則評價)・首購 / 換屋混合',
        reviews: [
          {
            badge: '影片房源',
            content: '「大廳氣派但不浮誇,親友來訪印象好。」— N***',
          },
          {
            badge: '新莊區第1名',
            content: '「機能逐漸成熟中,未來看好,發展潛力大。」— R***',
          },
        ],
        note: '有少量店面戶・需留意樓下使用型態。',
        lockLabel: '換屋族完整評價',
        lockCount: 33,
      },
      {
        image:
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&auto=format&fit=crop',
        title: '世界花園・蘆洲區',
        tag: '捷運蘆洲站',
        price: '2 房 880 萬',
        size: '約 20 坪',
        rating: '3.9 分(29 則評價)・交通便利',
        reviews: [
          {
            badge: '影片房源',
            content: '「走路就到捷運,通勤很省時間,上下班方便。」— T***',
          },
          {
            badge: '蘆洲區第1名',
            content: '「附近機車多,晚上會有一點吵,建議選高樓層。」— B***',
          },
        ],
        note: '低樓層面馬路需留意噪音,高樓層相對安靜。',
        lockLabel: '更多通勤與噪音心得',
        lockCount: 27,
      },
      {
        image:
          'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&auto=format&fit=crop',
        title: '遠雄大未來・汐止區',
        tag: '東湖生活圈',
        price: '3 房 1,350 萬',
        size: '約 28 坪',
        rating: '4.1 分(44 則評價)・通勤族首選',
        reviews: [
          {
            badge: '影片房源',
            content: '「台鐵汐科站走路 8 分鐘,很方便,適合通勤族。」— W***',
          },
          {
            badge: '汐止區第1名',
            content: '「社區管理不錯,住戶素質整齊,環境維護好。」— E***',
          },
        ],
        note: '近科學園區・適合上班族,週邊機能完善。',
        lockLabel: '通勤族完整評價',
        lockCount: 42,
      },
      {
        image:
          'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&auto=format&fit=crop',
        title: '興富發巨蛋・鼓山區',
        tag: '巨蛋商圈',
        price: '2 房 1,680 萬',
        size: '約 25 坪',
        rating: '4.4 分(51 則評價)・投資自住兩相宜',
        reviews: [
          {
            badge: '影片房源',
            content: '「巨蛋旁邊,看演唱會超方便,生活機能極佳。」— Q***',
          },
          {
            badge: '鼓山區第1名',
            content: '「捷運紅線,去哪裡都很快,交通非常便利。」— H***',
          },
        ],
        note: '緊鄰巨蛋商圈・生活機能極佳,房價抗跌。',
        lockLabel: '完整商圈分析',
        lockCount: 49,
      },
      {
        image:
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop',
        title: '華固新天地・內湖區',
        tag: '內湖科學園區',
        price: '3 房 2,180 萬',
        size: '約 32 坪',
        rating: '4.3 分(48 則評價)・科技人最愛',
        reviews: [
          {
            badge: '影片房源',
            content: '「走路上班,省下通勤時間和費用,工程師好選擇。」— X***',
          },
          {
            badge: '內湖區第1名',
            content: '「社區新穎,公設維護得很好,住起來舒適。」— V***',
          },
        ],
        note: '步行至園區・適合科技業,投報穩定。',
        lockLabel: '科技人置產心得',
        lockCount: 46,
      },
    ],
  },
  test: {
    featured: {
      main: {
        badge: '測試熱門',
        image:
          'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        title: '測試社區 A',
        location: '📍 台北市・信義區',
        details: ['3房2廳2衛・室內 30坪', '🏢 2023年完工・88戶', '👥 自住95%・高端客群'],
        highlights: '🏪 1分鐘捷運・5分鐘百貨',
        rating: '4.8 分(120 則評價)',
        reviews: [
          {
            stars: '★★★★★',
            author: 'T*** ・ A棟住戶',
            tags: ['#景觀佳', '#隱私高'],
            content: '高樓層視野非常好，可以看到101。隱私性做得很好。',
          },
          {
            stars: '★★★★☆',
            author: 'U*** ・ 8F住戶',
            tags: ['#公設豐富', '#管理好'],
            content: '泳池和健身房都很棒，物業管理非常專業。',
          },
        ],
        lockCount: 100,
        price: '5,800 萬',
        size: '約 30 坪',
      },
      sideTop: {
        badge: '測試好評',
        image:
          'https://images.pexels.com/photos/323775/pexels-photo-323775.jpeg?auto=compress&cs=tinysrgb&w=800',
        title: '測試社區 B',
        location: '📍 台中市・七期重劃區',
        details: ['4房2廳3衛・室內 50坪', '🏢 2020年完工・150戶', '👥 自住80%・企業主'],
        rating: '4.6 分(80 則評價)',
        reviews: [
          {
            stars: '★★★★★',
            author: 'V***',
            content: '歌劇院就在旁邊，藝文氣息濃厚。',
          },
          {
            stars: '★★★★☆',
            author: 'W***',
            content: '豪宅聚落，鄰居素質都很高。',
          },
        ],
        lockCount: 60,
        price: '3,500 萬',
        size: '約 50 坪',
      },
      sideBottom: {
        badge: '測試新案',
        image:
          'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800',
        title: '測試社區 C',
        location: '📍 高雄市・美術館特區',
        details: ['3房2廳2衛・室內 35坪', '🏢 2022年完工・200戶', '👥 自住90%・家庭客'],
        rating: '4.5 分(40 則評價)',
        reviews: [
          {
            stars: '★★★★★',
            author: 'X***',
            content: '美術館公園第一排，景觀無敵。',
          },
          {
            stars: '★★★★☆',
            author: 'Y***',
            content: '輕軌就在門口，交通很方便。',
          },
        ],
        lockCount: 30,
        price: '1,800 萬',
        size: '約 35 坪',
      },
    },
    listings: [
      {
        image:
          'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=600',
        title: '測試列表房源 1',
        tag: '測試標籤',
        price: '1,000 萬',
        size: '約 20 坪',
        rating: '4.0 分(10 則評價)・測試用',
        reviews: [
          { badge: '測試標章', content: '「這是一則測試評論。」— User1' },
          { badge: '測試標章', content: '「這是另一則測試評論。」— User2' },
        ],
        note: '這是一個測試房源。',
        lockLabel: '測試評價',
        lockCount: 10,
      },
    ],
  },
};

// 保留全域以支援舊版引用
if (typeof window !== 'undefined') {
  window.propertyMockData = propertyMockData;
}

export default propertyMockData;
