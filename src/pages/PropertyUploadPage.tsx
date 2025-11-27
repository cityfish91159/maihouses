import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Check, AlertCircle, Home, DollarSign, MapPin, FileText } from 'lucide-react';
import { propertyService } from '../services/propertyService';
import { Imported591Data } from '../lib/types';

export const PropertyUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Imported591Data>({
    title: '',
    price: 0,
    address: '',
    description: '',
    images: [],
    sourcePlatform: 'MH',
    sourceExternalId: `MH-${Date.now()}`
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 模擬當前登入的經紀人 ID (實際應從 Auth Context 獲取)
      const currentAgentId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; 
      
      await propertyService.createProperty(formData, currentAgentId);
      
      // 成功後跳轉到列表或詳情頁 (這裡先跳回首頁或顯示成功)
      alert('物件上傳成功！');
      navigate('/');
    } catch (err) {
      console.error('Upload failed:', err);
      setError('上傳失敗，請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? Number(value) : value
    }));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#003366] to-[#0055aa] p-6 text-white">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Upload size={24} />
            上傳新物件
          </h1>
          <p className="text-blue-100 mt-2 text-sm">填寫物件資訊以刊登到邁房子平台</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">物件標題</label>
            <div className="relative">
              <Home className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all"
                placeholder="例如：信義區景觀豪宅..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">價格 (萬元)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="number"
                  name="price"
                  required
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">地址</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all"
                  placeholder="台北市..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">物件描述</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-slate-400" size={18} />
              <textarea
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all resize-none"
                placeholder="詳細介紹這個物件..."
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#003366] hover:bg-[#004488] text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>處理中...</>
              ) : (
                <>
                  <Check size={20} />
                  確認刊登
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
