/**
 * ProgressSteps - 進度步驟顯示組件
 *
 * [code-simplifier] 從 TrustFlow.tsx 抽取的子組件
 */

import React from "react";
import { Check } from "lucide-react";
import { STEPS } from "./constants";

interface ProgressStepsProps {
  currentStep: number;
}

export function ProgressSteps({ currentStep }: ProgressStepsProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        marginBottom: 8,
      }}
    >
      {STEPS.map((step, idx) => {
        const isPast = step.key < currentStep;
        const isCurrent = step.key === currentStep;
        const Icon = step.icon;

        return (
          <React.Fragment key={step.key}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  margin: "0 auto 4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isPast
                    ? "#16a34a"
                    : isCurrent
                      ? "#1749d7"
                      : "#e5e7eb",
                  color: isPast || isCurrent ? "#fff" : "#6b7280",
                  transition: "all 0.3s",
                }}
              >
                {isPast ? <Check size={16} /> : <Icon size={14} />}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: isCurrent ? 700 : 500,
                  color: isPast
                    ? "#16a34a"
                    : isCurrent
                      ? "#1749d7"
                      : "#94a3b8",
                }}
              >
                {step.name}
              </div>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                style={{
                  flex: 0.5,
                  height: 2,
                  background: isPast ? "#16a34a" : "#e5e7eb",
                  marginBottom: 20,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
