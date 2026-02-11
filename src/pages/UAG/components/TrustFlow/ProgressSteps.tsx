/**
 * ProgressSteps - 進度步驟顯示組件
 *
 * [code-simplifier] 從 TrustFlow.tsx 抽取的子組件
 */

import React from 'react';
import { Check } from 'lucide-react';
import { STEPS } from './constants';

interface ProgressStepsProps {
  currentStep: number;
}

export function ProgressSteps({ currentStep }: ProgressStepsProps) {
  return (
    <div className="mb-2 flex items-center">
      {STEPS.map((step, idx) => {
        const isPast = step.key < currentStep;
        const isCurrent = step.key === currentStep;
        const Icon = step.icon;

        return (
          <React.Fragment key={step.key}>
            <div className="flex-1 text-center">
              <div
                className={`mx-auto mb-1 flex size-8 items-center justify-center rounded-full transition-all duration-300 ${
                  isPast
                    ? 'bg-green-600 text-white'
                    : isCurrent
                      ? 'bg-brand text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isPast ? <Check size={16} /> : <Icon size={14} />}
              </div>
              <div
                className={`text-[11px] ${
                  isCurrent ? 'font-bold' : 'font-medium'
                } ${isPast ? 'text-green-600' : isCurrent ? 'text-brand' : 'text-slate-400'}`}
              >
                {step.name}
              </div>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`mb-5 h-0.5 flex-[0.5] ${isPast ? 'bg-green-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
