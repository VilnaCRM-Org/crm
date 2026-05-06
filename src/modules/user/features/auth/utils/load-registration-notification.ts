let registrationNotificationPromise: Promise<
  typeof import('@/modules/user/features/auth/components/form-section/auth-forms/registration-notification')
> | null = null;

export default function loadRegistrationNotification(): Promise<
  typeof import('@/modules/user/features/auth/components/form-section/auth-forms/registration-notification')
> {
  if (!registrationNotificationPromise) {
    registrationNotificationPromise =
      import('@/modules/user/features/auth/components/form-section/auth-forms/registration-notification').catch(
        (error) => {
          registrationNotificationPromise = null;
          throw error;
        }
      );
  }

  return registrationNotificationPromise;
}
