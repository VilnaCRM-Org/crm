import { useEffect } from 'react';

import { RegistrationView } from '@/modules/User/features/Auth/components/form-section/types';

interface Params {
  user: unknown;
  error: string | null | undefined;
  isSubmitting: boolean;
  setView: (view: RegistrationView) => void;
}

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
