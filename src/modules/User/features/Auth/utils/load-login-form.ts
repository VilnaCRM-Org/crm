let loginFormPromise:
  | Promise<typeof import('@/modules/User/features/Auth/components/FormSection/auth-forms/login-form')>
  | null = null;

export default function loadLoginForm(): Promise<
  typeof import('@/modules/User/features/Auth/components/FormSection/auth-forms/login-form')
> {
  if (!loginFormPromise) {
    loginFormPromise = import(
      '@/modules/User/features/Auth/components/FormSection/auth-forms/login-form'
    ).catch((error) => {
      loginFormPromise = null;
      throw error;
    });
  }

  return loginFormPromise;
}
