import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';

// Retry once, never reload: a reload here would discard the registration result the
// notification exists to show (issue #147).
const registrationNotificationLoader = new ChunkRetryLoader(
  () => import('@auth/components/form-section/auth-forms/registration-notification')
);

export default registrationNotificationLoader;
