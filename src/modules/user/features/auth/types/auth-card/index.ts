import type { ReactNode } from 'react';

import type { AuthFormPage } from '@auth/types/auth-form-section';

export interface AuthCardProps {
  children: ReactNode;
  after?: ReactNode | undefined;
  page?: AuthFormPage | undefined;
}
