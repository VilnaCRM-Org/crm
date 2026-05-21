let loginFormPromise: Promise<
  typeof import('@/modules/user/features/auth/components/form-section/auth-forms/login-form')
> | null = null;

export default function loadLoginForm(): Promise<
  typeof import('@/modules/user/features/auth/components/form-section/auth-forms/login-form')
> {
  if (!loginFormPromise) {
    loginFormPromise =
      import('@/modules/user/features/auth/components/form-section/auth-forms/login-form').catch(
        (error) => {
          loginFormPromise = null;
          throw error;
        }
      );
  }

  return loginFormPromise;
}
