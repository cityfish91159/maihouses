import React from 'react';
import { AvatarUploaderCard } from './AvatarUploaderCard';
import { AvatarUploaderCompact } from './AvatarUploaderCompact';
import type {
  AvatarUploaderBaseProps,
  AvatarUploaderProps,
  AvatarUploaderVariant,
} from './displayTypes';

const AVATAR_VARIANT_COMPONENTS: Record<
  AvatarUploaderVariant,
  React.FC<AvatarUploaderBaseProps>
> = {
  card: AvatarUploaderCard,
  compact: AvatarUploaderCompact,
};

function isAvatarUploaderVariant(value: unknown): value is AvatarUploaderVariant {
  return value === 'card' || value === 'compact';
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({ variant = 'card', ...props }) => {
  const safeVariant = isAvatarUploaderVariant(variant) ? variant : 'card';
  const VariantComponent = AVATAR_VARIANT_COMPONENTS[safeVariant] ?? AVATAR_VARIANT_COMPONENTS.card;
  return <VariantComponent {...props} />;
};
