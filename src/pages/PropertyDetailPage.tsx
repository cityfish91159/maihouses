import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Home, Heart, Phone, MessageCircle, Hash, MapPin, ArrowLeft, Shield, Eye, Users, Calendar, Flame, Star, Lock, ChevronRight, CheckCircle } from 'lucide-react';
import { AgentTrustCard } from '../components/AgentTrustCard';
import { propertyService, DEFAULT_PROPERTY, PropertyData } from '../services/propertyService';
import { ContactModal } from '../components/ContactModal';

// UAG Tracker Hook v8.1 - 追蹤用戶行為 + S級攔截
// 優化: 1.修正district傳遞 2.S級即時回調 3.互動事件用fetch獲取等級
const usePropertyTracker = (
  propertyId: string, 
  agentId: string, 
  district: string,
  onGradeUpgrade?: (newGrade: string, reason?: string) => void
) => {
  const enterTime = useRef(Date.now());
  const actions = useRef({ click_photos: 0, click_line: 0, click_call: 0, scroll_depth: 0 });
  const hasSent = useRef(false);
  const currentGrade = useRef<string>('F');

  // 取得或建立 session_id
  const getSessionId = useCallback(() => {
    let sid = localStorage.getItem('uag_session');
    if (!sid) {
      sid = `u_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('uag_session', sid);
    }
    return sid;
  }, []);

  // 建構 payload
  const buildPayload = useCallback((eventType: string) => ({
    session_id: getSessionId(),
    agent_id: agentId,
    fingerprint: btoa(JSON.stringify({
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    })),
    event: {
      type: eventType,
      property_id: propertyId,
      district: district || 'unknown', // 修正: 使用傳入的 district
      duration: Math.round((Date.now() - enterTime.current) / 1000),
      actions: { ...actions.current },
      focus: []
    }
  }), [propertyId, agentId, district, getSessionId]);

  // 發送追蹤事件 (支援 S 級回調)
  const sendEvent = useCallback(async (eventType: string, useBeacon = false) => {
    const payload = buildPayload(eventType);

    // page_exit 或強制使用 beacon (確保離開頁面也能送出)
    if (useBeacon || eventType === 'page_exit') {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/uag-track', blob);
      return;
    }

    // 互動事件用 fetch，以便獲取等級回傳
    try {
      const res = await fetch('/api/uag-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true // 防止頁面切換時中斷
      });
      const data = await res.json();
      
      // 檢查是否升級到 S 級
      if (data.success && data.grade) {
        const gradeRank: Record<string, number> = { S: 5, A: 4, B: 3, C: 2, F: 1 };
        const newRank = gradeRank[data.grade] || 1;
        const oldRank = gradeRank[currentGrade.current] || 1;
        
        if (newRank > oldRank) {
          currentGrade.current = data.grade;
          // S 級即時通知 (含 reason)
          if (data.grade === 'S' && onGradeUpgrade) {
            onGradeUpgrade('S', data.reason);
          }
        }
      }
    } catch (e) {
      // 失敗時 fallback 到 beacon
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/uag-track', blob);
    }
  }, [buildPayload, onGradeUpgrade]);

  // 追蹤滾動深度
  useEffect(() => {
    const handleScroll = () => {
      const depth = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
      if (depth > actions.current.scroll_depth) {
        actions.current.scroll_depth = depth;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 初始化：發送 page_view，離開時發送 page_exit
  useEffect(() => {
    if (!propertyId) return;

    // 發送 page_view (用 beacon，不需等回應)
    sendEvent('page_view', true);

    // 離開頁面時發送 page_exit
    const handleUnload = () => {
      if (!hasSent.current) {
        hasSent.current = true;
        sendEvent('page_exit', true);
      }
    };

    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') handleUnload();
    });

    return () => {
      window.removeEventListener('pagehide', handleUnload);
      handleUnload();
    };
  }, [propertyId, sendEvent]);

  // 暴露追蹤方法
  return {
    trackPhotoClick: () => { actions.current.click_photos++; },
    trackLineClick: () => { actions.current.click_line = 1; sendEvent('click_line'); },
    trackCallClick: () => { actions.current.click_call = 1; sendEvent('click_call'); }
  };
};

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Mock: 固定未登入狀態（正式版改用 useAuth）
  const isLoggedIn = false;
  
  // 圖片瀏覽狀態
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // ContactModal 狀態
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSource, setContactSource] = useState<'sidebar' | 'mobile_bar' | 'booking'>('sidebar');
  
  // S 級 VIP 攔截 Modal
  const [showVipModal, setShowVipModal] = useState(false);
  const [vipReason, setVipReason] = useState<string>('');
  
  // 初始化直接使用 DEFAULT_PROPERTY，確保第一幀就有畫面，絕不留白
  const [property, setProperty] = useState<PropertyData>(DEFAULT_PROPERTY);

  // 取得 agent_id (從 URL 參數或 localStorage)
  const getAgentId = () => {
    let aid = searchParams.get('aid');
    if (!aid) aid = localStorage.getItem('uag_last_aid');
    if (aid && aid !== 'unknown') localStorage.setItem('uag_last_aid', aid);
    return aid || 'unknown';
  };

  // S 級客戶即時攔截回調
  const handleGradeUpgrade = useCallback((grade: string, reason?: string) => {
    if (grade === 'S') {
      if (reason) setVipReason(reason);
      // 延遲 500ms 顯示，避免太突兀
      setTimeout(() => setShowVipModal(true), 500);
    }
  }, []);

  // 從 address 提取行政區 (例如 "台北市信義區..." -> "信義區")
  const extractDistrict = (address: string): string => {
    const match = address.match(/[市縣](.{2,3}[區鄉鎮市])/);
    return match?.[1] ?? 'unknown';
  };

  // 初始化追蹤器 (傳入 district + S級回調)
  const tracker = usePropertyTracker(
    id || '', 
    getAgentId(), 
    extractDistrict(property.address),
    handleGradeUpgrade
  );

  // 開啟聯絡 Modal 的處理函數
  const openContactModal = (source: 'sidebar' | 'mobile_bar' | 'booking') => {
    setContactSource(source);
    setShowContactModal(true);
    // 同時追蹤點擊事件
    if (source === 'mobile_bar') {
      tracker.trackLineClick();
    } else {
      tracker.trackCallClick();
    }
  };

  // 社會證明數據 - 模擬即時瀏覽人數與預約組數
  const socialProof = useMemo(() => {
    // 基於 property.publicId 產生穩定的隨機數
    const seed = property.publicId?.charCodeAt(3) || 0;
    return {
      currentViewers: Math.floor(seed % 5) + 2,      // 2-6 人正在瀏覽
      weeklyBookings: Math.floor(seed % 8) + 5,      // 5-12 組預約
      isHot: seed % 3 === 0                           // 1/3 機率顯示為熱門
    };
  }, [property.publicId]);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      
      try {
        const data = await propertyService.getPropertyByPublicId(id);
        if (data) {
          setProperty(data);
        }
      } catch (error) {
        console.error('Fetch error:', error);
        // 發生錯誤時，保持顯示預設資料，不讓畫面崩壞
      }
    };
    fetchProperty();
  }, [id]);

  // [Safety] 確保有圖片可顯示，防止空陣列導致破圖
  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

  let displayImage = (property.images && property.images.length > 0 && property.images[0]) 
    ? property.images[0] 
    : FALLBACK_IMAGE;

  // [Double Safety] 前端攔截 picsum
  if (displayImage && displayImage.includes('picsum')) {
    displayImage = FALLBACK_IMAGE;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 h-16 flex items-center px-4 shadow-sm justify-between">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div className="flex items-center text-[#003366] font-extrabold text-xl gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#003366] to-[#00A8E8] rounded-lg flex items-center justify-center text-white">
              <Home size={18} />
            </div>
            邁房子
          </div>
        </div>
        
        {/* 僅顯示公開編號 */}
        <div className="flex items-center text-xs font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Hash size={12} className="mr-1 text-gray-400"/>
          編號：<span className="font-bold text-[#003366] ml-1">{property.publicId}</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 pb-24">
        {/* Image Gallery - 橫向滾動多圖 */}
        <div className="mb-4">
          {/* 主圖 */}
          <div className="aspect-video bg-slate-200 rounded-2xl overflow-hidden relative group">
            <img 
              src={property.images?.[currentImageIndex] || displayImage} 
              alt={property.title}
              onError={(e) => {
                if (e.currentTarget.src !== FALLBACK_IMAGE) {
                  e.currentTarget.src = FALLBACK_IMAGE;
                }
              }}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
              <Home size={12} />
              <span>{currentImageIndex + 1} / {property.images?.length || 1}</span>
            </div>
          </div>
          
          {/* 縮圖橫向滾動 */}
          {property.images && property.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mt-3 -mx-4 px-4 scrollbar-hide">
              {property.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentImageIndex(i);
                    tracker.trackPhotoClick();
                  }}
                  className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    i === currentImageIndex 
                      ? 'border-[#003366] ring-2 ring-[#003366]/20' 
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`照片 ${i + 1}`}
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 📱 行動端首屏 CTA - 高轉換設計 */}
        <div className="lg:hidden mb-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4">
            <div className="flex gap-3">
              <button 
                onClick={() => openContactModal('mobile_bar')}
                className="flex-1 bg-[#003366] text-white font-bold py-4 rounded-xl text-base shadow-lg flex items-center justify-center gap-2"
              >
                <Phone size={20} />
                立即聯絡經紀人
              </button>
              <button 
                onClick={() => openContactModal('mobile_bar')}
                className="w-14 bg-[#06C755] text-white rounded-xl flex items-center justify-center shadow-lg"
              >
                <MessageCircle size={22} />
              </button>
            </div>
            <p className="text-center text-xs text-slate-500 mt-2">
              🔥 本物件 {socialProof.weeklyBookings} 組預約中，把握機會！
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                  {property.title}
                </h1>
                <button 
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`p-2 rounded-full transition-all ${isFavorite ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                >
                  <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
                </button>
              </div>
              
              <div className="flex items-center gap-2 text-slate-500 mt-2 text-sm">
                <MapPin size={16} />
                {property.address}
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#003366]">{property.price}</span>
                <span className="text-lg text-slate-500 font-medium">萬</span>
                <span className="text-sm text-red-500 font-medium ml-2">可議價</span>
              </div>

              {/* 社會證明提示 - FOMO */}
              <div className="mt-3 flex flex-wrap gap-2">
                {socialProof.isHot && (
                  <div className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full animate-pulse">
                    <Flame size={12} />
                    熱門物件
                  </div>
                )}
                <div className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-full">
                  <Eye size={12} className="text-blue-500" />
                  {socialProof.currentViewers} 人正在瀏覽
                </div>
                <div className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-full">
                  <Users size={12} className="text-green-500" />
                  本週 {socialProof.weeklyBookings} 組預約看屋
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {['近捷運', '全新裝潢', '有車位', '高樓層'].map(tag => (
                <span key={tag} className="px-3 py-1 bg-blue-50 text-[#003366] text-xs font-medium rounded-full">
                  {tag}
                </span>
              ))}
            </div>

            <div className="h-px bg-slate-100" />

            {/* Description */}
            <div className="prose prose-slate max-w-none">
              <h3 className="text-lg font-bold text-slate-900 mb-3">物件特色</h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>
            
            {/* 🏠 社區評價 - 兩好一公道 */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Star size={18} className="text-yellow-500" fill="currentColor" />
                  社區評價
                </h3>
                <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-full">
                  88 位住戶加入
                </span>
              </div>
              
              {/* 前兩則評價（公開顯示） */}
              <div className="space-y-3">
                <div className="flex gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#003366] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                    J
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800 text-sm">J***</span>
                      <span className="text-xs text-slate-500">B棟住戶</span>
                      <span className="text-yellow-500 text-xs">★★★★★</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      公設維護得乾淨，假日草皮有人整理。之前反映停車動線，管委會一週內就公告改善。
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#00A8E8] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                    W
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800 text-sm">W***</span>
                      <span className="text-xs text-slate-500">12F住戶</span>
                      <span className="text-yellow-500 text-xs">★★★★☆</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      住起來整體舒服，但面向上路的低樓層在上下班尖峰車聲明顯，喜靜的買家可考慮中高樓層。
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 第三則（未登入時模糊隱藏，登入後正常顯示） */}
              <div className="relative mt-3 overflow-hidden rounded-xl">
                <div className={`flex gap-3 p-3 bg-slate-50 ${!isLoggedIn ? 'blur-sm select-none' : ''}`}>
                  <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                    L
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800 text-sm">L***</span>
                      <span className="text-xs text-slate-500">C棟住戶</span>
                      {isLoggedIn && <span className="text-yellow-500 text-xs">★★★★★</span>}
                    </div>
                    <p className="text-sm text-slate-600">
                      {isLoggedIn 
                        ? '頂樓排水設計不錯，颱風天也沒有積水問題。管委會有固定請人清理排水孔，很放心。'
                        : '頂樓排水設計不錯，颱風天也沒有積水問題...'}
                    </p>
                  </div>
                </div>
                
                {/* 遮罩層 - 已登入則直接看到，未登入顯示註冊按鈕 */}
                {!isLoggedIn && (
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white flex items-end justify-center pb-3">
                    <button 
                      onClick={() => {
                        window.location.href = '/auth.html?redirect=community';
                      }}
                      className="flex items-center gap-2 bg-[#003366] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:bg-[#004488] transition-colors"
                    >
                      <Lock size={14} />
                      註冊查看全部 6 則評價
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
              
              {/* 社區牆入口提示 */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  💬 加入社區牆，與現任住戶交流
                </p>
                <button 
                  onClick={() => window.location.href = '/maihouses/community-wall_mvp.html'}
                  className="text-xs text-[#003366] font-bold hover:underline flex items-center gap-1"
                >
                  前往社區牆
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar / Agent Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <AgentTrustCard 
                agent={property.agent} 
                onLineClick={() => openContactModal('sidebar')}
                onCallClick={() => openContactModal('sidebar')}
                onBookingClick={() => openContactModal('booking')}
              />
              
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-bold text-[#003366] text-sm mb-2 flex items-center gap-2">
                  <Shield size={16} />
                  安心交易保障
                </h4>
                <ul className="space-y-2">
                  <li className="text-xs text-slate-600 flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-400 rounded-full" />
                    產權調查確認
                  </li>
                  <li className="text-xs text-slate-600 flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-400 rounded-full" />
                    履約保證專戶
                  </li>
                  <li className="text-xs text-slate-600 flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-400 rounded-full" />
                    凶宅查詢過濾
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 📱 30秒回電浮動按鈕 - 高轉換 */}
      <button 
        onClick={() => openContactModal('booking')}
        className="fixed right-4 bottom-28 lg:bottom-8 z-40 bg-orange-500 hover:bg-orange-600 text-white w-16 h-16 rounded-full shadow-2xl flex flex-col items-center justify-center text-xs font-bold transition-transform hover:scale-110 animate-bounce"
        style={{ animationDuration: '2s' }}
      >
        <Phone size={22} />
        <span className="text-[10px] mt-0.5">30秒回電</span>
      </button>

      {/* Mobile Bottom Bar - 雙主按鈕設計 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-3 lg:hidden z-50 pb-safe">
        {/* 經紀人驗證資訊 */}
        <div className="flex items-center justify-center gap-4 mb-2 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Shield size={10} className="text-green-500" />
            認證經紀人
          </span>
          <span className="flex items-center gap-1">
            <Eye size={10} className="text-blue-500" />
            {socialProof.currentViewers} 人瀏覽中
          </span>
          {socialProof.isHot && (
            <span className="flex items-center gap-1 text-orange-500 font-medium">
              <Flame size={10} />
              熱門
            </span>
          )}
        </div>
        
        {/* 雙主按鈕 */}
        <div className="flex gap-2">
          {/* 左按鈕：加 LINE（低門檻）*/}
          <button 
            onClick={() => openContactModal('mobile_bar')}
            className="flex-[4] bg-[#06C755] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
          >
            <MessageCircle size={20} />
            加 LINE 諮詢
          </button>
          
          {/* 右按鈕：預約看屋（高意圖）*/}
          <button 
            onClick={() => openContactModal('booking')}
            className="flex-[6] bg-[#003366] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
          >
            <Calendar size={20} />
            預約看屋
          </button>
        </div>
      </div>

      {/* 統一聯絡入口 Modal */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        propertyId={property.publicId}
        propertyTitle={property.title}
        agentId={getAgentId()}
        agentName={property.agent?.name || '專屬業務'}
        source={contactSource}
      />

      {/* VIP 高意願客戶攔截彈窗 (S-Grade) */}
      {showVipModal && (
        <div 
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowVipModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Flame size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">發現您對此物件很有興趣！</h3>
              <p className="text-sm text-slate-500 mt-1">
                {vipReason || '專屬 VIP 服務為您優先安排'}
              </p>
            </div>

            {/* Benefits */}
            <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                <span>優先安排專人帶看</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                <span>獨家議價空間資訊</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                <span>相似物件即時通知</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  tracker.trackLineClick();
                  setShowVipModal(false);
                  openContactModal('mobile_bar');
                }}
                className="w-full bg-[#06C755] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg"
              >
                <MessageCircle size={20} />
                立即加 LINE 諮詢
              </button>
              <button
                onClick={() => {
                  tracker.trackCallClick();
                  setShowVipModal(false);
                  openContactModal('booking');
                }}
                className="w-full bg-[#003366] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Calendar size={20} />
                VIP 預約看屋
              </button>
              <button
                onClick={() => setShowVipModal(false)}
                className="w-full text-slate-400 text-sm py-2 hover:text-slate-600"
              >
                稍後再說
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
