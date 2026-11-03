import type { UserDisplayName } from '@/modules/user/types/lib/user-display-name';

import type { CurrentUserReadOutcome } from '../current-user/current-user-read';

export type CurrentUserStatus = 'pending' | 'ready' | 'failed';

export interface CurrentUserState {
  readonly status: CurrentUserStatus;
  readonly identity: UserDisplayName | null;
}

export interface CurrentUserSettlement {
  readonly outcome: CurrentUserReadOutcome;
  readonly previous: CurrentUserState;
}
