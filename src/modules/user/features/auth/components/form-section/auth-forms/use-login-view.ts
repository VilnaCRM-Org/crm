import { useEffect, useState } from 'react';

import type {
  LoginView,
  LoginViewInput,
  LoginViewMemory,
  LoginViewState,
} from '@auth/types/auth-forms/use-login-view';

function viewOf(signedIn: boolean, errorShown: boolean): LoginView {
  if (signedIn) return 'success';
  return errorShown ? 'error' : 'form';
}

function returned(memory: LoginViewMemory): LoginViewMemory {
  return memory.errorShown ? { errorShown: false, returnCount: memory.returnCount + 1 } : memory;
}

export default function useLoginView({
  error,
  isSubmitting,
  signedIn,
}: LoginViewInput): LoginViewState {
  const [memory, setMemory] = useState<LoginViewMemory>({ errorShown: false, returnCount: 0 });

  useEffect(() => {
    if (isSubmitting || signedIn) return;
    setMemory((current) => (error === '' ? returned(current) : { ...current, errorShown: true }));
  }, [error, isSubmitting, signedIn]);

  return {
    view: viewOf(signedIn, memory.errorShown),
    returnCount: memory.returnCount,
    back: (): void => setMemory(returned),
  };
}
