import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Award, Loader2, User } from 'lucide-react';
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
const PHONE_PATTERN = /^09\d{8}$/;
const LINE_ID_PATTERN = /^[a-z0-9_.@-]+$/i;
const DEFAULT_STORAGE_KEY_PREFIX = 'uag-profile';

type ProfileTab = 'basic' | 'expertise';
type ValidationField = 'name' | 'phone' | 'lineId';

interface FormStateInfo {
  hasUnsavedChanges: boolean;
  isSubmitDisabled: boolean;
}

interface BasicInfoSectionProps {
  profile: AgentProfileMe;
  isSaving: boolean;
  onSave: (payload: UpdateAgentProfilePayload) => Promise<void>;
  formId?: string;
  onFormStateChange?: (state: FormStateInfo) => void;
  storageKeyPrefix?: string;
}

interface ProfileFormValues {
  name: string;
  company: string;
  bio: string;
  specialties: string[];
  certifications: string[];
  phone: string;
  lineId: string;
  licenseNumber: string;
  joinedAt: string;
}

interface ProfileValidationErrors {
  name: string;
  phone: string;
  lineId: string;
}

const EMPTY_VALIDATION_ERRORS: ProfileValidationErrors = {
  name: '',
  phone: '',
  lineId: '',
};

const toDateInputValue = (value: string | null) => (value ? value.slice(0, 10) : '');

const toggleSelection = (items: string[], option: string) =>
  items.includes(option) ? items.filter((item) => item !== option) : [...items, option];

const isProfileTab = (value: string | null): value is ProfileTab =>
  value === 'basic' || value === 'expertise';

const getInitialProfileTab = (storageKey: string): ProfileTab => {
  if (typeof window === 'undefined') return 'basic';
  const storedValue = window.localStorage.getItem(storageKey);
  return isProfileTab(storedValue) ? storedValue : 'basic';
};

const validateName = (value: string) => (value.trim() ? '' : '請輸入姓名。');

const validatePhone = (value: string) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return '';
  return PHONE_PATTERN.test(trimmedValue) ? '' : '請輸入正確手機號碼（09 開頭，共 10 碼）。';
};

const validateLineId = (value: string) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return '';
  return LINE_ID_PATTERN.test(trimmedValue) ? '' : 'LINE ID 僅可包含英數、底線、點、@、減號。';
};

function buildProfilePayload(values: ProfileFormValues): UpdateAgentProfilePayload {
  const payload: UpdateAgentProfilePayload = {
    name: values.name.trim(),
    company: values.company.trim() ? values.company.trim() : null,
    bio: values.bio.trim() ? values.bio.trim() : null,
    specialties: values.specialties,
    certifications: values.certifications,
    phone: values.phone.trim() ? values.phone.trim() : null,
    lineId: values.lineId.trim() ? values.lineId.trim() : null,
    licenseNumber: values.licenseNumber.trim() ? values.licenseNumber.trim() : null,
  };

  if (values.joinedAt) {
    payload.joinedAt = new Date(values.joinedAt).toISOString();
  }

  return payload;
}

function useProfileFormValidation(values: Pick<ProfileFormValues, 'name' | 'phone' | 'lineId'>) {
  const [errors, setErrors] = useState<ProfileValidationErrors>(EMPTY_VALIDATION_ERRORS);

  const evaluateFieldError = (field: ValidationField, value?: string) => {
    if (field === 'name') {
      return validateName(value ?? values.name);
    }
    if (field === 'phone') {
      return validatePhone(value ?? values.phone);
    }
    return validateLineId(value ?? values.lineId);
  };

  const evaluateAllErrors = () => ({
    name: evaluateFieldError('name'),
    phone: evaluateFieldError('phone'),
    lineId: evaluateFieldError('lineId'),
  });

  const validateField = (field: ValidationField, value?: string) => {
    const nextFieldError = evaluateFieldError(field, value);
    setErrors((prev) => ({ ...prev, [field]: nextFieldError }));
    return !nextFieldError;
  };

  const validateAll = () => {
    const nextErrors = evaluateAllErrors();
    setErrors(nextErrors);
    return !nextErrors.name && !nextErrors.phone && !nextErrors.lineId;
  };

  const nextErrors = evaluateAllErrors();
  const hasErrors = Boolean(nextErrors.name || nextErrors.phone || nextErrors.lineId);

  return {
    errors,
    hasErrors,
    validateField,
    validateAll,
  };
}

const FieldError: React.FC<{ id: string; message: string }> = ({ id, message }) => (
  <p id={id} role="alert" className="mt-1 inline-flex items-start gap-1.5 text-sm text-red-600">
    <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
    <span>{message}</span>
  </p>
);

