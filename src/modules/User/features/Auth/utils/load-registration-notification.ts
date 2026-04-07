let registrationNotificationPromise:
  | Promise<
      typeof import(
        '@/modules/User/features/Auth/components/FormSection/AuthForms/registration-notification'
      )
    >
  | null = null;

export default function loadRegistrationNotification(): Promise<
  typeof import('@/modules/User/features/Auth/components/FormSection/AuthForms/registration-notification')
> {
  if (!registrationNotificationPromise) {
    registrationNotificationPromise = import(
      '@/modules/User/features/Auth/components/FormSection/AuthForms/registration-notification'
    ).catch((error) => {
      registrationNotificationPromise = null;
      throw error;
    });
  }

  return registrationNotificationPromise;
}
