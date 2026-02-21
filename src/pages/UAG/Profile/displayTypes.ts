import type { AgentProfileMe } from '../../../types/agent.types';

export type AvatarUploaderVariant = 'card' | 'compact';

export interface AvatarUploaderBaseProps {
  name: string;
  avatarUrl: string | null;
  isUploading: boolean;
  onUpload: (file: File) => Promise<void>;
  className?: string;
}

export interface AvatarUploaderProps extends AvatarUploaderBaseProps {
  variant?: AvatarUploaderVariant;
}

export type MetricsDisplayVariant = 'card' | 'compact' | 'default';

export interface MetricsDisplayProps {
  profile: AgentProfileMe;
  variant?: MetricsDisplayVariant;
  className?: string;
}
