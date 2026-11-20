import { inMemoryNotificationRepository } from '../repositories';
import type { NotificationRepository } from '../types/notification-repository';

export default function useNotificationRepository(): NotificationRepository {
  return inMemoryNotificationRepository;
}
