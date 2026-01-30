interface PaymentTimerProps {
  timeLeft: string;
  role: 'agent' | 'buyer';
  isBusy: boolean;
  amount: number;
  onPay: () => void;
}

export function PaymentTimer({ timeLeft, role, isBusy, amount, onPay }: PaymentTimerProps) {
  const getButtonText = () => {
    if (timeLeft === '已逾期') return '付款已截止';
    if (isBusy) return '處理中...';
    return `房仲代付 NT$ ${amount.toLocaleString()}`;
  };

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
      <div className="mb-1 font-mono text-2xl font-bold text-amber-700">{timeLeft}</div>
      <div className="mb-3 text-xs text-amber-600">付款截止</div>
      {role === 'agent' ? (
        <button
          onClick={onPay}
          disabled={isBusy || timeLeft === '已逾期'}
          aria-disabled={isBusy || timeLeft === '已逾期'}
          className={`w-full min-h-[48px] rounded py-3 font-bold text-white shadow ${
            timeLeft === '已逾期'
              ? 'cursor-not-allowed bg-border text-text-muted'
              : 'bg-gradient-to-r from-brand-600 to-brand-700 hover:shadow-lg'
          }`}
        >
          {getButtonText()}
        </button>
      ) : (
        <div className="text-xs text-text-muted">等待房仲付款...</div>
      )}
    </div>
  );
}
