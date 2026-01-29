/**
 * 智能社區選擇器 (Smart Community Picker)
 *
 * 功能：
 * 1. 根據地址自動搜尋現有社區
 * 2. 支援手動輸入新社區名稱
 * 3. 地址模糊比對
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Building2, Search, Plus, Check, Loader2, Home } from 'lucide-react';
import { computeAddressFingerprint } from '../../utils/address';
import { logger } from '../../lib/logger';

interface Community {
  id: string;
  name: string;
  address?: string;
  property_count?: number;
  is_verified?: boolean;
}

interface CommunityPickerProps {
  value: string;
  address: string; // 物件地址，用於智能比對
  onChange: (name: string, communityId?: string) => void;
  className?: string;
  required?: boolean; // 是否必填
}

// [NASA TypeScript Safety] 使用 satisfies 確保類型安全
// 無社區選項（透天、店面用）
const NO_COMMUNITY_OPTION: Community = {
  id: 'NONE',
  name: '無',
  address: '透天/店面/獨棟',
};

export function CommunityPicker({
  value,
  address,
  onChange,
  className = '',
  required = false,
}: CommunityPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [suggestions, setSuggestions] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchIdRef = useRef<number>(0); // 用於識別最新請求

  // 從地址提取區域
  const extractDistrict = (addr: string): string => {
    const match = addr.match(/([^市縣]+[區鄉鎮市])/);
    return match?.[1] || '';
  };

  // 搜尋社區（含 race condition 防護）
  const searchCommunities = useCallback(async (term: string, addr: string) => {
    if (!term && !addr) {
      setSuggestions([]);
      return;
    }

    // 取消前一個請求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const currentSearchId = ++searchIdRef.current;

    setLoading(true);
    try {
      const district = extractDistrict(addr);
      const fingerprint = addr ? computeAddressFingerprint(addr) : '';

      // 策略 1: 用地址指紋精準匹配
      if (fingerprint) {
        const { data: exactMatch } = await supabase
          .from('communities')
          .select('id, name, address, property_count, is_verified')
          .eq('address_fingerprint', fingerprint)
          .limit(1)
          .abortSignal(abortControllerRef.current.signal);

        // 確保是最新請求的結果
        if (currentSearchId !== searchIdRef.current) return;

        if (exactMatch && exactMatch.length > 0) {
          setSuggestions(exactMatch);
          setLoading(false);
          return;
        }
      }

      // 策略 2: 用名稱模糊搜尋
      let query = supabase
        .from('communities')
        .select('id, name, address, property_count, is_verified')
        .limit(8); // 增加到 8 筆

      if (term) {
        query = query.ilike('name', `%${term}%`);
      }

      if (district) {
        query = query.eq('district', district);
      }

      const { data, error } = await query
        .order('property_count', { ascending: false })
        .abortSignal(abortControllerRef.current.signal);

      // 確保是最新請求的結果
      if (currentSearchId !== searchIdRef.current) return;

      if (error) throw error;
      setSuggestions(data || []);
    } catch (err) {
      // 忽略 abort 錯誤
      if (err instanceof Error && err.name === 'AbortError') return;
      logger.error('搜尋社區失敗', { error: err });
      setSuggestions([]);
    } finally {
      // 只有最新請求才更新 loading 狀態
      if (currentSearchId === searchIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Debounce 搜尋
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCommunities(searchTerm, address);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, address, searchCommunities]);

  // 清理 AbortController
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 點擊外部關閉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // [NASA TypeScript Safety] 使用 instanceof 類型守衛驗證 DOM 節點
      const target = e.target;
      if (!(target instanceof Node)) return;

      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 選擇現有社區
  const handleSelect = (community: Community) => {
    setSelectedCommunity(community);
    setSearchTerm(community.name);
    // 「無」社區不傳 ID
    const communityId = community.id === 'NONE' ? undefined : community.id;
    onChange(community.name, communityId);
    setIsOpen(false);
  };

  // 選擇「無社區」
  const handleSelectNoCommunity = () => {
    // [NASA TypeScript Safety] NO_COMMUNITY_OPTION 已有明確類型定義
    setSelectedCommunity(NO_COMMUNITY_OPTION);
    setSearchTerm('無');
    onChange('無', undefined);
    setIsOpen(false);
  };

  // 建立新社區
  const handleCreateNew = () => {
    if (!searchTerm.trim()) return;
    setSelectedCommunity(null);
    onChange(searchTerm.trim(), undefined);
    setIsOpen(false);
  };

  // 判斷是否為完整社區名
  const isValidCommunityName = (name: string): { valid: boolean; reason?: string } => {
    const trimmed = name.trim();

    // 長度檢查
    if (trimmed.length < 2) {
      return { valid: false, reason: '名稱太短' };
    }

    // 排除過於泛用的詞
    const genericWords = /^(透天|店面|華廈|公寓|套房|大樓|A棟|B棟|C區|[A-Z]\d*棟?)$/;
    if (genericWords.test(trimmed)) {
      return { valid: false, reason: '請輸入正式社區名稱' };
    }

    // 排除純地址（只有路街巷號但沒有社區名）
    if (/^.*[路街巷弄]\d+號?$/.test(trimmed) && !/社區|大樓|花園|莊園/.test(trimmed)) {
      return { valid: false, reason: '這看起來是地址而非社區名' };
    }

    // 排除廣告詞
    if (/超便宜|稀有|唯一|急售|降價|特價/.test(trimmed)) {
      return { valid: false, reason: '請輸入正式社區名稱' };
    }

    // 包含社區相關關鍵字 → 優先通過
    if (/社區|大樓|花園|莊園|雅築|官邸|華廈|別墅|山莊|天廈|豪邸|期$/.test(trimmed)) {
      return { valid: true };
    }

    // 其他情況：長度 >= 3 且為中文則通過
    if (trimmed.length >= 3 && /^[\u4e00-\u9fa5\d]+$/.test(trimmed)) {
      return { valid: true };
    }

    return { valid: false, reason: '建議填寫正式社區名稱' };
  };

  const nameValidation = isValidCommunityName(searchTerm);
  const showCreateOption =
    searchTerm.trim() &&
    !suggestions.some((s) => s.name === searchTerm.trim()) &&
    nameValidation.valid;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* 輸入框 */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Building2 size={16} />
        </div>
        <input
          id="community-search"
          name="communitySearch"
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setSelectedCommunity(null);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="輸入或選擇社區名稱..."
          className={`w-full rounded-xl border bg-slate-50 px-10 py-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-[#003366] ${selectedCommunity ? 'border-green-300 bg-green-50/50' : 'border-slate-200'} `}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 size={16} className="animate-spin text-slate-400" />
          ) : selectedCommunity ? (
            <Check size={16} className="text-green-600" />
          ) : (
            <Search size={16} className="text-slate-400" />
          )}
        </div>
      </div>

      {/* 狀態提示 */}
      {selectedCommunity && selectedCommunity.name !== '無' && (
        <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
          <Check size={12} />
          已選擇「{selectedCommunity.name}」
          {selectedCommunity.property_count ? ` (${selectedCommunity.property_count} 個物件)` : ''}
        </p>
      )}
      {selectedCommunity && selectedCommunity.name === '無' && (
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          🏠 此物件為透天/店面，不歸入社區牆
        </p>
      )}
      {!selectedCommunity && searchTerm && nameValidation.valid && (
        <p className="mt-1 text-xs text-amber-600">
          ⚠️ 將建立新社區「{searchTerm.trim()}
          」，請確認名稱正確（系統會比對相似名稱）
        </p>
      )}
      {!selectedCommunity && searchTerm && !nameValidation.valid && searchTerm.length >= 2 && (
        <p className="mt-1 text-xs text-amber-600">
          ⚠️ {nameValidation.reason || '建議填寫正式社區名稱'}
          （如：遠雄之星8期、惠文新象）
        </p>
      )}

      {/* 下拉選單 */}
      {isOpen && (
        <div className="absolute z-dropdown mt-1 max-h-80 w-full overflow-hidden overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {/* 無社區選項 - 放最上面 */}
          <button
            onClick={handleSelectNoCommunity}
            className="flex w-full items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-3 text-left hover:bg-slate-50"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-200">
              <Home size={16} className="text-slate-500" />
            </div>
            <div>
              <span className="font-medium text-slate-600">無社區</span>
              <span className="ml-2 text-xs text-slate-400">（透天、店面、獨棟）</span>
            </div>
          </button>

          {/* 現有社區 */}
          {suggestions.map((community) => (
            <button
              key={community.id}
              onClick={() => handleSelect(community)}
              className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <Building2 size={16} className="text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-slate-800">{community.name}</span>
                  {community.is_verified && (
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">
                      已驗證
                    </span>
                  )}
                </div>
                {community.address && (
                  <p className="truncate text-xs text-slate-500">{community.address}</p>
                )}
                {community.property_count ? (
                  <p className="text-xs text-slate-400">{community.property_count} 個物件</p>
                ) : null}
              </div>
            </button>
          ))}

          {/* 建立新社區選項 */}
          {showCreateOption && (
            <button
              onClick={handleCreateNew}
              className="flex w-full items-center gap-3 border-t border-amber-100 bg-amber-50/50 px-4 py-3 text-left hover:bg-amber-50"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500">
                <Plus size={16} className="text-white" />
              </div>
              <div>
                <span className="font-medium text-amber-700">建立新社區：</span>
                <span className="ml-1 text-amber-600">{searchTerm.trim()}</span>
                <p className="mt-0.5 text-xs text-amber-600">⚠️ 請確認找不到才建立</p>
              </div>
            </button>
          )}

          {/* 沒有結果提示 */}
          {suggestions.length === 0 && !showCreateOption && searchTerm.length >= 2 && !loading && (
            <div className="px-4 py-6 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100">
                <Search size={20} className="text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">未找到相似社區</p>
              <p className="mt-1 text-xs text-slate-400">請確認名稱後選擇「建立新社區」</p>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && suggestions.length === 0 && (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex animate-pulse items-center gap-3">
                  <div className="size-8 rounded-lg bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-slate-200" />
                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CommunityPicker;
