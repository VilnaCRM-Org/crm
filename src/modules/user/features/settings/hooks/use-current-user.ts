import { useEffect, useState } from 'react';
import { useLocation, useOutletContext } from 'react-router';

import type { ProtectedSessionContext } from '@/routes/types/protected-outlet-context';

import type { CurrentUserSettlement, CurrentUserState } from '../types/hooks/use-current-user';
import currentUserSource from '../utils/current-user-source';

const PENDING: CurrentUserState = { status: 'pending', identity: null };

const FAILED: CurrentUserState = { status: 'failed', identity: null };

const settle = ({ outcome, previous }: CurrentUserSettlement): CurrentUserState => {
  if (outcome.kind === 'ok') return { status: 'ready', identity: outcome.identity };

  if (outcome.reason === 'session_ended') return PENDING;

  return previous.status === 'ready' ? previous : FAILED;
};

export default function useCurrentUser(): CurrentUserState {
  const { session } = useOutletContext<ProtectedSessionContext>();
  const { pathname } = useLocation();
  const [state, setState] = useState(PENDING);

  useEffect(() => {
    const controller = new AbortController();
    void currentUserSource.read(session, controller.signal).then((outcome) => {
      if (!controller.signal.aborted) setState((previous) => settle({ outcome, previous }));
    });

    return (): void => controller.abort();
  }, [session, pathname]);

  return state;
}
