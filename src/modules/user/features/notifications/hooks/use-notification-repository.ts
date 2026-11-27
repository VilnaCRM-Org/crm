import { createContext, useContext } from 'react';

import { inMemoryNotificationRepository } from '../repositories';
import type { NotificationRepository } from '../types/notification-repository';

export const NotificationRepositoryContext = createContext<NotificationRepository>(
  inMemoryNotificationRepository
);

export default function useNotificationRepository(): NotificationRepository {
  return useContext(NotificationRepositoryContext);
}
