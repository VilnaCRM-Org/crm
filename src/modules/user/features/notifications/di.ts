import type { DependencyContainer } from 'tsyringe';

import type { ModuleRegistrar } from '@/config/types/module-registrar';

import { inMemoryNotificationRepository } from './repositories';
import NOTIFICATION_TOKENS from './tokens';
import type { NotificationRepository } from './types/notification-repository';

class NotificationsRegistrar implements ModuleRegistrar {
  public register(container: DependencyContainer): void {
    container.register<NotificationRepository>(NOTIFICATION_TOKENS.NotificationRepository, {
      useValue: inMemoryNotificationRepository,
    });
  }
}

export default new NotificationsRegistrar();
