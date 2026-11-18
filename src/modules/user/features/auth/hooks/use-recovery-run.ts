import { useCallback, useState } from 'react';

import type { AbortableRun } from '@/hooks/types/use-abortable-submit';
import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import type PasswordRecoveryProvider from '@auth/data-providers/password-recovery-provider';
import type { AuthProviderLoader } from '@auth/stores';
import useFailureCapture from '@auth/stores/use-failure-capture';
import type { FailureCapture } from '@auth/types/failure-capture';
import type { RecoveryFailedOutcome } from '@auth/types/password-recovery/outcome';
import type { AuthTokensLoader } from '@auth/types/password-recovery/recovery-run';
import type { RecoveryProviderStep } from '@auth/types/password-recovery/state';

const LOAD_FAILURE: RecoveryFailedOutcome = {
  kind: 'failed',
  failure: { reason: 'network', retryable: true },
};

async function resolveProvider(
  loader: AuthProviderLoader,
  tokensLoader: AuthTokensLoader,
  capture: FailureCapture
): Promise<PasswordRecoveryProvider | null> {
  const tokens = await tokensLoader.load().catch((error: unknown) => {
    capture(error);
    return null;
  });
  if (tokens === null) return null;
  return loader
    .resolve<PasswordRecoveryProvider>(tokens.default.PasswordRecoveryProvider)
    .catch(() => null);
}

export default function useRecoveryRun<TDto, TOutcome>(
  loader: AuthProviderLoader,
  step: RecoveryProviderStep<TDto, TOutcome>
): AbortableRun<TDto, TOutcome | RecoveryFailedOutcome> {
  const [tokensLoader] = useState(
    () => new ChunkRetryLoader(() => import('@/modules/user/config/tokens'))
  );
  const capture = useFailureCapture('auth:recovery-load');
  return useCallback(
    async (dto: TDto, signal: AbortSignal): Promise<TOutcome | RecoveryFailedOutcome> => {
      const provider = await resolveProvider(loader, tokensLoader, capture);
      return provider === null ? LOAD_FAILURE : step(provider, dto, signal);
    },
    [loader, step, tokensLoader, capture]
  );
}
