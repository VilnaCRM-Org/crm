import { type Dispatch, useEffect, useReducer } from 'react';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { UserEntity } from '@/modules/user/types/user/user-entity';
import { useService } from '@/providers/di';

import type ProfileProvider from '../data-providers/profile-provider';
import type {
  ConfirmUserAction,
  ProfileLoadAction,
  ProfileLoadReducerState,
  ProfileLoadState,
} from '../types/hooks/use-profile-load';

const INITIAL_STATE: ProfileLoadReducerState = {
  status: 'loading',
  user: null,
  version: 0,
  refocus: false,
  attempt: 0,
};

function confirmUser(user: UserEntity | null, action: ConfirmUserAction): UserEntity | null {
  return user !== null && user.email === action.email
    ? { ...user, confirmed: action.confirmed }
    : user;
}

function reduceProfileLoad(
  state: ProfileLoadReducerState,
  action: ProfileLoadAction
): ProfileLoadReducerState {
  if (action.type === 'retry') {
    return { ...state, status: 'loading', refocus: true, attempt: state.attempt + 1 };
  }
  if (action.type === 'adopt') {
    return { ...state, user: action.user, version: state.version + 1, refocus: false };
  }
  const settled: Partial<ProfileLoadReducerState> =
    action.type === 'loaded'
      ? { status: 'ready', user: action.user }
      : action.type === 'failed'
        ? { status: 'failed', user: null }
        : { user: confirmUser(state.user, action) };
  return { ...state, ...settled };
}

async function loadProfile(
  provider: ProfileProvider,
  signal: AbortSignal,
  dispatch: Dispatch<ProfileLoadAction>
): Promise<void> {
  const outcome = await provider.read(signal);
  if (signal.aborted) return;
  if (outcome.kind === 'ok') dispatch({ type: 'loaded', user: outcome.user });
  else if (outcome.reason !== 'session_ended') dispatch({ type: 'failed' });
}

export default function useProfileLoad(): ProfileLoadState {
  const provider = useService<ProfileProvider>(AUTH_TOKENS.ProfileProvider);
  const [state, dispatch] = useReducer(reduceProfileLoad, INITIAL_STATE);

  useEffect(() => {
    const controller = new AbortController();
    void loadProfile(provider, controller.signal, dispatch);
    return (): void => controller.abort();
  }, [provider, state.attempt]);

  return {
    status: state.status,
    user: state.user,
    version: state.version,
    refocus: state.refocus,
    retry: (): void => dispatch({ type: 'retry' }),
    adoption: {
      adopt: (user: UserEntity): void => dispatch({ type: 'adopt', user }),
      confirm: (email: string, confirmed: boolean): void =>
        dispatch({ type: 'confirm', email, confirmed }),
    },
  };
}
