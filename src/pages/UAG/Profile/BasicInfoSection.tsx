import React, { useMemo, useState } from 'react';
import type { AgentProfileMe, UpdateAgentProfilePayload } from '../../../types/agent.types';

const SPECIALTY_OPTIONS = [
  '台北市',
  '新北市',
  '桃園市',
  '台中市',
  '高雄市',
  '預售屋',
  '新成屋',
  '中古屋',
  '商辦',
  '店面',
  '透天',
  '公寓',
  '大樓',
  '別墅',
  '土地',
];

const CERTIFICATION_OPTIONS = ['不動產營業員', '不動產經紀人', '地政士', '估價師'];

interface BasicInfoSectionProps {
  profile: AgentProfileMe;
  isSaving: boolean;
  onSave: (payload: UpdateAgentProfilePayload) => Promise<void>;
}

const toDateInputValue = (value: string | null) => (value ? value.slice(0, 10) : '');

const toggleSelection = (items: string[], option: string) =>
  items.includes(option) ? items.filter((item) => item !== option) : [...items, option];

/**
 * 內部表單組件
 * 使用 key={profile.id} 在父組件中渲染，當 profile 更新時自動重新初始化所有狀態
 */
const BasicInfoForm: React.FC<BasicInfoSectionProps> = ({ profile, isSaving, onSave }) => {
  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState(profile.name);
  const [company, setCompany] = useState(profile.company ?? '邁房子');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [lineId, setLineId] = useState(profile.lineId ?? '');
  const [licenseNumber, setLicenseNumber] = useState(profile.licenseNumber ?? '');
  const [joinedAt, setJoinedAt] = useState(toDateInputValue(profile.joinedAt || profile.createdAt));
  const [specialties, setSpecialties] = useState<string[]>(profile.specialties ?? []);
  const [certifications, setCertifications] = useState<string[]>(profile.certifications ?? []);

  const payload = useMemo<UpdateAgentProfilePayload>(() => {
    const result: UpdateAgentProfilePayload = {
      name: name.trim(),
      company: company.trim() ? company.trim() : null,
      bio: bio.trim() ? bio.trim() : null,
      specialties,
      certifications,
      phone: phone.trim() ? phone.trim() : null,
      lineId: lineId.trim() ? lineId.trim() : null,
      licenseNumber: licenseNumber.trim() ? licenseNumber.trim() : null,
    };
    if (joinedAt) {
      result.joinedAt = new Date(joinedAt).toISOString();
    }
    return result;
  }, [name, company, bio, specialties, certifications, phone, lineId, licenseNumber, joinedAt]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSave(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">個人資料</h2>
          <p className="text-xs text-slate-500">此資料會顯示在房源與 UAG 後台</p>
        </div>
        <button
          type="submit"
          className="min-h-[44px] w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
          disabled={isSaving}
        >
          {isSaving ? '儲存中...' : '儲存變更'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="agent-name" className="text-sm font-medium text-slate-700">
            姓名
          </label>
          <input
            id="agent-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
            placeholder="輸入姓名"
            required
            aria-required="true"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="agent-company" className="text-sm font-medium text-slate-700">
            公司
          </label>
          <input
            id="agent-company"
            type="text"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
            placeholder="公司/分店名稱"
            maxLength={100}
            aria-label="公司名稱"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="agent-phone" className="text-sm font-medium text-slate-700">
            手機
          </label>
          <input
            id="agent-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
            placeholder="0912-345-678"
            aria-label="手機號碼"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="agent-line-id" className="text-sm font-medium text-slate-700">
            LINE ID
          </label>
          <input
            id="agent-line-id"
            type="text"
            inputMode="text"
            value={lineId}
            onChange={(event) => setLineId(event.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
            placeholder="line-id"
            aria-label="LINE ID"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="agent-joined-at" className="text-sm font-medium text-slate-700">
            加入日期
          </label>
          <input
            id="agent-joined-at"
            type="date"
            value={joinedAt}
            max={today}
            onChange={(event) => setJoinedAt(event.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
            aria-label="加入日期"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="agent-license" className="text-sm font-medium text-slate-700">
            經紀人證照字號
          </label>
          <input
            id="agent-license"
            type="text"
            value={licenseNumber}
            onChange={(event) => setLicenseNumber(event.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
            placeholder="例：(113)北市經紀字第004521號"
            aria-label="經紀人證照字號"
          />
          <p className="text-[10px] text-slate-400">填寫後可在詳情頁顯示認證資訊</p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="agent-bio" className="text-sm font-medium text-slate-700">
          自我介紹
        </label>
        <textarea
          id="agent-bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          className="min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
          placeholder="用 2-3 句話介紹自己"
          maxLength={500}
          aria-label="自我介紹"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">專長領域</p>
        <div className="flex flex-wrap gap-3">
          {SPECIALTY_OPTIONS.map((option) => {
            const selected = specialties.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => setSpecialties((prev) => toggleSelection(prev, option))}
                className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium transition ${
                  selected
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">證照</p>
        <div className="flex flex-wrap gap-3">
          {CERTIFICATION_OPTIONS.map((option) => {
            const selected = certifications.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => setCertifications((prev) => toggleSelection(prev, option))}
                className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium transition ${
                  selected
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </form>
  );
};

/**
 * BasicInfoSection 外層包裝
 * 使用 key={profile.id} 確保當 profile 更新時，表單狀態會自動重新初始化
 * 這是 React 推薦的做法，避免在 useEffect 中批量調用 setState
 */
export const BasicInfoSection: React.FC<BasicInfoSectionProps> = (props) => {
  return <BasicInfoForm key={props.profile.id} {...props} />;
};
