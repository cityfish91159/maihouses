import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Phone, MessageCircle, Calendar, MapPin, Home, ChevronLeft, ChevronRight, Share2, ExternalLink } from 'lucide-react';
import { notify } from '../../lib/notify';
import { PropertyReportData, HIGHLIGHT_OPTIONS } from './types';

// 預設報告資料
const DEFAULT_REPORT_DATA: PropertyReportData = {
  id: 'demo',
  publicId: 'MH-100001',
  title: '信義區101景觀全新裝潢大三房',
  price: 3680,
  address: '台北市信義區松仁路100號',
  description: '絕佳地段，近捷運象山站，生活機能完善，採光通風佳。',
  images: [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800',
  ],
  size: 45.2,
  age: 8,
  rooms: 3,
  halls: 2,
  bathrooms: 2,
  floorCurrent: '12',
  floorTotal: 15,
  propertyType: '大樓',
  direction: '朝南',
  parking: '平面車位',
  communityName: '信義之星',
  communityYear: 2016,
  communityUnits: 420,
  managementFee: 80,
  advantage1: '採光超棒，全日照無遮蔽',
  advantage2: '管委會運作良好，公設維護佳',
  disadvantage: '西曬需加裝窗簾',
  agent: {
    id: 'agent-1',
    name: '王小明',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200',
    company: '邁房子信義店',
    phone: '0912-345-678',
    lineId: '@maihouses',
    trustScore: 92,
    reviewCount: 156,
    experience: 10
  }
};

