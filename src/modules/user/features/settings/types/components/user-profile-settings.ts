import type { RefObject } from 'react';

import type { ToastQueue } from '@/components/types/ui-toast';

import type { ProfileLoadState, ProfileLoadStatus } from '../hooks/use-profile-load';

export interface UserProfileSettingsProps extends ProfileLoadState {
  readonly toasts: ToastQueue;
  readonly saveRef: RefObject<HTMLButtonElement | null>;
}

export interface ProfileLoadErrorProps {
  readonly onRetry: () => void;
  readonly focus: boolean;
}

export interface ProfileLoadAnnouncementsProps {
  readonly status: ProfileLoadStatus;
}

export type ProfileSkeletonSectionId = 'personal' | 'password';

export interface ProfileSkeletonSectionProps {
  readonly section: ProfileSkeletonSectionId;
}

export interface ProfileSkeletonFieldProps {
  readonly field: string;
}
