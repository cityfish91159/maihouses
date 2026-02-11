import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BasicInfoSection } from '../BasicInfoSection';
import type { AgentProfileMe } from '../../../../types/agent.types';

const PROFILE_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

const buildProfileTabStorageKey = (prefix = 'uag-profile') => `${prefix}-${PROFILE_ID}-active-tab`;

function createProfile(overrides: Partial<AgentProfileMe> = {}): AgentProfileMe {
  return {
    id: PROFILE_ID,
    name: '測試房仲',
    avatarUrl: null,
    company: '邁房子',
    bio: null,
    specialties: [],
    certifications: [],
    phone: null,
    lineId: null,
    licenseNumber: '(113)北市經紀字第004521號',
    isVerified: true,
    verifiedAt: '2024-06-15T00:00:00Z',
    trustScore: 88,
    encouragementCount: 10,
    serviceRating: 4.8,
    reviewCount: 12,
    completedCases: 6,
    activeListings: 3,
    serviceYears: 4,
    joinedAt: '2021-01-01T00:00:00Z',
    internalCode: 12345,
    email: 'agent@maihouses.com',
    points: 1000,
    quotaS: 3,
    quotaA: 8,
    createdAt: '2021-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('BasicInfoSection (#15)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('keeps empty company input when profile.company is null', () => {
    render(
      <BasicInfoSection
        profile={createProfile({ company: null })}
        isSaving={false}
        onSave={vi.fn()}
      />
    );

    const companyInput = screen.getByLabelText('公司名稱');
    expect(companyInput).toHaveValue('');
    expect(screen.getByText('0/100')).toBeInTheDocument();
  });

  it('renders editable company input with initial value', () => {
    render(<BasicInfoSection profile={createProfile()} isSaving={false} onSave={vi.fn()} />);

    const companyInput = screen.getByLabelText('公司名稱');
    expect(companyInput).toHaveValue('邁房子');
    expect(companyInput).not.toBeDisabled();
    expect(companyInput).toHaveAttribute('autoComplete', 'organization');
    expect(companyInput).toHaveAttribute('aria-describedby', 'agent-company-help agent-company-count');
    expect(companyInput).toHaveAttribute('maxLength', '100');
    expect(companyInput).toHaveClass('min-h-[44px]');
    expect(screen.getByText('將顯示在房源頁與名片卡。')).toBeInTheDocument();
    expect(screen.getByText('3/100')).toBeInTheDocument();
  });

  it('keeps primary form controls touch-friendly on mobile', () => {
    render(<BasicInfoSection profile={createProfile()} isSaving={false} onSave={vi.fn()} />);

    expect(screen.getByLabelText('姓名')).toHaveClass('min-h-[44px]');
    expect(screen.getByLabelText('公司名稱')).toHaveClass('min-h-[44px]');
    expect(screen.getByLabelText('手機號碼')).toHaveClass('min-h-[44px]');
    expect(screen.getByLabelText('LINE ID')).toHaveClass('min-h-[44px]');
    expect(screen.getByLabelText('加入日期')).toHaveClass('min-h-[44px]');
    expect(screen.getByLabelText('經紀人證照字號')).toHaveClass('min-h-[44px]');
    expect(screen.getByRole('button', { name: '尚未修改' })).toHaveClass('min-h-[44px]');
  });

  it('disables submit before any edits and enables after field changes', async () => {
    const user = userEvent.setup();

    render(<BasicInfoSection profile={createProfile()} isSaving={false} onSave={vi.fn()} />);

    const initialButton = screen.getByRole('button', { name: '尚未修改' });
    expect(initialButton).toBeDisabled();

    const companyInput = screen.getByLabelText('公司名稱');
    await user.clear(companyInput);
    await user.type(companyInput, '邁房子信義店');

    const submitButton = screen.getByRole('button', { name: '儲存變更' });
    expect(submitButton).toBeEnabled();
  });

  it('renders license number input with initial value', () => {
    render(<BasicInfoSection profile={createProfile()} isSaving={false} onSave={vi.fn()} />);

    expect(screen.getByLabelText('經紀人證照字號')).toHaveValue('(113)北市經紀字第004521號');
  });

  it('submits updated license number via onSave payload', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<BasicInfoSection profile={createProfile()} isSaving={false} onSave={onSave} />);

    const licenseInput = screen.getByLabelText('經紀人證照字號');
    await user.clear(licenseInput);
    await user.type(licenseInput, '(114)北市經紀字第000001號');
    await user.click(screen.getByRole('button', { name: '儲存變更' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        licenseNumber: '(114)北市經紀字第000001號',
      })
    );
  });

  it('submits updated company via onSave payload', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<BasicInfoSection profile={createProfile()} isSaving={false} onSave={onSave} />);

    const companyInput = screen.getByLabelText('公司名稱');
    await user.clear(companyInput);
    await user.type(companyInput, '邁房子大安店');
    await user.click(screen.getByRole('button', { name: '儲存變更' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        company: '邁房子大安店',
      })
    );
  });

  it('submits company as null when company is cleared', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<BasicInfoSection profile={createProfile()} isSaving={false} onSave={onSave} />);

    const companyInput = screen.getByLabelText('公司名稱');
    await user.clear(companyInput);
    await user.click(screen.getByRole('button', { name: '儲存變更' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        company: null,
      })
    );
  });

  it('submits company as null when company contains only whitespace', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<BasicInfoSection profile={createProfile()} isSaving={false} onSave={onSave} />);

    const companyInput = screen.getByLabelText('公司名稱');
    await user.clear(companyInput);
    await user.type(companyInput, '   ');
    await user.click(screen.getByRole('button', { name: '儲存變更' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        company: null,
      })
    );
  });

  it('shows bio character counter', async () => {
    const user = userEvent.setup();

    render(<BasicInfoSection profile={createProfile()} isSaving={false} onSave={vi.fn()} />);

    const bioInput = screen.getByLabelText('自我介紹');
    expect(screen.getByText('0/500')).toBeInTheDocument();

    await user.type(bioInput, 'hello');
    expect(screen.getByText('5/500')).toBeInTheDocument();
  });

  it('adds noValidate to form to avoid browser native validation popup', () => {
    const { container } = render(
      <BasicInfoSection profile={createProfile()} isSaving={false} onSave={vi.fn()} />
    );

    expect(container.querySelector('form')).toHaveAttribute('novalidate');
  });

  it('shows phone format validation error on blur', async () => {
    const user = userEvent.setup();

    render(<BasicInfoSection profile={createProfile()} isSaving={false} onSave={vi.fn()} />);

    const phoneInput = screen.getByLabelText('手機號碼');
    await user.clear(phoneInput);
    await user.type(phoneInput, 'abc');
    await user.tab();

    expect(screen.getByText('請輸入正確手機號碼（09 開頭，共 10 碼）。')).toBeInTheDocument();
  });

  it('shows LINE ID validation error on blur', async () => {
    const user = userEvent.setup();

    render(<BasicInfoSection profile={createProfile()} isSaving={false} onSave={vi.fn()} />);

    const lineInput = screen.getByLabelText('LINE ID');
    await user.clear(lineInput);
    await user.type(lineInput, 'line id!');
    await user.tab();

    expect(screen.getByText('LINE ID 僅可包含英數、底線、點、@、減號。')).toBeInTheDocument();
  });

  it('persists selected tab in localStorage', async () => {
    const user = userEvent.setup();

    render(<BasicInfoSection profile={createProfile()} isSaving={false} onSave={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '專長證照' }));

    expect(window.localStorage.getItem(buildProfileTabStorageKey())).toBe('expertise');
  });

  it('supports custom storage key prefix', async () => {
    const user = userEvent.setup();

    render(
      <BasicInfoSection
        profile={createProfile()}
        isSaving={false}
        onSave={vi.fn()}
        storageKeyPrefix="uag-profile-agent"
      />
    );

    await user.click(screen.getByRole('button', { name: '專長證照' }));

    expect(window.localStorage.getItem(buildProfileTabStorageKey('uag-profile-agent'))).toBe(
      'expertise'
    );
  });
});
