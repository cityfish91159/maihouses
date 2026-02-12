import React from 'react';
import {
  PROFILE_MAX_BIO_LENGTH,
  PROFILE_MAX_COMPANY_LENGTH,
} from '../../../../constants/profile';
import type { ProfileFormValues } from '../hooks/useProfileFormState';
import type { ProfileValidationErrors } from '../hooks/useProfileFormValidation';
import { FieldError } from './FieldError';

interface ProfileBasicTabPanelProps {
  values: Pick<
    ProfileFormValues,
    'name' | 'company' | 'phone' | 'lineId' | 'joinedAt' | 'licenseNumber' | 'bio'
  >;
  errors: ProfileValidationErrors;
  today: string;
  onNameChange: (value: string) => void;
  onNameBlur: () => void;
  onCompanyChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onPhoneBlur: () => void;
  onLineIdChange: (value: string) => void;
  onLineIdBlur: () => void;
  onJoinedAtChange: (value: string) => void;
  onLicenseNumberChange: (value: string) => void;
  onBioChange: (value: string) => void;
}

export const ProfileBasicTabPanel: React.FC<ProfileBasicTabPanelProps> = ({
  values,
  errors,
  today,
  onNameChange,
  onNameBlur,
  onCompanyChange,
  onPhoneChange,
  onPhoneBlur,
  onLineIdChange,
  onLineIdBlur,
  onJoinedAtChange,
  onLicenseNumberChange,
  onBioChange,
}) => {
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">個人資訊</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="agent-name" className="text-sm font-medium text-slate-700">
              姓名
            </label>
            <input
              id="agent-name"
              type="text"
              value={values.name}
              onChange={(event) => onNameChange(event.target.value)}
              onBlur={onNameBlur}
              className={`min-h-[44px] w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors ${
                errors.name
                  ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-1'
                  : 'border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-1'
              }`}
              placeholder="輸入姓名"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'agent-name-error' : undefined}
            />
            {errors.name ? <FieldError id="agent-name-error" message={errors.name} /> : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="agent-company" className="text-sm font-medium text-slate-700">
              公司名稱
            </label>
            <input
              id="agent-company"
              type="text"
              value={values.company}
              onChange={(event) => onCompanyChange(event.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
              placeholder="公司/分店名稱"
              autoComplete="organization"
              enterKeyHint="done"
              maxLength={PROFILE_MAX_COMPANY_LENGTH}
              aria-label="公司名稱"
              aria-describedby="agent-company-help agent-company-count"
            />
            <div className="flex items-center justify-between gap-3">
              <p id="agent-company-help" className="text-sm text-slate-500">
                將顯示在房源頁與名片卡。
              </p>
              <p id="agent-company-count" className="shrink-0 text-sm text-slate-500">
                {values.company.length}/{PROFILE_MAX_COMPANY_LENGTH}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">聯絡方式</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="agent-phone" className="text-sm font-medium text-slate-700">
              手機號碼
            </label>
            <input
              id="agent-phone"
              type="tel"
              inputMode="tel"
              value={values.phone}
              onChange={(event) => onPhoneChange(event.target.value)}
              onBlur={onPhoneBlur}
              className={`min-h-[44px] w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors ${
                errors.phone
                  ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-1'
                  : 'border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-1'
              }`}
              placeholder="09xx-xxx-xxx"
              pattern="09[0-9]{8}"
              aria-label="手機號碼"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'agent-phone-error' : undefined}
            />
            {errors.phone ? <FieldError id="agent-phone-error" message={errors.phone} /> : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="agent-line-id" className="text-sm font-medium text-slate-700">
              LINE ID
            </label>
            <input
              id="agent-line-id"
              type="text"
              inputMode="text"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={values.lineId}
              onChange={(event) => onLineIdChange(event.target.value)}
              onBlur={onLineIdBlur}
              className={`min-h-[44px] w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors ${
                errors.lineId
                  ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-1'
                  : 'border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-1'
              }`}
              placeholder="line-id"
              aria-label="LINE ID"
              aria-invalid={Boolean(errors.lineId)}
              aria-describedby={errors.lineId ? 'agent-line-id-error' : undefined}
            />
            {errors.lineId ? <FieldError id="agent-line-id-error" message={errors.lineId} /> : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="agent-joined-at" className="text-sm font-medium text-slate-700">
              加入日期
            </label>
            <input
              id="agent-joined-at"
              type="date"
              value={values.joinedAt}
              max={today}
              onChange={(event) => onJoinedAtChange(event.target.value)}
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
              value={values.licenseNumber}
              onChange={(event) => onLicenseNumberChange(event.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
              placeholder="例：(113)北市經紀字第004521號"
              aria-label="經紀人證照字號"
            />
            <p className="text-[10px] text-slate-400">填寫後可在詳情頁顯示認證資訊</p>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">自我介紹</h3>
        <textarea
          id="agent-bio"
          value={values.bio}
          onChange={(event) => onBioChange(event.target.value)}
          className="min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
          placeholder="用 2-3 句話介紹自己"
          maxLength={PROFILE_MAX_BIO_LENGTH}
          aria-label="自我介紹"
          aria-describedby="agent-bio-count"
        />
        <p id="agent-bio-count" className="text-sm text-slate-500">
          {values.bio.length}/{PROFILE_MAX_BIO_LENGTH}
        </p>
      </section>
    </div>
  );
};
