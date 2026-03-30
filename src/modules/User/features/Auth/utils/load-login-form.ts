let loginFormPromise:
  | Promise<typeof import('@/modules/User/features/Auth/components/FormSection/AuthForms/LoginForm')>
  | null = null;

export default function loadLoginForm(): Promise<
  typeof import('@/modules/User/features/Auth/components/FormSection/AuthForms/LoginForm')
> {
  if (!loginFormPromise) {
    loginFormPromise = import(
      '@/modules/User/features/Auth/components/FormSection/AuthForms/LoginForm'
    ).catch((error) => {
      loginFormPromise = null;
      throw error;
    });
  }

  return loginFormPromise;
}
