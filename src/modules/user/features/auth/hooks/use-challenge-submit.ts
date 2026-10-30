import { useCallback } from 'react';

import type { AbortableSubmit } from '@/hooks/types/use-abortable-submit';
import useAbortableSubmit from '@/hooks/use-abortable-submit';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';
import ROUTE_PATHS from '@/routes/route-paths';
import type { ArrivalNotice } from '@/routes/types/navigation-state';
import type GraphQLSignInProvider from '@auth/data-providers/graphql-sign-in-provider';
import type { AuthProviderLoader } from '@auth/stores';
import useAuthStore from '@auth/stores/use-auth-store';
import type { AuthStatePatch } from '@auth/types/auth-store';
import type {
  ChallengeCompletedOutcome,
  ChallengeFailedOutcome,
  ChallengeFailureReason,
  ChallengeResult,
} from '@auth/types/two-factor/challenge';
import type { ChallengeSubmitHookDeps } from '@auth/types/two-factor/challenge-view';
import type AuthSecuritySignals from '@auth/utils/auth-security-signals';

const LOAD_FAILURE: ChallengeFailedOutcome = { kind: 'failed', reason: 'network' };

const NO_SESSION: ChallengeFailedOutcome = { kind: 'failed', reason: 'expired_session' };

const KEPT_CODE_COUNTS: ReadonlySet<number> = new Set([0, 1, 2]);

const NOTICE_BY_REASON = new Map<ChallengeFailureReason, ArrivalNotice>([
  ['expired_session', 'two_factor_expired'],
  ['locked', 'account_locked'],
]);

function completedPatch(outcome: ChallengeCompletedOutcome): AuthStatePatch {
  const { recoveryCodesRemaining: remaining } = outcome;
  return {
    token: outcome.token,
    twoFactorStatus: 'enabled',
    pendingSessionId: null,
    recoveryCodesRemaining:
      remaining !== null && KEPT_CODE_COUNTS.has(remaining) ? remaining : null,
  };
}

async function resolveResult(
  loader: AuthProviderLoader,
  dto: TwoFactorDto,
  signal: AbortSignal
): Promise<ChallengeResult> {
  const { pendingSessionId } = useAuthStore.getState();
  if (pendingSessionId === null) return NO_SESSION;
  const provider = await loader
    .resolve<GraphQLSignInProvider>(AUTH_TOKENS.GraphQLSignInProvider)
    .catch(() => null);
  if (provider === null) return LOAD_FAILURE;
  return provider.completeChallenge({ twoFactorCode: dto.twoFactorCode, pendingSessionId }, signal);
}

async function recordResult(loader: AuthProviderLoader, result: ChallengeResult): Promise<void> {
  const signals = await loader
    .resolve<AuthSecuritySignals>(AUTH_TOKENS.AuthSecuritySignals)
    .catch(() => undefined);
  signals?.challengeSettled(result);
}

function leaveFor(result: ChallengeResult, { navigate, from }: ChallengeSubmitHookDeps): void {
  const notice = result.kind === 'failed' ? NOTICE_BY_REASON.get(result.reason) : undefined;
  if (notice === undefined) return;
  navigate(ROUTE_PATHS.signIn, {
    replace: true,
    state: { ...(from === undefined ? {} : { from }), focusMain: true, notice },
  });
}

async function runChallenge(
  deps: ChallengeSubmitHookDeps,
  dto: TwoFactorDto,
  signal: AbortSignal
): Promise<ChallengeResult> {
  const result = await resolveResult(deps.loader, dto, signal);
  if (signal.aborted) return result;
  if (result.kind === 'completed') useAuthStore.setState(completedPatch(result));
  await recordResult(deps.loader, result);
  if (!signal.aborted) leaveFor(result, deps);
  return result;
}

export default function useChallengeSubmit(
  deps: ChallengeSubmitHookDeps
): AbortableSubmit<TwoFactorDto, ChallengeResult> {
  const { loader, navigate, from } = deps;
  const run = useCallback(
    (dto: TwoFactorDto, signal: AbortSignal): Promise<ChallengeResult> =>
      runChallenge({ loader, navigate, from }, dto, signal),
    [loader, navigate, from]
  );
  return useAbortableSubmit(run);
}
