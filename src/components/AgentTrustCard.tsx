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
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setSelectedSlot(null);
      setPhone('');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-modal flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
      <div className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#003366] to-[#00A8E8] p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">預約看屋</h3>
              <p className="text-sm opacity-80">選擇方便的時段，{agentName} 將為您安排</p>
            </div>
            <button onClick={onClose} className="rounded-full p-1 transition-colors hover:bg-white/20">
              <X size={20} />
            </button>
          </div>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="text-green-500" size={32} />
            </div>
            <h4 className="mb-2 text-xl font-bold text-slate-800">預約成功！</h4>
            <p className="text-slate-500">經紀人將盡快與您聯繫確認</p>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto p-4">
            {/* Time Slots */}
            <div className="mb-4 space-y-3">
              {timeSlots.slice(0, 4).map((slot) => (
                <div key={slot.date}>
                  <div className="mb-2 text-xs font-medium text-slate-500">
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
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
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
              <label htmlFor="booking-phone" className="mb-1 block text-xs font-medium text-slate-600">您的手機號碼</label>
              <input
                id="booking-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912-345-678"
                className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-transparent focus:ring-2 focus:ring-[#003366]"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!selectedSlot || !phone}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold transition-all ${
                selectedSlot && phone
                  ? 'bg-[#003366] text-white hover:bg-[#004488]'
                  : 'cursor-not-allowed bg-slate-100 text-slate-400'
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
  // 使用 agent.internalCode 產生確定性結果，避免渲染時使用不純函數
  const isOnline = useMemo(() => {
    return agent.internalCode % 10 > 3; // 約 70% 機率在線，但對同一 agent 結果穩定
  }, [agent.internalCode]);
  const trustBreakdown = getTrustBreakdown(agent.trustScore);
  
  // 經紀人績效指標（模擬數據，後續從後端獲取）
  const agentMetrics = useMemo(() => ({
    responseTime: isOnline ? '5 分鐘' : '2 小時',
    closureRate: Math.min(95, 60 + (agent.trustScore % 30)),
    totalDeals: agent.encouragementCount * 2 + 10,
    experience: Math.floor(agent.trustScore / 25) + 1
  }), [agent.trustScore, agent.encouragementCount, isOnline]);

  return (
    <>
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="relative">
            <img 
              src={agent.avatarUrl} 
              alt={agent.name} 
              className="size-16 rounded-full border-2 border-white object-cover shadow-md"
            />
            {/* 在線狀態指示器 */}
            <div className={`absolute -bottom-1 -right-1 ${isOnline ? 'bg-green-500' : 'bg-slate-400'} flex items-center gap-0.5 rounded-full border border-white px-1.5 py-0.5 text-[10px] text-white`}>
              <div className={`size-1.5 rounded-full ${isOnline ? 'animate-pulse bg-white' : 'bg-slate-300'}`} />
              <span>{isOnline ? '在線' : '離線'}</span>
            </div>
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                  {agent.name}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
                    {agent.company}
                  </span>
                </h3>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="text-xs text-slate-400">經紀人編號：#{agent.internalCode}</p>
                  <div className="flex items-center gap-0.5 rounded bg-green-50 px-1.5 py-0.5 text-[10px] text-green-600">
                    <Shield size={10} />
                    <span>已認證</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4">
              {/* 信任分 - 加入 Tooltip */}
              <div
                className="relative flex cursor-pointer items-center gap-1.5"
                role="button"
                tabIndex={0}
                onMouseEnter={() => setShowTrustTooltip(true)}
                onMouseLeave={() => setShowTrustTooltip(false)}
                onFocus={() => setShowTrustTooltip(true)}
                onBlur={() => setShowTrustTooltip(false)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowTrustTooltip(!showTrustTooltip); }}
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-[#003366]">
                  <Star size={16} fill="currentColor" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#003366]">{agent.trustScore}</div>
                  <div className="text-[10px] text-slate-500">信任分</div>
                </div>

                {/* Trust Score Tooltip */}
                {showTrustTooltip && (
                  <div className="absolute bottom-full left-0 z-10 mb-2 w-48 rounded-lg bg-slate-800 p-3 text-xs text-white shadow-xl">
                    <div className="mb-2 font-bold">信任分數構成</div>
                    {trustBreakdown.map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-1.5">
                          <item.icon size={12} className="text-green-400" />
                          <span>{item.label}</span>
                        </div>
                        <span className="font-medium">+{item.value}</span>
                      </div>
                    ))}
                    <div className="mt-2 flex justify-between border-t border-slate-600 pt-2 font-bold">
                      <span>總計</span>
                      <span className="text-green-400">{agent.trustScore}</span>
                    </div>
                    {/* Tooltip Arrow */}
                    <div className="absolute left-4 top-full border-8 border-transparent border-t-slate-800" />
                  </div>
                )}
              </div>

              <div className="h-8 w-px bg-slate-100"></div>

              <div className="flex items-center gap-1.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
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
              <div className="mt-3 inline-flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1 text-xs text-green-600">
                <Clock size={12} />
                平均 {agentMetrics.responseTime} 內回覆
              </div>
            )}
          </div>
        </div>
        
        {/* 經紀人績效指標 */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-y border-slate-100 py-3">
          <div className="text-center">
            <div className="text-lg font-bold text-[#003366]">{agentMetrics.closureRate}%</div>
            <div className="text-[10px] text-slate-500">成交率</div>
          </div>
          <div className="border-x border-slate-100 text-center">
            <div className="text-lg font-bold text-slate-800">{agentMetrics.totalDeals}</div>
            <div className="text-[10px] text-slate-500">累積成交</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-slate-800">{agentMetrics.experience}年</div>
            <div className="text-[10px] text-slate-500">服務經驗</div>
          </div>
        </div>
        
        {/* CTA 按鈕區 - 優化版 */}
        <div className="mt-4 space-y-2 border-t border-slate-50 pt-3">
          {/* 主要 CTA：加 LINE（低門檻） */}
          <button 
            onClick={onLineClick}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#06C755] py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#05B04A]"
          >
            <MessageCircle size={18} />
            加 LINE 聊聊
          </button>
          
          {/* 次要 CTA */}
          <div className="flex gap-2">
            <button 
              onClick={() => onBookingClick ? onBookingClick() : setShowBookingModal(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#003366] py-2 text-sm font-medium text-white transition-colors hover:bg-[#004488]"
            >
              <Calendar size={16} />
              預約看屋
            </button>
            <button 
              onClick={onCallClick}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#003366] bg-white py-2 text-sm font-medium text-[#003366] transition-colors hover:bg-blue-50"
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
