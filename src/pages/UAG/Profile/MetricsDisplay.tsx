import React from 'react';
import type { AgentProfileMe } from '../../../types/agent.types';
import { MetricsDisplayCard } from './MetricsDisplayCard';
import { MetricsDisplayCompact } from './MetricsDisplayCompact';

export type MetricsDisplayVariant = 'card' | 'compact' | 'default';

export interface MetricsDisplayProps {
  profile: AgentProfileMe;
  variant?: MetricsDisplayVariant;
  className?: string;
}

const METRICS_VARIANT_COMPONENTS = {
  card: MetricsDisplayCard,
  default: MetricsDisplayCard,
  compact: MetricsDisplayCompact,
} as const;

export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ variant = 'default', ...props }) => {
  const VariantComponent = METRICS_VARIANT_COMPONENTS[variant];
  return <VariantComponent {...props} />;
};
