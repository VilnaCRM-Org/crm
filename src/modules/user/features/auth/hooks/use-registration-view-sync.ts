import { useEffect } from 'react';

import type { RegistrationView } from '@auth/components/form-section/types';
import type { Params } from '@auth/types/registration-view-sync';

function nextView(user: unknown, error: string | null | undefined): RegistrationView | null {
  if (user) return 'success';
  if (error) return 'error';
  return null;
}

export default function useRegistrationViewSync({
  user,
  error,
  isSubmitting,
  setView,
}: Params): void {
  useEffect(() => {
    if (isSubmitting) return;
    const next = nextView(user, error);
    if (next) setView(next);
  }, [user, error, isSubmitting, setView]);
}
