type RegistrationNotificationModule =
  typeof import('@auth/components/form-section/auth-forms/registration-notification');

class RegistrationNotificationLoader {
  private promise: Promise<RegistrationNotificationModule> | null = null;

  public load(): Promise<RegistrationNotificationModule> {
    if (!this.promise) {
      this.promise =
        import('@auth/components/form-section/auth-forms/registration-notification').catch(
          (error) => {
            this.promise = null;
            throw error;
          }
        );
    }

    return this.promise;
  }
}

const registrationNotificationLoader = new RegistrationNotificationLoader();

export default registrationNotificationLoader;
