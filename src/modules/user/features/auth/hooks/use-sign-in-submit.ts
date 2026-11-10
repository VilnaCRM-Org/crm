import { useState } from 'react';

import sandboxDemoSessionProvider from '@/config/env/sandbox-demo-session-provider';
import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import type { SignInDto } from '@/modules/user/types/user/sign-in-dto';
import type { AuthProviderLoader } from '@auth/stores';
import useAuthStore from '@auth/stores/use-auth-store';
import type { AuthError } from '@auth/types/auth-error';
import type { AuthStatePatch } from '@auth/types/auth-store';
import type { SignInRun } from '@auth/types/sign-in/sign-in-run';

const LOAD_FAILURE: AuthError = {
  kind: 'network',
  displayMessage: 'Failed to load the authentication service. Please try again.',
  retryable: true,
};

const START: AuthStatePatch = { loginLoading: true };

export const signInSubmitProcessorLoader = new ChunkRetryLoader(
  () => import('@auth/utils/sign-in-submit-processor')
);

async function runSignIn(
  loader: AuthProviderLoader,
  dto: SignInDto,
  signal: AbortSignal
): Promise<void> {
  useAuthStore.setState(START);
  const processor = await signInSubmitProcessorLoader.load().catch(() => null);
  const context = { loader, store: useAuthStore, demoSession: sandboxDemoSessionProvider };
  const processed = processor !== null && (await processor.default.run(context, dto, signal));
  if (!processed) {
    useAuthStore.setState({
      loginLoading: false,
      loginError: signal.aborted ? null : LOAD_FAILURE,
    });
  }
}

export default function useSignInSubmit(loader: AuthProviderLoader): SignInRun {
  const [run] = useState(
    () =>
      (dto: SignInDto, signal: AbortSignal): Promise<void> =>
        runSignIn(loader, dto, signal)
  );
  return run;
}
