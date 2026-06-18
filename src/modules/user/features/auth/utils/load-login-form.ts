type LoginFormModule = typeof import('@auth/components/form-section/auth-forms/login-form');

class LoginFormLoader {
  private promise: Promise<LoginFormModule> | null = null;

  public load(): Promise<LoginFormModule> {
    if (!this.promise) {
      this.promise = import('@auth/components/form-section/auth-forms/login-form').catch(
        (error) => {
          this.promise = null;
          throw error;
        }
      );
    }

    return this.promise;
  }
}

const loginFormLoader = new LoginFormLoader();

export default loginFormLoader;
