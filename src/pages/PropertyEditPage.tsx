/**
 * 物件編輯頁 - 社區歸屬修正
 *
 * 功能：
 * 1. 讓房仲修正物件的社區歸屬
 * 2. 重新選擇/搜尋社區
 * 3. 更新 community_id
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CommunityPicker } from '../components/ui/CommunityPicker';
import { Loader2, ArrowLeft, Home, Building2, Check, AlertTriangle, Save } from 'lucide-react';

interface PropertyData {
  id: string;
  public_id: string;
  title: string;
  address: string;
  community_id: string | null;
  community_name: string | null;
}

export const PropertyEditPage: React.FC = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 編輯狀態
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityId, setNewCommunityId] = useState<string | undefined>();
  const [hasChanges, setHasChanges] = useState(false);

  // 是否是修正社區模式
  const isFixCommunityMode = searchParams.get('fix') === 'community';

  // 載入物件資料
  useEffect(() => {
    const loadProperty = async () => {
      if (!publicId) return;

      try {
        const { data, error } = await supabase
          .from('properties')
          .select('id, public_id, title, address, community_id, community_name')
          .eq('public_id', publicId)
          .single();

        if (error) throw error;

        setProperty(data);
        setNewCommunityName(data.community_name || '');
        setNewCommunityId(data.community_id || undefined);
      } catch (e) {
        setError('無法載入物件資料：' + (e instanceof Error ? e.message : 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [publicId]);

  // 處理社區變更
  const handleCommunityChange = (name: string, communityId?: string) => {
    setNewCommunityName(name);
    setNewCommunityId(communityId);
    setHasChanges(name !== property?.community_name || communityId !== property?.community_id);
  };

  // 儲存變更
  const handleSave = async () => {
    if (!property || !hasChanges) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('properties')
        .update({
          community_id: newCommunityId || null,
          community_name: newCommunityName || null,
        })
        .eq('id', property.id);

      if (error) throw error;

      // 成功後跳轉回物件頁
      navigate(`/property/${publicId}`, {
        state: { message: '社區歸屬已更新！' },
      });
    } catch (e) {
      setError('儲存失敗：' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <Loader2 className="animate-spin text-[#003366]" size={40} />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error || '找不到物件'}</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 underline">
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800">
      {/* Header */}
      <nav className="sticky top-0 z-overlay flex h-16 items-center border-b border-slate-100 bg-white/90 px-4 shadow-sm backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="mr-3 rounded-full p-2 transition-colors hover:bg-slate-100"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex items-center gap-2 text-xl font-extrabold text-[#003366]">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#003366] to-[#00A8E8] text-white">
            <Home size={18} />
          </div>
          {isFixCommunityMode ? '修正社區歸屬' : '編輯物件'}
        </div>
      </nav>

      <main className="mx-auto max-w-lg p-6 py-8">
        {/* 物件資訊 */}
        <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-bold text-slate-800">{property.title}</h2>
          <p className="text-sm text-slate-500">{property.address}</p>
          <p className="mt-1 text-xs text-slate-400">物件編號：{property.public_id}</p>
        </section>

        {/* 社區修正區 */}
        <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="text-blue-600" size={20} />
            <h3 className="font-bold text-slate-800">社區歸屬</h3>
          </div>

          {/* 目前社區 */}
          <div className="mb-4 rounded-xl bg-slate-50 p-3">
            <p className="mb-1 text-xs text-slate-500">目前歸屬</p>
            <p className="font-medium text-slate-700">{property.community_name || '（無社區）'}</p>
          </div>

          {/* 修改社區 */}
          <div>
            <span
              id="edit-community-label"
              className="mb-2 block text-xs font-medium text-slate-600"
            >
              重新選擇社區
            </span>
            <CommunityPicker
              value={newCommunityName}
              address={property.address}
              onChange={handleCommunityChange}
              required={true}
            />
          </div>

          {/* 變更提示 */}
          {hasChanges && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="flex items-center gap-2 text-sm text-amber-700">
                <AlertTriangle size={16} />
                社區歸屬將變更為：
                <span className="font-medium">{newCommunityName || '無'}</span>
              </p>
            </div>
          )}
        </section>

        {/* 儲存按鈕 */}
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold transition-all ${
            hasChanges && !saving
              ? 'bg-gradient-to-r from-[#003366] to-[#00A8E8] text-white shadow-lg hover:scale-[1.01]'
              : 'cursor-not-allowed bg-slate-200 text-slate-400'
          } `}
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              儲存中...
            </>
          ) : (
            <>
              <Save size={20} />
              {hasChanges ? '確認修正' : '無變更'}
            </>
          )}
        </button>

        {/* 取消按鈕 */}
        <button
          onClick={() => navigate(-1)}
          className="mt-3 w-full rounded-xl bg-slate-100 py-3 font-medium text-slate-600 transition hover:bg-slate-200"
        >
          取消
        </button>
      </main>
    </div>
  );
};

export default PropertyEditPage;
