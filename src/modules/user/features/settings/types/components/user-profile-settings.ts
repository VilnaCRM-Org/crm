import type { RefObject } from 'react';

import type { ToastQueue } from '@/components/types/ui-toast';

import type { ProfileLoadState } from '../hooks/use-profile-load';

export interface UserProfileSettingsProps extends ProfileLoadState {
  readonly toasts: ToastQueue;
  readonly saveRef: RefObject<HTMLButtonElement | null>;
}

export interface ProfileLoadErrorProps {
  readonly onRetry: () => void;
  readonly focus: boolean;
}
