let registrationNotificationPromise: Promise<
  typeof import('../components/form-section/auth-forms/registration-notification')
> | null = null;

export default function loadRegistrationNotification(): Promise<
  typeof import('../components/form-section/auth-forms/registration-notification')
> {
  if (!registrationNotificationPromise) {
    registrationNotificationPromise =
      import('../components/form-section/auth-forms/registration-notification').catch((error) => {
        registrationNotificationPromise = null;
        throw error;
      });
  }

  return registrationNotificationPromise;
}
