import { useMemo } from 'react';
import { useOutletContext } from 'react-router';

import type { ProtectedSessionContext } from '@/routes/types/protected-outlet-context';

import { SessionNotificationRepository } from '../repositories';
import type { NotificationRepository } from '../types/notification-repository';

import useNotificationRepository from './use-notification-repository';

export default function useSessionRepository(): NotificationRepository {
  const { session } = useOutletContext<ProtectedSessionContext>();
  const repository = useNotificationRepository();

  return useMemo(
    () => new SessionNotificationRepository(repository, session.token()),
    [repository, session]
  );
}
