import type { ProfileLoadState } from '../hooks/use-profile-load';

export type UserProfileSettingsProps = ProfileLoadState;

export interface ProfileLoadErrorProps {
  readonly onRetry: () => void;
  readonly focus: boolean;
}
