import { useEffect } from 'react';
import { useOutletContext } from 'react-router';

import type { ProtectedSessionContext } from '@/routes/types/protected-outlet-context';

import useNotificationRepository from './use-notification-repository';

export default function useSessionHistory(): void {
  const { session } = useOutletContext<ProtectedSessionContext>();
  const repository = useNotificationRepository();

  useEffect(
    () => (): void => {
      if (session.token() === null) void repository.forget();
    },
    [session, repository]
  );
}
