# 物件上傳頁 - 社區牆系統完整代碼包
> 日期：2024/12/01
> 功能：社區牆自動比對與生成

---

## 📋 今日變更摘要

### 核心邏輯
1. **社區名稱必填**（透天/店面選「無社區」）
2. **地址指紋優先比對** → 同棟樓自動合併
3. **社區名模糊比對** → 防打錯字
4. **新建社區 is_verified=FALSE** → 待審核
5. **上傳成功顯示確認頁** → 房仲檢查社區歸屬
6. **社區歸屬可修正** → PropertyEditPage

### 修改檔案清單
| 檔案 | 說明 |
|------|------|
| `supabase/migrations/20241201_property_community_link.sql` | 社區表 + Trigger |
| `src/pages/PropertyUploadPage.tsx` | 上傳頁 + 確認頁 |
| `src/components/ui/CommunityPicker.tsx` | 社區選擇器 |
| `src/services/propertyService.ts` | 比對邏輯 |
| `src/pages/PropertyEditPage.tsx` | 社區修正頁（新增）|
| `src/App.tsx` | 路由 |

---

## 1️⃣ SQL Schema

```sql
-- 檔案：20241201_property_community_link.sql
-- 功能：社區牆自動建立與比對

-- 0. 啟用模糊比對擴展 (需要 superuser 執行一次)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. communities 表
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  address_fingerprint TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  completeness_score INTEGER DEFAULT 20,
  district TEXT,
  city TEXT DEFAULT '台北市',
  building_age INTEGER,
  total_units INTEGER,
  management_fee INTEGER,
  story_vibe TEXT,
  two_good TEXT[],
  one_fair TEXT,
  resident_quote TEXT,
  best_for TEXT[],
  lifestyle_tags TEXT[],
  features TEXT[],
  cover_image TEXT,
  gallery TEXT[],
  score DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  property_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS 政策
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view communities" ON communities;
CREATE POLICY "Anyone can view communities" ON communities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create communities" ON communities;
CREATE POLICY "Authenticated users can create communities" ON communities FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update communities" ON communities;
CREATE POLICY "Authenticated users can update communities" ON communities FOR UPDATE TO authenticated USING (true);

-- 3. properties 表新增欄位
ALTER TABLE properties ADD COLUMN IF NOT EXISTS community_name TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS address_fingerprint TEXT;

-- 4. 索引
CREATE INDEX IF NOT EXISTS idx_properties_community_id ON properties(community_id);
CREATE INDEX IF NOT EXISTS idx_communities_name ON communities(name);
CREATE INDEX IF NOT EXISTS idx_communities_district ON communities(district);
CREATE INDEX IF NOT EXISTS idx_communities_fingerprint ON communities(address_fingerprint);

-- 5. 自動更新 property_count Trigger
CREATE OR REPLACE FUNCTION update_community_property_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.community_id IS NOT NULL THEN
    UPDATE communities SET property_count = (
      SELECT COUNT(*) FROM properties WHERE community_id = OLD.community_id
    ) WHERE id = OLD.community_id;
  END IF;
  IF NEW.community_id IS NOT NULL THEN
    UPDATE communities SET property_count = (
      SELECT COUNT(*) FROM properties WHERE community_id = NEW.community_id
    ) WHERE id = NEW.community_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_community_count ON properties;
CREATE TRIGGER trigger_update_community_count
  AFTER INSERT OR UPDATE OF community_id ON properties
  FOR EACH ROW EXECUTE FUNCTION update_community_property_count();
```

---

## 2️⃣ propertyService.ts

