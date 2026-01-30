import { Lock, Megaphone } from 'lucide-react';
import type { Step, Transaction } from '../../types/trust';
import { ChecklistPanel } from './ChecklistPanel';
import { PaymentTimer } from './PaymentTimer';
import { StepActions } from './StepActions';
import { SupplementList } from './SupplementList';

interface StepContentState {
  isCurrent: boolean;
  role: 'agent' | 'buyer';
  isBusy: boolean;
  inputValue: string;
  timeLeft: string;
  isPaid: boolean;
  supplements: Transaction['supplements'];
  agentPaymentAmount: number;
}

interface StepContentHandlers {
  onInputChange: (value: string) => void;
  onSubmit: (stepKey: string) => void;
  onConfirm: (stepKey: string) => void;
  onPay: () => void;
  onToggleCheck: (id: string, checked: boolean) => void;
}

interface StepContentProps {
  stepKey: string;
  step: Step;
  state: StepContentState;
  handlers: StepContentHandlers;
}

export function StepContent({
  stepKey,
  step,
  state,
  handlers,
}: StepContentProps) {
  const { isCurrent, role, isBusy, inputValue, timeLeft, isPaid, supplements, agentPaymentAmount } =
    state;
  const { onInputChange, onSubmit, onConfirm, onPay, onToggleCheck } = handlers;

  return (
    <>
      <div className="mb-3 flex items-start justify-between">
        <h3 className="flex items-center gap-2 font-bold text-ink-900">
          {step.name}
          {stepKey === '5' && step.paymentStatus === 'initiated' && !step.locked && (
            <span className="animate-pulse rounded border border-amber-200 bg-amber-50 px-2 text-xs font-medium text-amber-700">
              付款中
            </span>
          )}
          {stepKey === '5' && step.paymentStatus === 'expired' && (
            <span className="border-danger/20 bg-danger/10 rounded border px-2 text-xs font-medium text-danger">
              逾期
            </span>
          )}
        </h3>
        {step.locked && <Lock size={14} className="text-success" />}
      </div>

      {stepKey === '2' && step.data.note && (
        <div className="mb-3 rounded-lg border border-border bg-bg-base p-3">
          <div className="mb-2 flex items-center gap-2 border-b border-border pb-2">
            <Megaphone className="size-4 text-brand-600" />
            <span className="text-xs font-semibold text-text-muted">房仲帶看紀錄</span>
          </div>
          <div className="whitespace-pre-wrap text-sm">{step.data.note}</div>
        </div>
      )}

      {stepKey === '5' && step.paymentStatus === 'initiated' && !step.locked && (
        <PaymentTimer
          timeLeft={timeLeft}
          role={role}
          isBusy={isBusy}
          amount={agentPaymentAmount}
          onPay={onPay}
        />
      )}

      {stepKey === '6' && !step.locked && isPaid && (
        <ChecklistPanel
          checklist={step.checklist ?? []}
          onToggle={onToggleCheck}
          onConfirm={() => onConfirm('6')}
        />
      )}

      <StepActions
        stepKey={stepKey}
        step={step}
        role={role}
        isBusy={isBusy}
        isCurrent={isCurrent}
        inputValue={inputValue}
        onInputChange={onInputChange}
        onSubmit={onSubmit}
        onConfirm={onConfirm}
      />

      {step.data.buyerNote && (
        <div className="border-success/20 bg-success/5 mt-2 rounded border p-2 text-xs text-success">
          <span className="font-bold">買方留言：</span> {step.data.buyerNote}
        </div>
      )}

      <SupplementList supplements={supplements} />
    </>
  );
}
