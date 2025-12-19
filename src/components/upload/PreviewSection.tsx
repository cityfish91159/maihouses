import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { buildKeyCapsuleTags } from '../../utils/keyCapsules';
import { useUploadForm } from './UploadContext';

export const PreviewSection: React.FC = () => {
  const { form, selectedCommunityId } = useUploadForm();

  // 使用 SSOT 邏輯生成標籤，確保預覽與生產環境一致
  const tags = useMemo(() => {
    return buildKeyCapsuleTags({
      advantage1: form.advantage1,
      advantage2: form.advantage2,
      features: form.highlights,
      size: parseFloat(form.size) || 0,
      rooms: parseInt(form.rooms) || 0,
      halls: parseInt(form.halls) || 0,
      floorCurrent: form.floorCurrent,
      floorTotal: parseInt(form.floorTotal) || 0,
    });
  }, [form]);

  if (!form.title && !form.price && form.images.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wider">
        <MapPin size={16} className="text-slate-400"/> 即時預覽
      </h3>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition-all hover:shadow-lg">
        {form.images.length > 0 && (
          <div className="aspect-video overflow-hidden">
            <img src={form.images[0]} alt="" className="size-full object-cover"/>
          </div>
        )}
        <div className="p-5">
          <h4 className="text-lg font-bold text-slate-900 leading-tight">{form.title || '物件標題'}</h4>
          <p className="mt-1.5 text-sm text-slate-500 flex items-center gap-1">
            <MapPin size={14} /> {form.address || '地址'}
          </p>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#003366]">{form.price || '0'}</span>
            <span className="text-sm font-bold text-slate-500">萬</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <span key={i} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#003366] border border-blue-100">
                {tag}
              </span>
            ))}
            {tags.length === 0 && (
              <span className="text-xs text-slate-400 italic">尚未生成標籤</span>
            )}
          </div>
          
          {/* 社區牆預覽提示 */}
          {form.communityName && (
            <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                🏘️ 社區牆：
                <span className={selectedCommunityId ? 'font-bold text-green-600' : 'font-bold text-blue-600'}>
                  {form.communityName}
                </span>
                {selectedCommunityId ? (
                  <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded">已連結現有社區</span>
                ) : (
                  <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">將自動建立新社區</span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