```typescript
import { supabase } from '../lib/supabase';

export interface PropertyFormInput {
  title: string;
  price: string;
  address: string;
  communityName: string;
  size: string;
  age: string;
  floorCurrent: string;
  floorTotal: string;
  rooms: string;
  halls: string;
  bathrooms: string;
  type: string;
  description: string;
  advantage1: string;
  advantage2: string;
  disadvantage: string;
  sourceExternalId: string;
}

export const propertyService = {
  uploadImages: async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const { error } = await supabase.storage.from('property-images').upload(fileName, file);
      if (error) return null;
      const { data } = supabase.storage.from('property-images').getPublicUrl(fileName);
      return data.publicUrl;
    });
    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => !!url);
  },

  createPropertyWithForm: async (form: PropertyFormInput, images: string[], existingCommunityId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const agentId = user?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    let communityId: string | null = existingCommunityId || null;
    let finalCommunityName = form.communityName?.trim() || null;
    let isNewCommunity = false;

    // 「無社區」跳過
    if (finalCommunityName === '無') {
      communityId = null;
    }
    // 已選現有社區
    else if (existingCommunityId) {
      // 直接使用
    }
    // 需查找或建立
    else if (form.address && finalCommunityName) {
      const addressFingerprint = form.address
        .replace(/[之\-－—]/g, '')
        .replace(/\d+樓.*$/, '')
        .replace(/\s+/g, '');

      // Step 1: 地址指紋比對
      if (addressFingerprint.length >= 5) {
        const { data: existingByAddress } = await supabase
          .from('communities')
          .select('id, name')
          .eq('address_fingerprint', addressFingerprint)
          .single();
        if (existingByAddress) {
          communityId = existingByAddress.id;
        }
      }

      // Step 2: 社區名比對
      if (!communityId && finalCommunityName.length >= 2) {
        const { data: exactMatch } = await supabase
          .from('communities')
          .select('id, name')
          .eq('name', finalCommunityName)
          .single();
        if (exactMatch) {
          communityId = exactMatch.id;
        }
      }

      // Step 3: 建立新社區
      if (!communityId) {
        const district = form.address.match(/([^市縣]+[區鄉鎮市])/)?.[1] || '';
        const city = form.address.match(/^(.*?[市縣])/)?.[1] || '台北市';
        const { data: newCommunity } = await supabase
          .from('communities')
          .insert({
            name: finalCommunityName,
            address: form.address,
            address_fingerprint: addressFingerprint,
            district, city,
            is_verified: false,
            completeness_score: 30,
            two_good: [form.advantage1, form.advantage2].filter(Boolean),
            one_fair: form.disadvantage || null,
          })
          .select('id')
          .single();
        if (newCommunity) {
          communityId = newCommunity.id;
          isNewCommunity = true;
        }
      }
    }

    const { data, error } = await supabase
      .from('properties')
      .insert({
        agent_id: agentId,
        title: form.title,
        price: Number(form.price),
        address: form.address,
        community_name: finalCommunityName,
        community_id: communityId,
        size: Number(form.size || 0),
        age: Number(form.age || 0),
        rooms: Number(form.rooms),
        halls: Number(form.halls),
        bathrooms: Number(form.bathrooms),
        property_type: form.type,
        advantage_1: form.advantage1,
        advantage_2: form.advantage2,
        disadvantage: form.disadvantage,
        description: form.description,
        images: images,
        source_platform: form.sourceExternalId ? '591' : 'MH',
        source_external_id: form.sourceExternalId || null
      })
      .select()
      .single();

    if (error) throw error;
    return { ...data, is_new_community: isNewCommunity };
  }
};
```

---

## 3️⃣ CommunityPicker.tsx

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Building2, Search, Plus, Check, Loader2, Home } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  address?: string;
  property_count?: number;
  is_verified?: boolean;
}

interface CommunityPickerProps {
  value: string;
  address: string;
  onChange: (name: string, communityId?: string) => void;
  className?: string;
  required?: boolean;
}

