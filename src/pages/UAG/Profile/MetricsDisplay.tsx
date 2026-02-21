import React from 'react';
import { MetricsDisplayCard } from './MetricsDisplayCard';
import { MetricsDisplayCompact } from './MetricsDisplayCompact';
import type { MetricsDisplayProps, MetricsDisplayVariant } from './displayTypes';

const METRICS_VARIANT_COMPONENTS = {
  card: MetricsDisplayCard,
  default: MetricsDisplayCard,
  compact: MetricsDisplayCompact,
} as const;

function isMetricsDisplayVariant(value: unknown): value is MetricsDisplayVariant {
  return value === 'card' || value === 'compact' || value === 'default';
}

export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({
  variant = 'default',
  ...props
}) => {
  const safeVariant = isMetricsDisplayVariant(variant) ? variant : 'default';
  const VariantComponent =
    METRICS_VARIANT_COMPONENTS[safeVariant] ?? METRICS_VARIANT_COMPONENTS.default;
  return <VariantComponent {...props} />;
};
