import { Loader2 } from 'lucide-react';
import type { Step } from '../../types/trust';

interface StepActionsProps {
  stepKey: string;
  step: Step;
  role: 'agent' | 'buyer';
  isBusy: boolean;
  isCurrent: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (stepKey: string) => void;
  onConfirm: (stepKey: string) => void;
}

interface AgentActionsProps {
  stepKey: string;
  step: Step;
  isBusy: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (stepKey: string) => void;
}

function AgentActions({
  stepKey,
  step,
  isBusy,
  inputValue,
  onInputChange,
  onSubmit,
}: AgentActionsProps) {
  if (step.agentStatus !== 'pending') {
    return (
      <div className="rounded-lg bg-bg-base py-2 text-center text-xs text-text-muted">
        等待買方確認...
      </div>
    );
  }

  return (
    <div>
      <textarea
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        className="mb-2 w-full rounded-lg border border-border p-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        placeholder="輸入紀錄..."
        aria-label="輸入紀錄"
      />
      <button
        onClick={() => onSubmit(stepKey)}
        disabled={isBusy}
        className="min-h-[48px] w-full rounded-lg bg-brand-700 py-3 text-sm font-medium text-white transition hover:bg-brand-600"
      >
        {isBusy ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="size-4 animate-spin" /> 處理中
          </span>
        ) : (
          '送出'
        )}
      </button>
    </div>
  );
}

interface BuyerActionsProps {
  stepKey: string;
  step: Step;
  isBusy: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  onConfirm: (stepKey: string) => void;
}

function BuyerActions({
  stepKey,
  step,
  isBusy,
  inputValue,
  onInputChange,
  onConfirm,
}: BuyerActionsProps) {
  if (step.agentStatus !== 'submitted') {
    return <div className="py-2 text-center text-xs text-text-muted">房仲還沒送出</div>;
  }

  return (
    <div>
      <p className="mb-2 text-xs text-text-muted">房仲已提交，請核對：</p>
      <div className="mb-2 whitespace-pre-wrap rounded-lg border border-border bg-bg-base p-2 text-sm">
        {step.data.note || '（已提交表單）'}
      </div>

      <textarea
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        className="focus:ring-success/20 mb-2 w-full rounded-lg border border-border p-2 text-sm outline-none transition focus:border-success focus:ring-2"
        placeholder="留言給房仲 (選填)..."
        aria-label="留言給房仲"
      />

      <button
        onClick={() => onConfirm(stepKey)}
        disabled={isBusy}
        className="min-h-[48px] w-full rounded-lg bg-success py-3 text-sm font-medium text-white transition hover:brightness-95"
      >
        {isBusy ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="size-4 animate-spin" /> 處理中
          </span>
        ) : (
          '確認送出'
        )}
      </button>
    </div>
  );
}

export function StepActions({
  stepKey,
  step,
  role,
  isBusy,
  isCurrent,
  inputValue,
  onInputChange,
  onSubmit,
  onConfirm,
}: StepActionsProps) {
  const showCurrentActions = !step.locked && isCurrent && stepKey !== '5' && stepKey !== '6';
  const showStep5Actions = stepKey === '5' && !step.locked && step.paymentStatus === 'pending';

  return (
    <>
      {showCurrentActions && (
        <div>
          {role === 'agent' ? (
            <AgentActions
              stepKey={stepKey}
              step={step}
              isBusy={isBusy}
              inputValue={inputValue}
              onInputChange={onInputChange}
              onSubmit={onSubmit}
            />
          ) : (
            <BuyerActions
              stepKey={stepKey}
              step={step}
              isBusy={isBusy}
              inputValue={inputValue}
              onInputChange={onInputChange}
              onConfirm={onConfirm}
            />
          )}
        </div>
      )}

      {showStep5Actions && (
        <div>
          {role === 'agent' && step.agentStatus === 'pending' && (
            <button
              onClick={() => onSubmit('5')}
              disabled={isBusy}
              aria-busy={isBusy}
              className="min-h-[48px] w-full rounded-lg bg-brand-700 py-3 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="size-4 animate-spin" /> 處理中
                </span>
              ) : (
                '上傳合約並送出'
              )}
            </button>
          )}
          {role === 'buyer' && step.agentStatus === 'submitted' && (
            <button
              onClick={() => onConfirm('5')}
              disabled={isBusy}
              aria-busy={isBusy}
              className="min-h-[48px] w-full rounded-lg bg-success py-3 font-medium text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="size-4 animate-spin" /> 處理中
                </span>
              ) : (
                '確認合約（啟動付款）'
              )}
            </button>
          )}
        </div>
      )}
    </>
  );
}
