import type { UserDisplayName } from '@/modules/user/types/lib/user-display-name';
import type { ProtectedSession } from '@/routes/types/protected-outlet-context';

export type CurrentUserFailureReason = 'session_ended' | 'unavailable';

export interface CurrentUserIdentityOutcome {
  readonly kind: 'ok';
  readonly identity: UserDisplayName;
}

export interface CurrentUserFailedOutcome {
  readonly kind: 'failed';
  readonly reason: CurrentUserFailureReason;
}

export type CurrentUserReadOutcome = CurrentUserIdentityOutcome | CurrentUserFailedOutcome;

export interface CurrentUserRequest {
  readonly token: string;
  readonly requestId: string;
  readonly signal: AbortSignal;
}

export interface CurrentUserAttempt extends CurrentUserRequest {
  readonly session: ProtectedSession;
}

export interface CurrentUserResponse {
  readonly status: number;
  readonly text: string;
}

export type CurrentUserFailureCause = 'unauthorized' | 'denied' | 'unavailable';

export interface CurrentUserNameParse {
  readonly kind: 'ok';
  readonly fullName: string;
}

export interface CurrentUserErrorParse {
  readonly kind: 'failed';
  readonly reason: CurrentUserFailureCause;
  readonly error: Error;
}

export type CurrentUserParse = CurrentUserNameParse | CurrentUserErrorParse;
