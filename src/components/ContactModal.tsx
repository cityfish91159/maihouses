import React, { useState } from 'react';
import { X, Phone, MessageCircle, Mail, Calendar, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { notify } from '../lib/notify';
import { createLead } from '../services/leadService';

// 聯絡偏好
export type ContactChannel = 'phone' | 'line' | 'message';

// 表單資料
export interface ContactFormData {
  name: string;
  phone: string;
  preferredChannel: ContactChannel;
  preferredTime: string;
  budget: string;
  needs: string;
}

// Modal Props
interface ContactModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly propertyId: string;
  readonly propertyTitle: string;
  readonly agentId: string;
  readonly agentName: string;
  readonly source: 'sidebar' | 'mobile_bar' | 'booking';
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  agentId,
  agentName,
  source
}) => {
  const [step, setStep] = useState<'form' | 'submitting' | 'success'>('form');
  const [form, setForm] = useState<ContactFormData>({
    name: '',
    phone: '',
    preferredChannel: 'line',
    preferredTime: '',
    budget: '',
    needs: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 基本驗證
    if (!form.name.trim() || !form.phone.trim()) {
      notify.error('請填寫姓名和電話');
      return;
    }

    setStep('submitting');

    try {
      // 建立 Lead - 使用 leadService
      const result = await createLead({
        customerName: form.name,
        customerPhone: form.phone,
        agentId,
        propertyId,
        source,
        ...(form.budget ? { budgetRange: form.budget } : {}),
        ...(form.preferredTime ? { preferredContactTime: form.preferredTime } : {}),
        ...(form.needs ? { needsDescription: form.needs } : {})
      });

      if (result.success) {
        setStep('success');
        // 3 秒後自動關閉
        setTimeout(() => {
          onClose();
          setStep('form');
          setForm({
            name: '',
            phone: '',
            preferredChannel: 'line',
            preferredTime: '',
            budget: '',
            needs: ''
          });
        }, 3000);
      } else {
        notify.error('送出失敗', result.error || '請稍後再試');
        setStep('form');
      }
    } catch {
      notify.error('系統錯誤，請稍後再試');
      setStep('form');
    }
  };

  const channelOptions: Array<{ value: ContactChannel; label: string; icon: React.ReactNode }> = [
    { value: 'line', label: 'LINE', icon: <MessageCircle size={18} className="text-[#00c300]" /> },
    { value: 'phone', label: '電話', icon: <Phone size={18} className="text-blue-600" /> },
    { value: 'message', label: '站內訊息', icon: <Mail size={18} className="text-slate-600" /> }
  ];

  const timeOptions = [
    '平日 09:00-12:00',
    '平日 14:00-18:00',
    '平日 19:00-21:00',
    '週末 10:00-12:00',
    '週末 14:00-18:00',
    '皆可'
  ];

  const budgetOptions = [
    '1000萬以下',
    '1000-2000萬',
    '2000-3000萬',
    '3000-5000萬',
    '5000萬以上',
    '尚未確定'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#003366] to-[#00A8E8] p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-xl">聯絡經紀人</h3>
              <p className="text-sm opacity-90 mt-1">
                {agentName} 將在 <span className="font-bold">10 分鐘內</span> 回覆您
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={22} />
            </button>
          </div>
          
          {/* 物件資訊 */}
          <div className="mt-3 bg-white/10 rounded-lg px-3 py-2 text-sm">
            <span className="opacity-80">詢問物件：</span>
            <span className="font-medium ml-1">{propertyTitle}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[60vh]">
          
          {step === 'success' ? (
            /* 成功畫面 */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">已建立安心留痕！</h4>
              <p className="text-slate-600 mb-4">
                {agentName} 將在 <span className="font-bold text-[#003366]">10 分鐘內</span> 與您聯繫
              </p>
              <div className="bg-blue-50 rounded-xl p-4 text-left text-sm">
                <p className="font-medium text-[#003366] mb-2">📋 您的諮詢紀錄已保存：</p>
                <ul className="space-y-1 text-slate-600">
                  <li>✅ 首次聯繫時間已記錄</li>
                  <li>✅ 經紀人回覆時間將被追蹤</li>
                  <li>✅ 所有溝通承諾將留存備查</li>
                </ul>
              </div>
            </div>
          ) : step === 'submitting' ? (
            /* 送出中 */
            <div className="text-center py-12">
              <Loader2 className="animate-spin text-[#003366] mx-auto mb-4" size={40} />
              <p className="text-slate-600">建立諮詢紀錄中...</p>
            </div>
          ) : (
            /* 表單 */
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* 📋 聯絡前須知 - SLA 承諾 */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="font-bold text-amber-900 text-sm mb-2 flex items-center gap-1.5">
                  <Clock size={14} />
                  聯絡前須知
                </p>
                <ul className="text-amber-800 text-xs space-y-1">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle size={12} className="text-green-600 flex-shrink-0" />
                    經紀人 {agentName} 承諾 <strong>10 分鐘內</strong> 回應
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle size={12} className="text-green-600 flex-shrink-0" />
                    您的聯絡資訊受隱私保護，僅供本次諮詢使用
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle size={12} className="text-green-600 flex-shrink-0" />
                    可隨時取消後續聯絡，無任何義務
                  </li>
                </ul>
              </div>
              
              {/* 基本資料 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="如何稱呼您"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    電話 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="0912-345-678"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* 偏好聯絡方式 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  偏好聯絡方式
                </label>
                <div className="flex gap-2">
                  {channelOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, preferredChannel: opt.value })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all ${
                        form.preferredChannel === opt.value
                          ? 'border-[#003366] bg-blue-50 text-[#003366]'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {opt.icon}
                      <span className="font-medium text-sm">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 方便聯絡時段 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Clock size={14} className="inline mr-1" />
                  方便聯絡時段
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {timeOptions.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setForm({ ...form, preferredTime: time })}
                      className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                        form.preferredTime === time
                          ? 'bg-[#003366] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* 購屋預算 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  購屋預算區間
                </label>
                <select
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] outline-none transition-all bg-white"
                >
                  <option value="">請選擇</option>
                  {budgetOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* 簡單需求 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  其他需求或問題
                </label>
                <textarea
                  value={form.needs}
                  onChange={(e) => setForm({ ...form, needs: e.target.value })}
                  placeholder="例如：想了解學區、需要停車位、希望近捷運..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] outline-none transition-all resize-none"
                />
              </div>

              {/* 安心提示 */}
              <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={16} className="text-green-600" />
                </div>
                <div className="text-xs text-green-800">
                  <p className="font-medium mb-1">🛡️ 安心留痕保障</p>
                  <p>您的諮詢將被完整記錄，經紀人的每一次回覆和承諾都會留存，保障您的權益。</p>
                </div>
              </div>

              {/* 送出按鈕 */}
              <button
                type="submit"
                className="w-full bg-[#003366] text-white font-bold py-3.5 rounded-xl hover:bg-[#004488] transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
              >
                <Calendar size={18} />
                送出諮詢，建立安心留痕
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
