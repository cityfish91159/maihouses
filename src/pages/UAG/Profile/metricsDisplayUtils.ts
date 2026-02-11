import type { AgentProfileMe } from '../../../types/agent.types';

export interface MetricsDisplayViewModel {
  ratingText: string;
  ratingCount: number;
  serviceYearsText: string;
}

export function buildMetricsDisplayViewModel(profile: AgentProfileMe): MetricsDisplayViewModel {
  const hasRating = Number.isFinite(profile.serviceRating);
  const ratingText = hasRating ? profile.serviceRating.toFixed(1) : 'N/A';
  const ratingCount = Number.isFinite(profile.reviewCount) ? profile.reviewCount : 0;
  const serviceYearsText = Number.isFinite(profile.serviceYears) ? `${profile.serviceYears} 年` : 'N/A';

  return {
    ratingText,
    ratingCount,
    serviceYearsText,
  };
}
