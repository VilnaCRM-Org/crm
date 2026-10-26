import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type UserDisplayNameMapper from '@/modules/user/store/user-display-name-mapper';
import { useService } from '@/providers/di';

import type ProfileProvider from '../data-providers/profile-provider';
import type { CurrentUserState, CurrentUserSettlement } from '../types/hooks/use-current-user';

const PENDING: CurrentUserState = { status: 'pending', identity: null };

const FAILED: CurrentUserState = { status: 'failed', identity: null };

const settle = ({ outcome, mapper, previous }: CurrentUserSettlement): CurrentUserState => {
  if (outcome.kind === 'ok') {
    return { status: 'ready', identity: mapper.fromFullName(outcome.user.fullName) };
  }

  return outcome.reason === 'session_ended' ? previous : FAILED;
};

export default function useCurrentUser(): CurrentUserState {
  const provider = useService<ProfileProvider>(AUTH_TOKENS.ProfileProvider);
  const mapper = useService<UserDisplayNameMapper>(AUTH_TOKENS.UserDisplayNameMapper);
  const { pathname } = useLocation();
  const [state, setState] = useState(PENDING);

  useEffect(() => {
    const controller = new AbortController();
    void provider.read(controller.signal).then((outcome) => {
      if (!controller.signal.aborted) setState((previous) => settle({ outcome, mapper, previous }));
    });

    return (): void => controller.abort();
  }, [provider, mapper, pathname]);

  return state;
}
