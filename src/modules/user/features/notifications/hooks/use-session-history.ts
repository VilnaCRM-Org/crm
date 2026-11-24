import { useLayoutEffect } from 'react';
import { useOutletContext } from 'react-router';

import type { ProtectedSessionContext } from '@/routes/types/protected-outlet-context';

import useNotificationRepository from './use-notification-repository';

export default function useSessionHistory(): void {
  const { session } = useOutletContext<ProtectedSessionContext>();
  const repository = useNotificationRepository();

  useLayoutEffect(() => {
    void repository.claim(session.token());
  }, [session, repository]);
}
