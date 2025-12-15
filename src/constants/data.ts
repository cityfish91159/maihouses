import React from 'react';
import { ScanEye, HandCoins, Phone, MessageSquareText, Landmark, KeyRound } from 'lucide-react';

export const HERO_STEPS = [
  {
    id: '01',
    title: '已電聯',
    desc: '紀錄談話內容',
    icon: Phone,
  },
  {
    id: '02',
    title: '已帶看',
    desc: '賞屋重點紀錄',
    icon: ScanEye,
  },
  {
    id: '03',
    title: '已出價',
    desc: '紀錄價格條件',
    icon: HandCoins,
  },
  {
    id: '04',
    title: '已斡旋',
    desc: '議價過程紀錄',
    icon: MessageSquareText,
  },
  {
    id: '05',
    title: '已成交',
    desc: '貸款相關事項',
    icon: Landmark,
  },
  {
    id: '06',
    title: '已交屋',
    desc: '確認圓滿交屋',
    icon: KeyRound,
  },
];

/**
 * P9-4: 備用評價資料 (Backup Reviews)
 * 
 * 當 API (/api/home/featured-reviews) 失敗時作為保底機制
 * 原名 COMMUNITY_REVIEWS，重命名以明確用途
 * 
 * @see src/features/home/sections/CommunityTeaser.tsx
 */
export const BACKUP_REVIEWS = [
  {
    id: 'J',
    name: 'J***｜景安和院 住戶',
    rating: 5,
    tags: ['#物業/管理'],
    content: '公設維護得乾淨，假日草皮有人整理。之前反映停車動線，管委會一週內就公告改善。',
    source: 'seed' as const,
    communityId: null
  },
  {
    id: 'W',
    name: 'W***｜松濤苑 住戶',
    rating: 4,
    tags: ['#噪音'],
    content: '住起來整體舒服，但臨路面向在上下班尖峰車聲明顯，喜靜者建議考慮中高樓層。',
    source: 'seed' as const,
    communityId: null
  },
  {
    id: 'L',
    name: 'L***｜遠揚柏悅 住戶',
    rating: 4,
    tags: ['#漏水/壁癌'],
    content: '頂樓排水設計不錯，颱風天沒有積水。不過垃圾車時間稍晚，偶爾有下水道味。',
    source: 'seed' as const,
    communityId: null
  },
  {
    id: 'A',
    name: 'A***｜華固名邸 住戶',
    rating: 5,
    tags: ['#物業/管理'],
    content: '管理員很負責，包裹收發與公告都有效率；電梯偶爾故障但維修速度快。',
    source: 'seed' as const,
    communityId: null
  },
  {
    id: 'H',
    name: 'H***｜寶輝花園廣場 住戶',
    rating: 3,
    tags: ['#停車/車位'],
    content: '地下室車位轉彎半徑偏小，新手要多注意；平日夜間社區整體很安靜。',
    source: 'seed' as const,
    communityId: null
  },
  {
    id: 'K',
    name: 'K***｜潤泰峰匯 住戶',
    rating: 4,
    tags: ['#採光/日照'],
    content: '採光好、通風佳，夏天不會太悶熱；但西曬戶下午還是會稍微熱一些。',
    source: 'seed' as const,
    communityId: null
  }
];

export const QUICK_QUESTIONS = ['3房以內', '30坪以下', '近捷運', '新成屋'];

export const PROPERTIES = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1600&auto=format&fit=crop',
    badge: '捷運 5 分鐘',
    title: '新板特區｜三房含車位，採光面中庭',
    tags: ['34.2 坪', '3 房 2 廳', '高樓層'],
    price: '1,288',
    location: '新北市板橋區 · 中山路一段',
    reviews: [
      {
        avatar: 'A',
        name: '王小姐',
        role: '3年住戶',
        tag: '管理到位',
        text: '管委反應快，公設打理乾淨，晚上也安靜好睡。',
      },
      {
        avatar: 'B',
        name: '林先生',
        role: '屋主',
        tag: '車位好停',
        text: '坡道寬、指示清楚，下班回家不太需要繞圈找位。',
      },
    ],
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1575517111478-7f6afd0973db?q=80&w=1600&auto=format&fit=crop',
    badge: '社區中庭',
    title: '松山民生社區｜邊間大兩房，採光佳',
    tags: ['28.6 坪', '2 房 2 廳', '可寵物'],
    price: '1,052',
    location: '台北市松山區 · 民生東路五段',
    reviews: [
      {
        avatar: 'C',
        name: '陳太太',
        role: '5年住戶',
        tag: '鄰里友善',
        text: '警衛熱心、包裹代收確實，社區群組很活躍。',
      },
      {
        avatar: 'D',
        name: '賴先生',
        role: '上班族',
        tag: '生活便利',
        text: '走路 3 分鐘有超市與市場，下班買菜很方便。',
      },
    ],
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?q=80&w=1600&auto=format&fit=crop',
    badge: '學區宅',
    title: '新店七張｜電梯二房，附機車位',
    tags: ['22.1 坪', '2 房 1 廳', '低公設比'],
    price: '838',
    location: '新北市新店區 · 北新路二段',
    reviews: [
      {
        avatar: 'E',
        name: '張小姐',
        role: '上班族',
        tag: '通勤方便',
        text: '步行到捷運七張站約 6 分鐘，雨天也有騎樓遮蔽。',
      },
      {
        avatar: 'F',
        name: '李先生',
        role: '家長',
        tag: '學區完整',
        text: '附近幼兒園到國中選擇多，放學接送動線順。',
      },
    ],
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1600&auto=format&fit=crop',
    badge: '河岸景觀',
    title: '大直美堤｜景觀三房，沁涼通風',
    tags: ['36.8 坪', '3 房 2 廳', '邊間'],
    price: '1,560',
    location: '台北市中山區 · 敦化北路',
    reviews: [
      {
        avatar: 'G',
        name: '蘇先生',
        role: '住戶',
        tag: '景觀佳',
        text: '客廳看河景很放鬆，夏天自然風就很涼。',
      },
      {
        avatar: 'H',
        name: '高小姐',
        role: '通勤族',
        tag: '交通便利',
        text: '離公車站 2 分鐘，轉乘捷運時間可控。',
      },
    ],
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1600&auto=format&fit=crop',
    badge: '社區花園',
    title: '內湖東湖｜雙面採光，小家庭首選',
    tags: ['27.4 坪', '2 房 2 廳', '含機車位'],
    price: '968',
    location: '台北市內湖區 · 康寧路三段',
    reviews: [
      {
        avatar: 'I',
        name: '許太太',
        role: '家長',
        tag: '公園多',
        text: '社區旁邊就有親子公園，假日散步很方便。',
      },
      {
        avatar: 'J',
        name: '黃先生',
        role: '工程師',
        tag: '環境安靜',
        text: '臨巷內，夜間車流少，對面鄰居素質也不錯。',
      },
    ],
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1600&auto=format&fit=crop',
    badge: '捷運生活圈',
    title: '中和橋和站｜採光兩房，低管理費',
    tags: ['24.9 坪', '2 房 1 廳', '社區新'],
    price: '898',
    location: '新北市中和區 · 中和路',
    reviews: [
      {
        avatar: 'K',
        name: '簡小姐',
        role: '新婚',
        tag: '費用透明',
        text: '管委會公告清楚，管理費與車位費用都公開透明。',
      },
      {
        avatar: 'L',
        name: '羅先生',
        role: '通勤族',
        tag: '通勤穩定',
        text: '尖峰等車可控，公車轉乘動線順，延誤較少。',
      },
    ],
  },
];
