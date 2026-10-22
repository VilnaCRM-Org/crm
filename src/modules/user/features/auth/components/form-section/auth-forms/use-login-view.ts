import { useEffect, useState } from 'react';

import type {
  LoginView,
  LoginViewInput,
  LoginViewState,
} from '@auth/types/auth-forms/use-login-view';

function viewOf(signedIn: boolean, errorShown: boolean): LoginView {
  if (signedIn) return 'success';
  return errorShown ? 'error' : 'form';
}

export default function useLoginView({
  error,
  isSubmitting,
  signedIn,
}: LoginViewInput): LoginViewState {
  const [errorShown, setErrorShown] = useState(false);
  const [returnCount, setReturnCount] = useState(0);

  useEffect(() => {
    if (error !== '' && !isSubmitting) setErrorShown(true);
  }, [error, isSubmitting]);

  return {
    view: viewOf(signedIn, errorShown),
    returnCount,
    back: (): void => {
      setErrorShown(false);
      setReturnCount((count) => count + 1);
    },
  };
}
