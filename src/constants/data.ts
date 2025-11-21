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

export const COMMUNITY_REVIEWS = [
  {
    id: 'J',
    name: 'J***｜景安和院 住戶',
    rating: 5,
    tags: ['#物業/管理'],
    content: '公設維護得乾淨，假日草皮有人整理。之前反映停車動線，管委會一週內就公告改善。'
  },
  {
    id: 'W',
    name: 'W***｜松濤苑 住戶',
    rating: 4,
    tags: ['#噪音'],
    content: '住起來整體舒服，但臨路面向在上下班尖峰車聲明顯，喜靜者建議考慮中高樓層。'
  },
  {
    id: 'L',
    name: 'L***｜遠揚柏悅 住戶',
    rating: 4,
    tags: ['#漏水/壁癌'],
    content: '頂樓排水設計不錯，颱風天沒有積水。不過垃圾車時間稍晚，偶爾有下水道味。'
  },
  {
    id: 'A',
    name: 'A***｜華固名邸 住戶',
    rating: 5,
    tags: ['#物業/管理'],
    content: '管理員很負責，包裹收發與公告都有效率；電梯偶爾故障但維修速度快。'
  },
  {
    id: 'H',
    name: 'H***｜寶輝花園廣場 住戶',
    rating: 3,
    tags: ['#停車/車位'],
    content: '地下室車位轉彎半徑偏小，新手要多注意；平日夜間社區整體很安靜。'
  },
  {
    id: 'K',
    name: 'K***｜潤泰峰匯 住戶',
    rating: 4,
    tags: ['#採光/日照'],
    content: '採光好、通風佳，夏天不會太悶熱；但西曬戶下午還是會稍微熱一些。'
  }
];

export const QUICK_QUESTIONS = ['3房以內', '30坪以下', '近捷運', '新成屋'];
