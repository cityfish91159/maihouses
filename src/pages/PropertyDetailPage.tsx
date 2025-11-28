import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Home, Heart, Phone, MessageCircle, Hash, MapPin, ArrowLeft, Shield } from 'lucide-react';
import { AgentTrustCard } from '../components/AgentTrustCard';
import { propertyService, DEFAULT_PROPERTY, PropertyData } from '../services/propertyService';

// UAG Tracker Hook - 追蹤用戶行為
const usePropertyTracker = (propertyId: string, agentId: string) => {
  const enterTime = useRef(Date.now());
  const actions = useRef({ click_photos: 0, click_line: 0, click_call: 0, scroll_depth: 0 });
  const hasSent = useRef(false);

  // 取得或建立 session_id
  const getSessionId = useCallback(() => {
    let sid = localStorage.getItem('uag_session');
    if (!sid) {
      sid = `u_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('uag_session', sid);
    }
    return sid;
  }, []);

  // 發送追蹤事件
  const sendEvent = useCallback((eventType: string) => {
    const payload = {
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
        district: 'unknown',
        duration: Math.round((Date.now() - enterTime.current) / 1000),
        actions: { ...actions.current },
        focus: []
      }
    };

    // 使用 sendBeacon 確保離開頁面時也能送出
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon('/api/uag-track', blob);
  }, [propertyId, agentId, getSessionId]);

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

    // 發送 page_view
    sendEvent('page_view');

    // 離開頁面時發送 page_exit
    const handleUnload = () => {
      if (!hasSent.current) {
        hasSent.current = true;
        sendEvent('page_exit');
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
  
  // 初始化直接使用 DEFAULT_PROPERTY，確保第一幀就有畫面，絕不留白
  const [property, setProperty] = useState<PropertyData>(DEFAULT_PROPERTY);

  // 取得 agent_id (從 URL 參數或 localStorage)
  const getAgentId = () => {
    let aid = searchParams.get('aid');
    if (!aid) aid = localStorage.getItem('uag_last_aid');
    if (aid && aid !== 'unknown') localStorage.setItem('uag_last_aid', aid);
    return aid || 'unknown';
  };

  // 初始化追蹤器
  const tracker = usePropertyTracker(id || '', getAgentId());

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
        {/* Image Gallery */}
        <div className="aspect-video bg-slate-200 rounded-2xl overflow-hidden mb-6 relative group">
          <img 
            src={displayImage} 
            alt={property.title}
            onError={(e) => {
              // [Safety] 出錯時統一換成 fallback，不再重複試同一張外部圖
              if (e.currentTarget.src !== FALLBACK_IMAGE) {
                 e.currentTarget.src = FALLBACK_IMAGE;
              }
            }}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
            <Home size={12} />
            <span>共 {property.images?.length || 0} 張照片</span>
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
          </div>

          {/* Sidebar / Agent Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <AgentTrustCard agent={property.agent} />
              
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

      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-3 lg:hidden flex gap-3 z-50 pb-safe">
        <button 
          onClick={tracker.trackCallClick}
          className="flex-1 bg-[#003366] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
        >
          <Phone size={20} />
          聯絡經紀人
        </button>
        <button 
          onClick={tracker.trackLineClick}
          className="w-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center border border-slate-200"
        >
          <MessageCircle size={20} />
        </button>
      </div>
    </div>
  );
};
