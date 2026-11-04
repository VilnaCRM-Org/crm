import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import observabilityCore from '@/services/observability/observability-core';

// Retry once, never reload: a reload here would discard the registration result the
// notification exists to show (issue #147).
const registrationNotificationLoader = new ChunkRetryLoader(
  () => import('@auth/components/form-section/auth-forms/registration-notification')
);

export class RegistrationNotificationPrefetcher {
  public prefetch(): void {
    registrationNotificationLoader.load().catch((error: unknown) => {
      observabilityCore.captureError(error, { source: 'auth:notification-prefetch' });
    });
  }
}

export default registrationNotificationLoader;