// 計算月付金額
function calculateMonthlyPayment(price: number, loanRatio = 0.8, years = 30, rate = 0.02): number {
  const principal = price * 10000 * loanRatio;
  const monthlyRate = rate / 12;
  const numPayments = years * 12;
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  return Math.round(payment);
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [property, setProperty] = useState<PropertyReportData>(DEFAULT_REPORT_DATA);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 從 URL 取得參數
  const agentId = searchParams.get('aid');
  const source = searchParams.get('src') || 'direct';
  const highlights = searchParams.get('h')?.split(',') || ['commute', 'school', 'community'];

  useEffect(() => {
    // 記錄報告瀏覽
    const trackView = async () => {
      try {
        await fetch('/api/report/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportId: id,
            agentId,
            source,
            userAgent: navigator.userAgent
          })
        });
      } catch (e) {
        console.log('Track failed:', e);
      }
    };

    // 載入報告資料
    const loadReport = async () => {
      setIsLoading(true);
      try {
        // TODO: 從 API 載入真實資料
        // const res = await fetch(`/api/report/${id}`);
        // const data = await res.json();
        // setProperty(data.property);
        // setViewCount(data.viewCount);
        
        // 目前使用預設資料
        await new Promise(r => setTimeout(r, 300));
        setProperty(DEFAULT_REPORT_DATA);
        setViewCount(Math.floor(Math.random() * 20) + 5);
      } catch (e) {
        console.error('Load report failed:', e);
      } finally {
        setIsLoading(false);
      }
    };

    trackView();
    loadReport();
  }, [id, agentId, source]);

  // 取得選中的亮點
  const selectedHighlights = HIGHLIGHT_OPTIONS.filter(h => highlights.includes(h.id));

  // 月付試算
  const monthlyPayment = calculateMonthlyPayment(property.price);

  // 分享功能
  const handleShare = async () => {
    const url = window.location.href;
    const text = `${property.title} - NT$${property.price}萬`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: text, url });
      } catch (e) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(url);
      notify.success('連結已複製', '已複製報告連結，可直接分享');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">載入報告中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ① Hero 區 - 主圖輪播 */}
      <section className="relative">
        <div className="aspect-[4/3] bg-slate-200 overflow-hidden">
          <img 
            src={property.images[currentImageIndex]} 
            alt={property.title}
            className="w-full h-full object-cover"
          />
          
          {/* 圖片導航 */}
          {property.images.length > 1 && (
            <>
              <button 
                onClick={() => setCurrentImageIndex(i => i > 0 ? i - 1 : property.images.length - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={() => setCurrentImageIndex(i => i < property.images.length - 1 ? i + 1 : 0)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition"
              >
                <ChevronRight size={24} />
              </button>
              
              {/* 圖片指示器 */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {property.images.map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`w-2 h-2 rounded-full transition ${i === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* 品牌浮水印 */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-sm font-bold text-[#003366] flex items-center gap-1.5">
            <Home size={14} />
            邁房子
          </div>
        </div>
      </section>

      {/* ② 價格 + 地址 */}
      <section className="bg-white px-4 py-5 border-b border-slate-100">
        <div className="text-3xl font-black text-[#003366] mb-1">
          NT$ {property.price.toLocaleString()} 萬
        </div>
        <h1 className="text-lg font-bold text-slate-800 mb-2">{property.title}</h1>
        <div className="flex items-center text-slate-500 text-sm">
          <MapPin size={14} className="mr-1" />
          {property.address}
        </div>
      </section>

      {/* ③ 核心規格條 */}
      <section className="bg-white px-4 py-4 border-b border-slate-100">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-50 rounded-xl py-3">
            <div className="text-lg font-bold text-slate-800">{property.rooms}房{property.halls}廳{property.bathrooms}衛</div>
            <div className="text-xs text-slate-500">格局</div>
          </div>
          <div className="bg-slate-50 rounded-xl py-3">
            <div className="text-lg font-bold text-slate-800">{property.size} 坪</div>
            <div className="text-xs text-slate-500">權狀坪數</div>
          </div>
          <div className="bg-slate-50 rounded-xl py-3">
            <div className="text-lg font-bold text-slate-800">{property.age} 年</div>
            <div className="text-xs text-slate-500">屋齡</div>
          </div>
          <div className="bg-slate-50 rounded-xl py-3">
            <div className="text-lg font-bold text-slate-800">{property.floorCurrent}/{property.floorTotal}F</div>
            <div className="text-xs text-slate-500">樓層</div>
          </div>
          <div className="bg-slate-50 rounded-xl py-3">
            <div className="text-lg font-bold text-slate-800">{property.direction}</div>
            <div className="text-xs text-slate-500">座向</div>
          </div>
          <div className="bg-slate-50 rounded-xl py-3">
            <div className="text-lg font-bold text-slate-800">{property.parking || '無'}</div>
            <div className="text-xs text-slate-500">車位</div>
          </div>
        </div>
      </section>

      {/* ④ 月付試算 */}
      <section className="bg-white px-4 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          💰 月付試算
        </h2>
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-600">貸款 8 成・30 年期</span>
            <span className="text-xs text-slate-400">利率 2%</span>
          </div>
          <div className="text-2xl font-black text-[#003366]">
            月付約 NT$ {monthlyPayment.toLocaleString()}
          </div>
        </div>
      </section>

      {/* ⑤ 精選亮點 */}
      <section className="bg-white px-4 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          ⭐ 為您精選的亮點
        </h2>
        <div className="space-y-3">
          {selectedHighlights.map(h => (
            <div key={h.id} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
              <span className="text-2xl">{h.icon}</span>
              <div>
                <div className="font-bold text-slate-800">{h.title}</div>
                <div className="text-sm text-slate-500">{h.description}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ⑥ 社區資訊 */}
      {property.communityName && (
        <section className="bg-white px-4 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            🏢 社區資訊
          </h2>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">社區名稱</span>
              <span className="font-medium text-slate-800">{property.communityName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">完工年份</span>
              <span className="font-medium text-slate-800">{property.communityYear} 年</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">總戶數</span>
              <span className="font-medium text-slate-800">{property.communityUnits} 戶</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">管理費</span>
              <span className="font-medium text-slate-800">{property.managementFee} 元/坪</span>
            </div>
          </div>
        </section>
      )}

      {/* ⑦ 更多照片 */}
      {property.images.length > 1 && (
        <section className="bg-white px-4 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            📸 更多照片
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {property.images.slice(0, 6).map((img, i) => (
              <button 
                key={i}
                onClick={() => setCurrentImageIndex(i)}
                className="aspect-square rounded-lg overflow-hidden bg-slate-100"
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ⑧ 經紀人小卡 */}
      <section className="bg-white px-4 py-5 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          👤 您的專屬顧問
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <img 
            src={property.agent.avatarUrl} 
            alt={property.agent.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-slate-100"
          />
          <div className="flex-1">
            <div className="font-bold text-lg text-slate-800">{property.agent.name}</div>
            <div className="text-sm text-slate-500">{property.agent.company}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-amber-500">⭐ {(property.agent.trustScore! / 20).toFixed(1)}</span>
              <span className="text-xs text-slate-400">({property.agent.reviewCount} 則評價)</span>
              {property.agent.experience && (
                <span className="text-xs text-slate-400">・{property.agent.experience}年經驗</span>
              )}
            </div>
          </div>
        </div>
        
        {/* CTA 按鈕 */}
        <div className="space-y-3">
          <a 
            href={`tel:${property.agent.phone}`}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded-xl transition"
          >
            <Phone size={18} />
            立即撥打 {property.agent.phone}
          </a>
          <a 
            href={`https://line.me/R/ti/p/${property.agent.lineId}`}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#06C755] hover:bg-[#05a847] text-white font-bold rounded-xl transition"
          >
            <MessageCircle size={18} />
            LINE 諮詢
          </a>
          <button 
            className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl transition"
          >
            <Calendar size={18} />
            預約看屋
          </button>
        </div>
      </section>

      {/* ⑨ Footer */}
      <section className="bg-slate-100 px-4 py-6 text-center">
        <div className="flex items-center justify-center gap-2 text-[#003366] font-bold mb-2">
          <Home size={18} />
          MaiHouses 邁房子
        </div>
        <div className="text-sm text-slate-500 mb-3">讓家，不只是地址</div>
        
        {viewCount > 0 && (
          <div className="text-xs text-slate-400 mb-2">
            📊 此報告已被瀏覽 {viewCount} 次
          </div>
        )}
        
        <div className="text-xs text-slate-400">
          報告生成：{new Date().toLocaleDateString('zh-TW')}
        </div>
        
        {/* 分享按鈕 */}
        <button 
          onClick={handleShare}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-600 hover:bg-slate-50 transition"
        >
          <Share2 size={14} />
          分享此報告
        </button>
        
        {/* 查看完整詳情 */}
        <a 
          href={`/maihouses/property/${property.publicId}?aid=${agentId || ''}&src=report`}
          className="mt-3 flex items-center justify-center gap-1 text-sm text-[#003366] hover:underline"
        >
          查看完整物件詳情
          <ExternalLink size={14} />
        </a>
      </section>
    </div>
  );
}
