import type { ReactNode } from 'react';

export type AuthFormPage = 'signIn' | 'signUp';

export interface AuthFormSectionProps {
  children: ReactNode;
  oauthInert: boolean;
  page: AuthFormPage;
  switcher: ReactNode;
}
