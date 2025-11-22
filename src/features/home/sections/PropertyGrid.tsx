import React from 'react'

type Review = {
  avatar: string
  name: string
  role: string
  tag: string
  text: string
}

type Property = {
  id: number
  image: string
  badge: string
  title: string
  tags: string[]
  price: string
  location: string
  reviews: Review[]
}

const PROPERTIES: Property[] = [
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
]

export default function PropertyGrid() {
  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="flex items-center gap-2.5 my-[18px] mb-3" aria-label="智能房源推薦">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#E6EDF7] rounded-full bg-gradient-to-b from-white to-[#F6F9FF] text-[#00385a] font-black text-sm tracking-[0.2px]">
          <span className="w-[18px] h-[18px] rounded-md grid place-items-center bg-gradient-to-b from-[#00385a] to-[#004E7C] text-white text-xs font-black shadow-[0_2px_6px_rgba(0,56,90,0.18)]">
            ★
          </span>
          <span className="leading-none text-base md:text-lg md:font-bold">〔智能房源推薦〕</span>
          <span className="ml-1.5 text-sm text-[#6C7B91] font-bold">依瀏覽行為與社區口碑輔助排序</span>
        </div>
        <div 
          className="h-1.5 rounded-full flex-1 bg-gradient-to-r from-[#00385a] via-[#004E7C] to-[#7EA5FF] bg-[length:200%_100%] opacity-25 ml-2.5 animate-[mhRecoBar_6s_linear_infinite]" 
          aria-hidden="true"
        />
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 lg:grid-cols-3" aria-label="房源清單">
        {PROPERTIES.map((property) => (
          <article 
            key={property.id}
            className="bg-white border border-[#E6EDF7] rounded-2xl overflow-hidden relative transition-all duration-[180ms] ease-out shadow-none hover:shadow-[0_10px_26px_rgba(13,39,94,0.12)] hover:-translate-y-0.5 hover:border-[#1749d738] group isolate"
          >
            {/* Background Glow Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(60%_60%_at_80%_-10%,rgba(23,73,215,0.12),transparent_60%)] opacity-80" />

            {/* Cover Image */}
            <a href="#" className="block aspect-[4/3] bg-[#e9ecf5] relative overflow-hidden">
              <img 
                src={property.image} 
                alt="物件封面" 
                className="w-full h-full object-cover block transform scale-100 transition-transform duration-[600ms] cubic-bezier(0.2,0.65,0.2,1) group-hover:scale-105"
              />
              <span className="absolute left-2.5 top-2.5 bg-black/75 text-white text-xs font-extrabold px-2 py-1 rounded-full tracking-[0.2px] shadow-[0_4px_10px_rgba(0,0,0,0.18)]">
                {property.badge}
              </span>
            </a>

            {/* Body */}
            <div className="p-3 pb-3.5">
              <div className="font-extrabold text-base leading-[1.35] my-0.5 mb-2 tracking-[0.3px] text-[#0A2246] lg:text-[21px]">
                {property.title}
              </div>
              
              <div className="flex flex-wrap gap-2 items-center text-[#6C7B91] text-[13px] mb-1.5">
                {property.tags.map((tag, i) => (
                  <span 
                    key={i}
                    className="px-2.5 py-0.5 rounded-full bg-[#F6F9FF] border border-[#E6EDF7] font-extrabold text-[#2A2F3A] transition-all duration-120 ease-out group-hover:-translate-y-px group-hover:shadow-[0_4px_10px_rgba(0,56,90,0.10)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="text-[19px] font-black text-[#111] my-2 mb-1 tracking-[0.2px]">
                NT$ {property.price} 萬
              </div>
              <div className="text-[13px] text-[#6C7B91]">
                {property.location}
              </div>

              {/* Reviews Mini */}
              <div className="mt-2.5 px-3 py-2.5 border border-[#E6EDF7] rounded-xl bg-gradient-to-b from-[#F6F9FF] to-white">
                <div className="flex items-center gap-2 text-[13px] font-black mb-2 text-black/85 before:content-['★'] before:text-xs before:leading-none before:text-[#00385a] before:drop-shadow-[0_1px_0_rgba(0,56,90,0.12)]">
                  住戶真實留言
                </div>
                
                {property.reviews.map((review, i) => (
                  <div 
                    key={i} 
                    className={`flex gap-2.5 items-start py-2 ${i !== 0 ? 'border-t border-dashed border-black/10' : ''}`}
                  >
                    <div className="w-[30px] h-[30px] rounded-full grid place-items-center text-xs font-black bg-gradient-to-b from-[#F2F5F8] to-[#E1E6EB] text-[#00385a] flex-none shadow-[inset_0_0_0_1px_rgba(0,56,90,0.15)]">
                      {review.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 text-xs text-black/60">
                        <span className="font-black text-black/85">{review.name} · {review.role}</span>
                        <span className="w-1 h-1 rounded-full bg-black/20 inline-block" />
                        <span className="px-2 py-0.5 rounded-full bg-[#00385a]/10 text-[#00385a] font-black">
                          {review.tag}
                        </span>
                      </div>
                      <div className="text-[13px] leading-[1.6] text-black/85">
                        {review.text}
                      </div>
                    </div>
                  </div>
                ))}

                <button 
                  type="button"
                  className="mt-2.5 w-full px-3 py-2.5 rounded-xl border border-[#00385a]/30 bg-gradient-to-b from-white to-[#F5F7FA] cursor-pointer text-[13px] font-black text-[#00385a] transition-all duration-150 ease-out hover:from-white hover:to-[#E8F0FF] hover:shadow-[0_6px_14px_rgba(0,56,90,0.18)] active:translate-y-px"
                >
                  註冊後看更多評價
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      
      <style>{`
        @keyframes mhRecoBar {
          0% { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
}
