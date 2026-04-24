import useAppDispatch from '@/stores/hooks';
import type { TFunction } from 'i18next';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';

import { LoginUserDto } from '@/modules/User/features/Auth/types/Credentials';
import { loginUser } from '@/modules/User/store';

import normalizeLoginErrorMessage from './login-error-message';

type LoginSubmitter = {
  error: string;
  isSubmitting: boolean;
  handleLogin: (data: LoginUserDto) => Promise<void>;
};

type SubmitLoginContext = {
  data: LoginUserDto;
  dispatch: ReturnType<typeof useAppDispatch>;
  setError: Dispatch<SetStateAction<string>>;
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
  t: TFunction;
};

const I18N_KEY_RE = /^[a-z0-9_]+(?:\.[a-z0-9_]+)+$/i;

function setLoginFailure(ctx: SubmitLoginContext, err: unknown): void {
  const message = normalizeLoginErrorMessage(err);
  const reason = I18N_KEY_RE.test(message) ? ctx.t(message) : message;
  ctx.setError(ctx.t('sign_in.errors.login', { reason }));
}

async function submitLogin(ctx: SubmitLoginContext): Promise<void> {
  ctx.setIsSubmitting(true);
  ctx.setError('');
  try {
    await ctx.dispatch(loginUser(ctx.data)).unwrap();
  } catch (err) {
    setLoginFailure(ctx, err);
  } finally {
    ctx.setIsSubmitting(false);
  }
}

export default function useLoginSubmitter(t: TFunction): LoginSubmitter {
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const handleLogin = useCallback(
    (data: LoginUserDto) => submitLogin({ data, dispatch, setError, setIsSubmitting, t }),
    [dispatch, t]
  );
  return { error, isSubmitting, handleLogin };
}
