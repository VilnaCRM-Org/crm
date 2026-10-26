import type UserDisplayNameMapper from '@/modules/user/store/user-display-name-mapper';
import type { UserDisplayName } from '@/modules/user/types/lib/user-display-name';

import type { ProfileReadOutcome } from '../user-profile';

export type CurrentUserStatus = 'pending' | 'ready' | 'failed';

export interface CurrentUserState {
  readonly status: CurrentUserStatus;
  readonly identity: UserDisplayName | null;
}

export interface CurrentUserSettlement {
  readonly outcome: ProfileReadOutcome;
  readonly mapper: UserDisplayNameMapper;
  readonly previous: CurrentUserState;
}
