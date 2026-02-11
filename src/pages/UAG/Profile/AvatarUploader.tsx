import React from 'react';
import { AvatarUploaderCard } from './AvatarUploaderCard';
import { AvatarUploaderCompact } from './AvatarUploaderCompact';

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

const AVATAR_VARIANT_COMPONENTS: Record<
  AvatarUploaderVariant,
  React.FC<AvatarUploaderBaseProps>
> = {
  card: AvatarUploaderCard,
  compact: AvatarUploaderCompact,
};

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({ variant = 'card', ...props }) => {
  const VariantComponent = AVATAR_VARIANT_COMPONENTS[variant];
  return <VariantComponent {...props} />;
};
