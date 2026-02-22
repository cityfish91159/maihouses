import React from 'react';
import { Loader2 } from 'lucide-react';
import { PROFILE_STORAGE_KEY_PREFIX } from '../../../constants/profile';
import type { AgentProfileMe, UpdateAgentProfilePayload } from '../../../types/agent.types';
import { PROFILE_TAB_CONFIG } from './config/tabConfig';
import { ProfileBasicTabPanel } from './components/ProfileBasicTabPanel';
import { ProfileExpertiseTabPanel } from './components/ProfileExpertiseTabPanel';
import { useFormOrchestration } from './hooks/useFormOrchestration';
import type { ProfileTab } from './hooks/usePersistedTab';

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

interface TabButtonProps {
  tab: ProfileTab;
  activeTab: ProfileTab;
  onClick: (tab: ProfileTab) => void;
}

interface ProfileFormHeaderProps {
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  isSubmitDisabled: boolean;
}

interface ProfileTabPanelsProps {
  activeTab: ProfileTab;
  values: ReturnType<typeof useFormOrchestration>['values'];
  today: string;
  errors: ReturnType<typeof useFormOrchestration>['errors'];
  handlers: ReturnType<typeof useFormOrchestration>['handlers'];
}

const ProfileTabButton: React.FC<TabButtonProps> = ({ tab, activeTab, onClick }) => {
  const isActive = activeTab === tab;
  const config = PROFILE_TAB_CONFIG[tab];
  const Icon = config.icon;

  return (
    <button
      id={config.buttonId}
      type="button"
      role="tab"
      aria-label={config.label}
      aria-selected={isActive}
      aria-controls={config.panelId}
      onClick={() => onClick(tab)}
      className={`relative flex min-h-[44px] items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none ${
        isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      <Icon size={16} />
      {config.label}
      {isActive && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-900" />}
    </button>
  );
};

const ProfileFormHeader: React.FC<ProfileFormHeaderProps> = ({
  isSaving,
  hasUnsavedChanges,
  isSubmitDisabled,
}) => (
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
);

const ProfileTabNavigation: React.FC<Pick<TabButtonProps, 'activeTab' | 'onClick'>> = ({
  activeTab,
  onClick,
}) => (
  <div className="border-b border-slate-200">
    <div role="tablist" aria-label="個人資料分頁" className="flex gap-2">
      <ProfileTabButton tab="basic" activeTab={activeTab} onClick={onClick} />
      <ProfileTabButton tab="expertise" activeTab={activeTab} onClick={onClick} />
    </div>
  </div>
);

const ProfileTabPanels: React.FC<ProfileTabPanelsProps> = ({
  activeTab,
  values,
  today,
  errors,
  handlers,
}) => (
  <>
    <div
      id={PROFILE_TAB_CONFIG.basic.panelId}
      role="tabpanel"
      aria-labelledby={PROFILE_TAB_CONFIG.basic.buttonId}
      hidden={activeTab !== 'basic'}
    >
      {activeTab === 'basic' && (
        <ProfileBasicTabPanel
          values={values}
          errors={errors}
          today={today}
          onNameChange={handlers.onNameChange}
          onNameBlur={handlers.onNameBlur}
          onCompanyChange={handlers.onCompanyChange}
          onPhoneChange={handlers.onPhoneChange}
          onPhoneBlur={handlers.onPhoneBlur}
          onLineIdChange={handlers.onLineIdChange}
          onLineIdBlur={handlers.onLineIdBlur}
          onJoinedAtChange={handlers.onJoinedAtChange}
          onLicenseNumberChange={handlers.onLicenseNumberChange}
          onBioChange={handlers.onBioChange}
        />
      )}
    </div>
    <div
      id={PROFILE_TAB_CONFIG.expertise.panelId}
      role="tabpanel"
      aria-labelledby={PROFILE_TAB_CONFIG.expertise.buttonId}
      hidden={activeTab !== 'expertise'}
    >
      {activeTab === 'expertise' && (
        <ProfileExpertiseTabPanel
          specialties={values.specialties}
          certifications={values.certifications}
          onToggleSpecialty={handlers.onToggleSpecialty}
          onToggleCertification={handlers.onToggleCertification}
        />
      )}
    </div>
  </>
);

const BasicInfoForm: React.FC<BasicInfoSectionProps> = ({
  profile,
  isSaving,
  onSave,
  formId,
  onFormStateChange,
  storageKeyPrefix = PROFILE_STORAGE_KEY_PREFIX,
}) => {
  const orchestration = useFormOrchestration({
    profile,
    isSaving,
    onSave,
    onFormStateChange,
    storageKeyPrefix,
  });

  return (
    <form
      id={formId}
      noValidate
      onSubmit={orchestration.handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6"
    >
      <ProfileFormHeader
        isSaving={orchestration.isSaving}
        hasUnsavedChanges={orchestration.hasUnsavedChanges}
        isSubmitDisabled={orchestration.isSubmitDisabled}
      />
      <ProfileTabNavigation
        activeTab={orchestration.activeTab}
        onClick={orchestration.setActiveTab}
      />
      <ProfileTabPanels
        activeTab={orchestration.activeTab}
        values={orchestration.values}
        today={orchestration.today}
        errors={orchestration.errors}
        handlers={orchestration.handlers}
      />
    </form>
  );
};

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = (props) => {
  return <BasicInfoForm key={props.profile.id} {...props} />;
};
