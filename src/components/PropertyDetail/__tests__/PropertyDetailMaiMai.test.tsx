import { act, render, screen } from '@testing-library/react';
import { PropertyDetailMaiMai } from '../PropertyDetailMaiMai';
import { track } from '../../../analytics/track';

vi.mock('../../../analytics/track', () => ({
  track: vi.fn().mockResolvedValue(undefined),
}));

describe('PropertyDetailMaiMai', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows default welcome copy when trust is disabled and not hot', () => {
    render(
      <PropertyDetailMaiMai
        trustEnabled={false}
        isHot={false}
        trustCasesCount={0}
        agentName="游杰倫"
        propertyId="MH-100001"
      />
    );

    expect(screen.getAllByText(/歡迎看屋/).length).toBeGreaterThan(0);
    expect(track).toHaveBeenCalledWith(
      'maimai_property_mood',
      expect.objectContaining({ propertyId: 'MH-100001', mood: 'idle', trigger: 'default' })
    );
  });

  it('shows trust-enabled copy', () => {
    render(
      <PropertyDetailMaiMai
        trustEnabled={true}
        isHot={false}
        trustCasesCount={0}
        agentName="游杰倫"
        propertyId="MH-100001"
      />
    );

    expect(screen.getAllByText('這位房仲有開啟安心留痕，交易更有保障').length).toBeGreaterThan(0);
    expect(track).toHaveBeenCalledWith(
      'maimai_property_mood',
      expect.objectContaining({
        propertyId: 'MH-100001',
        mood: 'happy',
        trigger: 'trust_enabled',
      })
    );
  });

  it('clamps trust case count in hot message', () => {
    const { rerender } = render(
      <PropertyDetailMaiMai
        trustEnabled={true}
        isHot={true}
        trustCasesCount={-5}
        agentName="游杰倫"
        propertyId="MH-100001"
      />
    );

    expect(screen.getAllByText('這間好搶手！已經有 0 組在看了').length).toBeGreaterThan(0);

    rerender(
      <PropertyDetailMaiMai
        trustEnabled={true}
        isHot={true}
        trustCasesCount={99999}
        agentName="游杰倫"
        propertyId="MH-100001"
      />
    );
    expect(screen.getAllByText('這間好搶手！已經有 999 組在看了').length).toBeGreaterThan(0);
  });

  it('switches to thinking copy after idle timeout', () => {
    vi.useFakeTimers();

    render(
      <PropertyDetailMaiMai
        trustEnabled={false}
        isHot={false}
        trustCasesCount={0}
        agentName="游杰倫"
        propertyId="MH-100001"
      />
    );

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getAllByText('還在考慮嗎？可以加 LINE 先聊聊看').length).toBeGreaterThan(0);
    expect(track).toHaveBeenCalledWith(
      'maimai_property_mood',
      expect.objectContaining({ propertyId: 'MH-100001', mood: 'thinking', trigger: 'idle_timer' })
    );
  });
});
