import { useCallback } from 'react';

import type { AbortableRun } from '@/hooks/types/use-abortable-submit';
import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import type PasswordRecoveryProvider from '@auth/data-providers/password-recovery-provider';
import type { AuthProviderLoader } from '@auth/stores';
import type { RecoveryFailedOutcome } from '@auth/types/password-recovery/outcome';
import type { RecoveryProviderStep } from '@auth/types/password-recovery/state';

const LOAD_FAILURE: RecoveryFailedOutcome = {
  kind: 'failed',
  failure: { reason: 'network', retryable: true },
};

export const authTokensLoader = new ChunkRetryLoader(() => import('@/modules/user/config/tokens'));

export default function useRecoveryRun<TDto, TOutcome>(
  loader: AuthProviderLoader,
  step: RecoveryProviderStep<TDto, TOutcome>
): AbortableRun<TDto, TOutcome | RecoveryFailedOutcome> {
  return useCallback(
    async (dto: TDto, signal: AbortSignal): Promise<TOutcome | RecoveryFailedOutcome> => {
      let provider: PasswordRecoveryProvider;
      try {
        const tokens = await authTokensLoader.load();
        provider = await loader.resolve<PasswordRecoveryProvider>(
          tokens.default.PasswordRecoveryProvider
        );
      } catch {
        return LOAD_FAILURE;
      }
      return step(provider, dto, signal);
    },
    [loader, step]
  );
}
