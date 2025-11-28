import React, { useState, useMemo } from 'react';
import { Shield, ThumbsUp, Star, MessageCircle, Phone, Clock, CheckCircle, Calendar, X, FileText } from 'lucide-react';
import { Agent } from '../lib/types';

interface AgentTrustCardProps {
  agent: Agent;
  onLineClick?: () => void;
  onCallClick?: () => void;
  onBookingClick?: () => void;  // 新增：預約看屋回調
}

// 信任分數構成說明
const getTrustBreakdown = (score: number) => {
  const base = Math.floor(score * 0.4);
  const response = Math.floor(score * 0.3);
  const deals = Math.floor(score * 0.3);
  return [
    { label: '實名認證', value: base, icon: CheckCircle },
    { label: '回覆速度', value: response, icon: Clock },
    { label: '成交記錄', value: deals, icon: FileText },
  ];
};

// 預約時段選擇器 Modal
const BookingModal: React.FC<{ isOpen: boolean; onClose: () => void; agentName: string }> = ({ isOpen, onClose, agentName }) => {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // 生成未來 7 天的可用時段
  const timeSlots = useMemo(() => {
    const slots: { date: string; day: string; times: string[] }[] = [];
    const days: string[] = ['日', '一', '二', '三', '四', '五', '六'];
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dayStr = `${date.getMonth() + 1}/${date.getDate()}`;
      const dayName = days[date.getDay()] ?? '日';
      
      // 週末有更多時段
      const times = date.getDay() === 0 || date.getDay() === 6
        ? ['10:00', '11:00', '14:00', '15:00', '16:00']
        : ['14:00', '15:00', '19:00'];
      
      slots.push({ date: dayStr, day: dayName, times });
    }
    return slots;
  }, []);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selectedSlot || !phone) return;
    // TODO: 送出預約到後端
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setSelectedSlot(null);
      setPhone('');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#003366] to-[#00A8E8] p-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">預約看屋</h3>
              <p className="text-sm opacity-80">選擇方便的時段，{agentName} 將為您安排</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-500" size={32} />
            </div>
            <h4 className="text-xl font-bold text-slate-800 mb-2">預約成功！</h4>
            <p className="text-slate-500">經紀人將盡快與您聯繫確認</p>
          </div>
        ) : (
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {/* Time Slots */}
            <div className="space-y-3 mb-4">
              {timeSlots.slice(0, 4).map((slot) => (
                <div key={slot.date}>
                  <div className="text-xs font-medium text-slate-500 mb-2">
                    {slot.date} (週{slot.day})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {slot.times.map((time) => {
                      const slotId = `${slot.date}-${time}`;
                      const isSelected = selectedSlot === slotId;
                      return (
                        <button
                          key={slotId}
                          onClick={() => setSelectedSlot(slotId)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-[#003366] text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Phone Input */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-600 mb-1">您的手機號碼</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912-345-678"
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!selectedSlot || !phone}
              className={`w-full mt-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                selectedSlot && phone
                  ? 'bg-[#003366] text-white hover:bg-[#004488]'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Calendar size={18} />
              確認預約
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const AgentTrustCard: React.FC<AgentTrustCardProps> = ({ agent, onLineClick, onCallClick, onBookingClick }) => {
  const [showTrustTooltip, setShowTrustTooltip] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  // 模擬在線狀態 (實際應從後端獲取)
  const isOnline = useMemo(() => Math.random() > 0.3, []); // 70% 機率在線
  const trustBreakdown = getTrustBreakdown(agent.trustScore);

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-start gap-4">
          <div className="relative">
            <img 
              src={agent.avatarUrl} 
              alt={agent.name} 
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
            />
            {/* 在線狀態指示器 */}
            <div className={`absolute -bottom-1 -right-1 ${isOnline ? 'bg-green-500' : 'bg-slate-400'} text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-white`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
              <span>{isOnline ? '在線' : '離線'}</span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  {agent.name}
                  <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {agent.company}
                  </span>
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-400">經紀人編號：#{agent.internalCode}</p>
                  <div className="flex items-center gap-0.5 text-green-600 bg-green-50 px-1.5 py-0.5 rounded text-[10px]">
                    <Shield size={10} />
                    <span>已認證</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3">
              {/* 信任分 - 加入 Tooltip */}
              <div 
                className="flex items-center gap-1.5 relative cursor-pointer"
                onMouseEnter={() => setShowTrustTooltip(true)}
                onMouseLeave={() => setShowTrustTooltip(false)}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#003366]">
                  <Star size={16} fill="currentColor" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#003366]">{agent.trustScore}</div>
                  <div className="text-[10px] text-slate-500">信任分</div>
                </div>

                {/* Trust Score Tooltip */}
                {showTrustTooltip && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-800 text-white text-xs rounded-lg p-3 shadow-xl z-10">
                    <div className="font-bold mb-2">信任分數構成</div>
                    {trustBreakdown.map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-1.5">
                          <item.icon size={12} className="text-green-400" />
                          <span>{item.label}</span>
                        </div>
                        <span className="font-medium">+{item.value}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-600 mt-2 pt-2 flex justify-between font-bold">
                      <span>總計</span>
                      <span className="text-green-400">{agent.trustScore}</span>
                    </div>
                    {/* Tooltip Arrow */}
                    <div className="absolute top-full left-4 border-8 border-transparent border-t-slate-800" />
                  </div>
                )}
              </div>

              <div className="w-px h-8 bg-slate-100"></div>

              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                  <ThumbsUp size={16} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">{agent.encouragementCount}</div>
                  <div className="text-[10px] text-slate-500">獲得鼓勵</div>
                </div>
              </div>
            </div>

            {/* 在線狀態提示 */}
            {isOnline && (
              <div className="mt-3 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg inline-flex items-center gap-1">
                <Clock size={12} />
                平均 5 分鐘內回覆
              </div>
            )}
          </div>
        </div>
        
        {/* CTA 按鈕區 - 優化版 */}
        <div className="mt-4 pt-3 border-t border-slate-50 space-y-2">
          {/* 主要 CTA：加 LINE（低門檻） */}
          <button 
            onClick={onLineClick}
            className="w-full bg-[#06C755] text-white text-sm font-bold py-2.5 rounded-lg hover:bg-[#05B04A] transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <MessageCircle size={18} />
            加 LINE 聊聊
          </button>
          
          {/* 次要 CTA */}
          <div className="flex gap-2">
            <button 
              onClick={() => onBookingClick ? onBookingClick() : setShowBookingModal(true)}
              className="flex-1 bg-[#003366] text-white text-sm font-medium py-2 rounded-lg hover:bg-[#004488] transition-colors flex items-center justify-center gap-1.5"
            >
              <Calendar size={16} />
              預約看屋
            </button>
            <button 
              onClick={onCallClick}
              className="flex-1 bg-white border border-[#003366] text-[#003366] text-sm font-medium py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Phone size={16} />
              致電諮詢
            </button>
          </div>
        </div>
      </div>

      {/* 預約看屋 Modal */}
      <BookingModal 
        isOpen={showBookingModal} 
        onClose={() => setShowBookingModal(false)} 
        agentName={agent.name}
      />
    </>
  );
};
