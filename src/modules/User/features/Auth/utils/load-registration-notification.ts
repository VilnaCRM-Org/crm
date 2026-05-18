type RegistrationNotificationModule = typeof import(
  '@/modules/User/features/Auth/components/form-section/auth-forms/registration-notification'
);

let registrationNotificationPromise: Promise<RegistrationNotificationModule> | null = null;

export default function loadRegistrationNotification(): Promise<RegistrationNotificationModule> {
  if (!registrationNotificationPromise) {
    registrationNotificationPromise = import(
      '@/modules/User/features/Auth/components/form-section/auth-forms/registration-notification'
    ).catch((error) => {
      registrationNotificationPromise = null;
      throw error;
    });
  }

  return registrationNotificationPromise;
}
