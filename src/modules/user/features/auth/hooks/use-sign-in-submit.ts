import { useState } from 'react';

import sandboxDemoSessionProvider from '@/config/env/sandbox-demo-session-provider';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { SignInDto } from '@/modules/user/types/user/sign-in-dto';
import type GraphQLSignInProvider from '@auth/data-providers/graphql-sign-in-provider';
import type { AuthProviderLoader } from '@auth/stores';
import useAuthStore from '@auth/stores/use-auth-store';
import type { AuthError } from '@auth/types/auth-error';
import type { AuthStatePatch } from '@auth/types/auth-store';
import type { SignInRun } from '@auth/types/sign-in/sign-in-run';
import type { SignInOutcome, SignInResult } from '@auth/types/two-factor/sign-in';
import type AuthSecuritySignals from '@auth/utils/auth-security-signals';

const LOAD_FAILURE: AuthError = {
  kind: 'network',
  displayMessage: 'Failed to load the authentication service. Please try again.',
  retryable: true,
};

const START: AuthStatePatch = { loginLoading: true, loginError: null };

const SETTLED: AuthStatePatch = { loginLoading: false };

function patchOf(outcome: SignInOutcome): AuthStatePatch {
  if (outcome.kind === 'session') {
    return {
      ...SETTLED,
      loginError: null,
      email: outcome.email,
      token: outcome.token,
      twoFactorStatus: 'disabled',
    };
  }
  return {
    ...SETTLED,
    loginError: null,
    email: outcome.email,
    pendingSessionId: outcome.pendingSessionId,
  };
}

function patchOfResult(result: SignInResult): AuthStatePatch {
  if (result.ok) return patchOf(result.value);
  return result.error.aborted ? SETTLED : { ...SETTLED, loginError: result.error };
}

async function recordSignal(
  loader: AuthProviderLoader,
  result: SignInResult,
  signal: AbortSignal
): Promise<void> {
  if (signal.aborted || (!result.ok && result.error.aborted)) return;
  await loader
    .resolve<AuthSecuritySignals>(AUTH_TOKENS.AuthSecuritySignals)
    .then((signals) => signals.loginSettled(result))
    .catch(() => undefined);
}

function signInDemo(dto: SignInDto, signal: AbortSignal): SignInResult | null {
  const demo = signal.aborted ? null : sandboxDemoSessionProvider.signIn(dto);
  if (demo === null) return null;
  const outcome: SignInOutcome = { kind: 'session', ...demo };
  useAuthStore.setState(patchOf(outcome));
  return { ok: true, value: outcome };
}

async function resolveProvider(
  loader: AuthProviderLoader,
  signal: AbortSignal
): Promise<GraphQLSignInProvider | null> {
  const provider = await loader
    .resolve<GraphQLSignInProvider>(AUTH_TOKENS.GraphQLSignInProvider)
    .catch(() => null);
  if (provider === null) {
    useAuthStore.setState({ ...SETTLED, loginError: signal.aborted ? null : LOAD_FAILURE });
  }
  return provider;
}

async function runSignIn(
  loader: AuthProviderLoader,
  dto: SignInDto,
  signal: AbortSignal
): Promise<void> {
  useAuthStore.setState(START);
  const demo = signInDemo(dto, signal);
  if (demo !== null) return recordSignal(loader, demo, signal);
  const provider = await resolveProvider(loader, signal);
  if (provider === null) return;
  const result = await provider.login(dto, signal);
  useAuthStore.setState(patchOfResult(result));
  await recordSignal(loader, result, signal);
}

export default function useSignInSubmit(loader: AuthProviderLoader): SignInRun {
  const [run] = useState(
    () =>
      (dto: SignInDto, signal: AbortSignal): Promise<void> =>
        runSignIn(loader, dto, signal)
  );
  return run;
}
