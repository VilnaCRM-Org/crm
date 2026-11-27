import type { RefObject } from 'react';

import type { ProfileLoadState, ProfileLoadStatus } from '../hooks/use-profile-load';

export interface UserProfileSettingsProps extends ProfileLoadState {
  readonly saveRef: RefObject<HTMLElement | null>;
  readonly headingRef: RefObject<HTMLElement | null>;
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
