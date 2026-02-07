import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactModal from '../ContactModal';
import { createLead } from '../../services/leadService';

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(),
}));

vi.mock('../../services/leadService', () => ({
  createLead: vi.fn(),
}));

const mockedCreateLead = vi.mocked(createLead);

describe('ContactModal trust assure fallback integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCreateLead.mockResolvedValue({ success: true } as never);
  });

  it('trustAssureRequested=true 且無需求時，應附帶安心留痕備註', async () => {
    const user = userEvent.setup();

    render(
      <ContactModal
        isOpen={true}
        onClose={vi.fn()}
        propertyId="MH-100001"
        propertyTitle="測試物件"
        agentId="agent-001"
        agentName="測試經紀人"
        source="sidebar"
        defaultChannel="line"
        trustAssureRequested={true}
      />
    );

    await user.type(screen.getByLabelText(/姓名/), '王小明');
    await user.type(screen.getByLabelText(/電話/), '0912-345-678');
    await user.click(screen.getByRole('button', { name: /送出諮詢/ }));

    await waitFor(() => {
      expect(mockedCreateLead).toHaveBeenCalledTimes(1);
    });

    expect(mockedCreateLead).toHaveBeenCalledWith(
      expect.objectContaining({
        needsDescription: '使用者要求：同步處理安心留痕',
      })
    );
  });

  it('trustAssureRequested=true 且已有需求時，應附加安心留痕備註', async () => {
    const user = userEvent.setup();

    render(
      <ContactModal
        isOpen={true}
        onClose={vi.fn()}
        propertyId="MH-100001"
        propertyTitle="測試物件"
        agentId="agent-001"
        agentName="測試經紀人"
        source="sidebar"
        defaultChannel="line"
        trustAssureRequested={true}
      />
    );

    await user.type(screen.getByLabelText(/姓名/), '王小明');
    await user.type(screen.getByLabelText(/電話/), '0912-345-678');
    await user.type(screen.getByLabelText('其他需求或問題'), '希望近捷運');
    await user.click(screen.getByRole('button', { name: /送出諮詢/ }));

    await waitFor(() => {
      expect(mockedCreateLead).toHaveBeenCalledTimes(1);
    });

    expect(mockedCreateLead).toHaveBeenCalledWith(
      expect.objectContaining({
        needsDescription: '希望近捷運\n使用者要求：同步處理安心留痕',
      })
    );
  });
});