const BasicInfoForm: React.FC<BasicInfoSectionProps> = ({
  profile,
  isSaving,
  onSave,
  formId,
  onFormStateChange,
  storageKeyPrefix = DEFAULT_STORAGE_KEY_PREFIX,
}) => {
  const profileTabStorageKey = `${storageKeyPrefix}-${profile.id}-active-tab`;
  const [activeTab, setActiveTab] = useState<ProfileTab>(() => getInitialProfileTab(profileTabStorageKey));
  const today = new Date().toISOString().slice(0, 10);

  const initialValues = useMemo<ProfileFormValues>(
    () => ({
      name: profile.name,
      company: profile.company ?? '',
      bio: profile.bio ?? '',
      phone: profile.phone ?? '',
      lineId: profile.lineId ?? '',
      licenseNumber: profile.licenseNumber ?? '',
      joinedAt: toDateInputValue(profile.joinedAt || profile.createdAt),
      specialties: profile.specialties ?? [],
      certifications: profile.certifications ?? [],
    }),
    [
      profile.name,
      profile.company,
      profile.bio,
      profile.phone,
      profile.lineId,
      profile.licenseNumber,
      profile.joinedAt,
      profile.createdAt,
      profile.specialties,
      profile.certifications,
    ]
  );

  const [name, setName] = useState(initialValues.name);
  const [company, setCompany] = useState(initialValues.company);
  const [bio, setBio] = useState(initialValues.bio);
  const [phone, setPhone] = useState(initialValues.phone);
  const [lineId, setLineId] = useState(initialValues.lineId);
  const [licenseNumber, setLicenseNumber] = useState(initialValues.licenseNumber);
  const [joinedAt, setJoinedAt] = useState(initialValues.joinedAt);
  const [specialties, setSpecialties] = useState<string[]>(initialValues.specialties);
  const [certifications, setCertifications] = useState<string[]>(initialValues.certifications);

  const payload = useMemo<UpdateAgentProfilePayload>(() => {
    return buildProfilePayload({
      name,
      company,
      bio,
      specialties,
      certifications,
      phone,
      lineId,
      licenseNumber,
      joinedAt,
    });
  }, [name, company, bio, specialties, certifications, phone, lineId, licenseNumber, joinedAt]);

  const initialPayload = useMemo(() => buildProfilePayload(initialValues), [initialValues]);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(payload) !== JSON.stringify(initialPayload),
    [payload, initialPayload]
  );

  const { errors, hasErrors: hasValidationErrors, validateField, validateAll } =
    useProfileFormValidation({
      name,
      phone,
      lineId,
    });

  const isSubmitDisabled = isSaving || !hasUnsavedChanges || hasValidationErrors;

  useEffect(() => {
    onFormStateChange?.({ hasUnsavedChanges, isSubmitDisabled });
  }, [hasUnsavedChanges, isSubmitDisabled, onFormStateChange]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(profileTabStorageKey, activeTab);
  }, [activeTab, profileTabStorageKey]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitDisabled) return;
    if (!validateAll()) return;
    await onSave(payload);
  };

  return (
    <form
      id={formId}
      noValidate
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
          className="hidden min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto lg:inline-flex"
          disabled={isSubmitDisabled}
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin motion-reduce:animate-none" />
              儲存中...
            </>
          ) : hasUnsavedChanges ? (
            '儲存變更'
          ) : (
            '尚未修改'
          )}
        </button>
      </div>

      <div className="border-b border-slate-200">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`relative flex min-h-[44px] items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none ${
              activeTab === 'basic' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <User size={16} />
            基本資料
            {activeTab === 'basic' && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-900" />}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expertise')}
            className={`relative flex min-h-[44px] items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none ${
              activeTab === 'expertise'
                ? 'text-slate-900'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Award size={16} />
            專長證照
            {activeTab === 'expertise' && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-900" />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'basic' && (
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
                  value={name}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setName(nextValue);
                    validateField('name', nextValue);
                  }}
                  onBlur={() => validateField('name')}
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
                  公司
                </label>
                <input
                  id="agent-company"
                  type="text"
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
                  placeholder="公司/分店名稱"
                  autoComplete="organization"
                  enterKeyHint="done"
                  maxLength={100}
                  aria-label="公司名稱"
                  aria-describedby="agent-company-help agent-company-count"
                />
                <div className="flex items-center justify-between gap-3">
                  <p id="agent-company-help" className="text-sm text-slate-500">
                    將顯示在房源頁與名片卡。
                  </p>
                  <p id="agent-company-count" className="shrink-0 text-sm text-slate-500">
                    {(company ?? '').length}/100
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
                  手機
                </label>
                <input
                  id="agent-phone"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setPhone(nextValue);
                    validateField('phone', nextValue);
                  }}
                  onBlur={() => validateField('phone')}
                  className={`min-h-[44px] w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors ${
                    errors.phone
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-1'
                      : 'border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-1'
                  }`}
                  placeholder="09xxxxxxxx"
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
                  value={lineId}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setLineId(nextValue);
                    validateField('lineId', nextValue);
                  }}
                  onBlur={() => validateField('lineId')}
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
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">自我介紹</h3>
            <textarea
              id="agent-bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              className="min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
              placeholder="用 2-3 句話介紹自己"
              maxLength={500}
              aria-label="自我介紹"
              aria-describedby="agent-bio-count"
            />
            <p id="agent-bio-count" className="text-sm text-slate-500">
              {bio.length}/500
            </p>
          </section>
        </div>
      )}

      {activeTab === 'expertise' && (
        <>
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
        </>
      )}
    </form>
  );
};

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = (props) => {
  return <BasicInfoForm key={props.profile.id} {...props} />;
};
