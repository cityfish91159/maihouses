import { Info } from 'lucide-react';
import { STEP_ICONS_SVG } from '../../types/trust.types';

interface StepIconProps {
  stepKey: string;
  size?: number;
}

export function StepIcon({ stepKey, size = 14 }: StepIconProps) {
  const stepNum = parseInt(stepKey, 10);
  const IconComponent = STEP_ICONS_SVG[stepNum];
  return IconComponent ? <IconComponent size={size} /> : <Info size={size} />;
}
