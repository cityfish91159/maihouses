import { render, screen, within } from '@testing-library/react';
import type { AgentProfileMe } from '../../../types/agent.types';
import { MetricsDisplay } from './MetricsDisplay';

function createProfile(overrides: Partial<AgentProfileMe> = {}): AgentProfileMe {
  return {
    id: 'agent-001',
    internalCode: 1001,
    name: '測試房仲',
    avatarUrl: null,
    company: '邁房子',
    bio: null,
    specialties: [],
    certifications: [],
    phone: '0912000000',
    lineId: 'agent_line',
    licenseNumber: '(113)北市經紀字第004521號',
    isVerified: true,
    verifiedAt: '2024-01-01T00:00:00Z',
    trustScore: 87,
    encouragementCount: 12,
    serviceRating: 4.8,
    reviewCount: 32,
    completedCases: 45,
    activeListings: 10,
    serviceYears: 4,
    joinedAt: '2021-01-01',
    visitCount: 100,
    dealCount: 20,
    email: 'agent@maihouses.com',
    points: 1000,
    quotaS: 3,
    quotaA: 8,
    createdAt: '2021-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('MetricsDisplay (#21b-P9)', () => {
  it('default variant should highlight trust score card with brand token classes', () => {
    render(<MetricsDisplay profile={createProfile()} />);

    const trustLabel = screen.getByText('信任分');
    const trustRow = trustLabel.closest('div')?.parentElement;

    expect(trustRow).toHaveClass('bg-brand-50');
    expect(trustRow).toHaveClass('border-brand-200');

    const trustValue = within(trustRow as HTMLElement).getByText('87');
    expect(trustValue).toHaveClass('text-brand-700');
  });

  it('default variant should keep non-trust cards as slate borders', () => {
    render(<MetricsDisplay profile={createProfile()} />);

    const ratingLabel = screen.getByText('服務評價');
    const ratingRow = ratingLabel.closest('div')?.parentElement;

    expect(ratingRow).toHaveClass('border-slate-200');
    expect(ratingRow).toHaveClass('bg-slate-50');
  });

  it('compact variant should also highlight trust tile with brand token classes', () => {
    render(<MetricsDisplay profile={createProfile()} variant="compact" />);

    const trustLabel = screen.getByText('信任分');
    const trustTile = trustLabel.closest('div');

    expect(trustTile).toHaveClass('bg-brand-50');
    expect(trustTile).toHaveClass('border-brand-200');
  });
});
