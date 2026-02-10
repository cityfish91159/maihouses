import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BasicInfoSection } from '../BasicInfoSection';
import type { AgentProfileMe } from '../../../../types/agent.types';

function createProfile(overrides: Partial<AgentProfileMe> = {}): AgentProfileMe {
  return {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
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
  it('renders editable company input with initial value', () => {
    render(<BasicInfoSection profile={createProfile()} isSaving={false} onSave={vi.fn()} />);

    const companyInput = screen.getByLabelText('公司名稱');
    expect(companyInput).toHaveValue('邁房子');
    expect(companyInput).not.toBeDisabled();
    expect(companyInput).toHaveAttribute('maxLength', '100');
    expect(companyInput).toHaveClass('min-h-[44px]');
  });

  it('keeps primary form controls touch-friendly on mobile', () => {
    render(<BasicInfoSection profile={createProfile()} isSaving={false} onSave={vi.fn()} />);

    expect(screen.getByLabelText('姓名')).toHaveClass('min-h-[44px]');
    expect(screen.getByLabelText('公司名稱')).toHaveClass('min-h-[44px]');
    expect(screen.getByLabelText('手機號碼')).toHaveClass('min-h-[44px]');
    expect(screen.getByLabelText('LINE ID')).toHaveClass('min-h-[44px]');
    expect(screen.getByLabelText('加入日期')).toHaveClass('min-h-[44px]');
    expect(screen.getByLabelText('經紀人證照字號')).toHaveClass('min-h-[44px]');
    expect(screen.getByRole('button', { name: '儲存變更' })).toHaveClass('min-h-[44px]');
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
});
