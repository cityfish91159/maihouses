import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { PaymentTimer } from '../PaymentTimer';

const agentRole = 'agent' as const;
const buyerRole = 'buyer' as const;

describe('PaymentTimer', () => {
  it('renders agent payment button and triggers pay', async () => {
    const user = userEvent.setup();
    const onPay = vi.fn();
    render(
      <PaymentTimer
        timeLeft="00:10:00"
        role={agentRole}
        isBusy={false}
        amount={2000}
        onPay={onPay}
      />
    );

    await user.click(screen.getByRole('button', { name: /房仲代付/ }));
    expect(onPay).toHaveBeenCalledTimes(1);
  });

  it('shows buyer waiting text', () => {
    render(
      <PaymentTimer
        timeLeft="00:10:00"
        role={buyerRole}
        isBusy={false}
        amount={2000}
        onPay={() => {}}
      />
    );
    expect(screen.getByText('等待房仲付款...')).toBeInTheDocument();
  });
});
