let loginFormPromise: Promise<typeof import('@auth-forms/login-form')> | null = null;

export default function loadLoginForm(): Promise<typeof import('@auth-forms/login-form')> {
  if (!loginFormPromise) {
    loginFormPromise = import('@auth-forms/login-form').catch((error) => {
      loginFormPromise = null;
      throw error;
    });
  }

  return loginFormPromise;
}