export function CommunityPicker({ value, address, onChange, className = '', required = false }: CommunityPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [suggestions, setSuggestions] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const computeAddressFingerprint = (addr: string): string => {
    return addr.replace(/[之\-－—]/g, '').replace(/\d+樓.*$/, '').replace(/\s+/g, '');
  };

  const searchCommunities = async (term: string, addr: string) => {
    if (!term && !addr) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const fingerprint = addr ? computeAddressFingerprint(addr) : '';
      if (fingerprint) {
        const { data: exactMatch } = await supabase
          .from('communities')
          .select('id, name, address, property_count, is_verified')
          .eq('address_fingerprint', fingerprint)
          .limit(1);
        if (exactMatch && exactMatch.length > 0) {
          setSuggestions(exactMatch);
          setLoading(false);
          return;
        }
      }
      let query = supabase.from('communities').select('id, name, address, property_count, is_verified').limit(5);
      if (term) query = query.ilike('name', `%${term}%`);
      const { data } = await query.order('property_count', { ascending: false });
      setSuggestions(data || []);
    } catch { setSuggestions([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchCommunities(searchTerm, address), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, address]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (community: Community) => {
    setSelectedCommunity(community);
    setSearchTerm(community.name);
    onChange(community.name, community.id === 'NONE' ? undefined : community.id);
    setIsOpen(false);
  };

  const handleSelectNoCommunity = () => {
    setSelectedCommunity({ id: 'NONE', name: '無' });
    setSearchTerm('無');
    onChange('無', undefined);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    if (!searchTerm.trim()) return;
    setSelectedCommunity(null);
    onChange(searchTerm.trim(), undefined);
    setIsOpen(false);
  };

  const showCreateOption = searchTerm.trim() && !suggestions.some(s => s.name === searchTerm.trim()) && searchTerm.length >= 2;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Building2 size={16} /></div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setSelectedCommunity(null); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="輸入或選擇社區名稱..."
          className={`w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border text-sm focus:ring-2 focus:ring-[#003366] outline-none ${selectedCommunity ? 'border-green-300 bg-green-50/50' : 'border-slate-200'}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? <Loader2 size={16} className="animate-spin text-slate-400" /> : selectedCommunity ? <Check size={16} className="text-green-600" /> : <Search size={16} className="text-slate-400" />}
        </div>
      </div>

      {selectedCommunity && selectedCommunity.name === '無' && (
        <p className="text-xs text-slate-500 mt-1">🏠 此物件為透天/店面，不歸入社區牆</p>
      )}
      {!selectedCommunity && searchTerm && searchTerm.length >= 2 && (
        <p className="text-xs text-amber-600 mt-1">⚠️ 將建立新社區「{searchTerm.trim()}」</p>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-80 overflow-y-auto">
          <button onClick={handleSelectNoCommunity} className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 border-b bg-slate-50/50">
            <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center"><Home size={16} className="text-slate-500" /></div>
            <div><span className="font-medium text-slate-600">無社區</span><span className="text-xs text-slate-400 ml-2">（透天、店面）</span></div>
          </button>

          {suggestions.map((c) => (
            <button key={c.id} onClick={() => handleSelect(c)} className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-start gap-3 border-b last:border-0">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><Building2 size={16} className="text-blue-600" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800 truncate">{c.name}</span>
                  {c.is_verified && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">已驗證</span>}
                </div>
                {c.address && <p className="text-xs text-slate-500 truncate">{c.address}</p>}
              </div>
            </button>
          ))}

          {showCreateOption && (
            <button onClick={handleCreateNew} className="w-full px-4 py-3 text-left hover:bg-amber-50 flex items-center gap-3 bg-amber-50/50 border-t">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center"><Plus size={16} className="text-white" /></div>
              <div><span className="font-medium text-amber-700">建立新社區：</span><span className="text-amber-600 ml-1">{searchTerm.trim()}</span></div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default CommunityPicker;
```

---

## 4️⃣ PropertyEditPage.tsx（新增）

```tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CommunityPicker } from '../components/ui/CommunityPicker';
import { Loader2, ArrowLeft, Home, Building2, AlertTriangle, Save } from 'lucide-react';

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

  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityId, setNewCommunityId] = useState<string | undefined>();
  const [hasChanges, setHasChanges] = useState(false);

  const isFixCommunityMode = searchParams.get('fix') === 'community';

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
      } catch (e: any) {
        setError('無法載入物件：' + e.message);
      } finally {
        setLoading(false);
      }
    };
    loadProperty();
  }, [publicId]);

  const handleCommunityChange = (name: string, communityId?: string) => {
    setNewCommunityName(name);
    setNewCommunityId(communityId);
    setHasChanges(name !== property?.community_name || communityId !== property?.community_id);
  };

  const handleSave = async () => {
    if (!property || !hasChanges) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('properties')
        .update({ community_id: newCommunityId || null, community_name: newCommunityName || null })
        .eq('id', property.id);
      if (error) throw error;
      navigate(`/property/${publicId}`, { state: { message: '社區歸屬已更新！' } });
    } catch (e: any) {
      setError('儲存失敗：' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={40} /></div>;
  if (error || !property) return <div className="min-h-screen flex items-center justify-center text-red-600">{error || '找不到物件'}</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b h-16 flex items-center px-4 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full mr-3"><ArrowLeft size={20} /></button>
        <div className="flex items-center text-[#003366] font-extrabold text-xl gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#003366] to-[#00A8E8] rounded-lg flex items-center justify-center text-white"><Home size={18} /></div>
          {isFixCommunityMode ? '修正社區歸屬' : '編輯物件'}
        </div>
      </nav>

      <main className="max-w-lg mx-auto p-6 py-8">
        <section className="bg-white p-5 rounded-2xl border shadow-sm mb-6">
          <h2 className="font-bold text-slate-800 mb-2">{property.title}</h2>
          <p className="text-sm text-slate-500">{property.address}</p>
        </section>

        <section className="bg-white p-5 rounded-2xl border shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4"><Building2 className="text-blue-600" size={20} /><h3 className="font-bold">社區歸屬</h3></div>
          <div className="mb-4 p-3 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">目前歸屬</p>
            <p className="font-medium text-slate-700">{property.community_name || '（無社區）'}</p>
          </div>
          <CommunityPicker value={newCommunityName} address={property.address} onChange={handleCommunityChange} required={true} />
          {hasChanges && (
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-sm text-amber-700 flex items-center gap-2"><AlertTriangle size={16} />將變更為：<span className="font-medium">{newCommunityName || '無'}</span></p>
            </div>
          )}
        </section>

        <button onClick={handleSave} disabled={!hasChanges || saving}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 ${hasChanges && !saving ? 'bg-gradient-to-r from-[#003366] to-[#00A8E8] text-white shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
          {saving ? <><Loader2 className="animate-spin" size={20} />儲存中...</> : <><Save size={20} />{hasChanges ? '確認修正' : '無變更'}</>}
        </button>
        <button onClick={() => navigate(-1)} className="w-full mt-3 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200">取消</button>
      </main>
    </div>
  );
};

export default PropertyEditPage;
```

---

## 5️⃣ App.tsx 路由變更

```tsx
// 新增 import
import PropertyEditPage from './pages/PropertyEditPage';

// 新增路由（在 Routes 內）
<Route path="/property/:publicId/edit" element={<PropertyEditPage />} />
```

---

## ✅ 部署前檢查

1. **SQL 已執行？** 在 Supabase Dashboard 執行完整 SQL
2. **TypeScript 編譯？** `npx tsc --noEmit` 無錯誤
3. **測試上傳流程**：填社區名 → 看確認頁 → 驗證社區歸屬

---

*打包完成 - 2024/12/01*
