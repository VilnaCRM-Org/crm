import type { SocialSignInErrorKind } from './social-sign-in-error-kind';

export interface SocialSignInErrorViewProps {
  readonly kind: SocialSignInErrorKind;
  readonly providerLabel: string;
  readonly onRetry?: (() => void) | undefined;
}

export interface SocialSignInErrorRow {
  readonly messageKey: string;
  readonly retryable: boolean;
}

export type SocialSignInErrorTable = {
  readonly [Kind in SocialSignInErrorKind]: SocialSignInErrorRow;
};
