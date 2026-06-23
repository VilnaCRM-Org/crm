import LazyModuleLoader from './lazy-module-loader';

const registrationNotificationLoader = new LazyModuleLoader(
  () => import('@auth/components/form-section/auth-forms/registration-notification')
);

export default registrationNotificationLoader;
