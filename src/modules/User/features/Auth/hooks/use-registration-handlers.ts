import type { Dispatch, SetStateAction, MutableRefObject } from 'react';
import { useCallback } from 'react';

import { RegistrationView } from '@/modules/User/features/Auth/components/form-section/types';
import { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';
import { registerUser, reset } from '@/modules/User/store';

const incrementKey = (prev: number): number => prev + 1;
const normalize = (data: RegisterUserDto): RegisterUserDto => ({
  ...data,
  fullName: data.fullName.trim(),
});

type Handlers = {
  handleRegister: (data: RegisterUserDto) => void;
  handleSuccessShown: () => void;
  handleBackToForm: () => void;
  handleRetry: () => void;
};

type Deps = {
  dispatch: ReturnType<typeof import('@/stores/hooks').default>;
  setView: Dispatch<SetStateAction<RegistrationView>>;
  setFormKey: Dispatch<SetStateAction<number>>;
  lastSubmittedDataRef: MutableRefObject<RegisterUserDto | null>;
};

type RegisterDeps = Pick<Deps, 'dispatch' | 'lastSubmittedDataRef'>;
type BackToFormDeps = Pick<Deps, 'dispatch' | 'setView' | 'lastSubmittedDataRef'>;
type SuccessShownDeps = Pick<Deps, 'setFormKey'>;

function useHandleRegister(deps: RegisterDeps): Handlers['handleRegister'] {
  const { dispatch, lastSubmittedDataRef } = deps;
  return useCallback(
    (data: RegisterUserDto): void => {
      const normalized = normalize(data);
      lastSubmittedDataRef.current = normalized;
      dispatch(registerUser(normalized));
    },
    [dispatch, lastSubmittedDataRef]
  );
}

function useHandleBackToForm(deps: BackToFormDeps): Handlers['handleBackToForm'] {
  const { dispatch, setView, lastSubmittedDataRef } = deps;
  return useCallback((): void => {
    setView('form');
    dispatch(reset());
    lastSubmittedDataRef.current = null;
  }, [dispatch, setView, lastSubmittedDataRef]);
}

function useHandleSuccessShown(deps: SuccessShownDeps): Handlers['handleSuccessShown'] {
  const { setFormKey } = deps;
  return useCallback(() => setFormKey(incrementKey), [setFormKey]);
}

function useHandleRetry(deps: RegisterDeps): Handlers['handleRetry'] {
  const { dispatch, lastSubmittedDataRef } = deps;
  return useCallback((): void => {
    const last = lastSubmittedDataRef.current;
    if (!last) return;
    dispatch(reset());
    dispatch(registerUser(last));
  }, [dispatch, lastSubmittedDataRef]);
}

export default function useRegistrationHandlers(deps: Deps): Handlers {
  const handleRegister = useHandleRegister(deps);
  const handleBackToForm = useHandleBackToForm(deps);
  const handleSuccessShown = useHandleSuccessShown(deps);
  const handleRetry = useHandleRetry(deps);

  return { handleRegister, handleSuccessShown, handleBackToForm, handleRetry };
}
