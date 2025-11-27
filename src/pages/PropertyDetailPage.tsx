import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Home, Heart, Phone, MessageCircle, Hash, MapPin, Share2, ArrowLeft, Shield } from 'lucide-react';
import { AgentTrustCard } from '../components/AgentTrustCard';
import { propertyService, DEFAULT_PROPERTY, PropertyData } from '../services/propertyService';

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isFavorite, setIsFavorite] = useState(false);
  
  // 初始化直接使用 DEFAULT_PROPERTY，確保第一幀就有畫面，絕不留白
  const [property, setProperty] = useState<PropertyData>(DEFAULT_PROPERTY);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      
      // 這裡不設 isLoading = true，因為我們希望畫面維持預設狀態直到新資料進來
      // 這樣可以避免畫面閃爍
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
  let displayImage = (property.images && property.images.length > 0 && property.images[0]) 
    ? property.images[0] 
    : DEFAULT_PROPERTY.images[0];

  // [Double Safety] 前端攔截 picsum (因為 picsum 不穩定)
  if (displayImage && displayImage.includes('picsum')) {
    displayImage = DEFAULT_PROPERTY.images[0];
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
              e.currentTarget.src = DEFAULT_PROPERTY.images[0] || 'https://images.unsplash.com/photo-1600596542815-27b88e54e6d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
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
        <button className="flex-1 bg-[#003366] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
          <Phone size={20} />
          聯絡經紀人
        </button>
        <button className="w-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center border border-slate-200">
          <MessageCircle size={20} />
        </button>
      </div>
    </div>
  );
};
