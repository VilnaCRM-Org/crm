import { useEffect } from 'react';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type SocialSignInProvider from '@auth/data-providers/social-sign-in-provider';
import type { AuthProviderLoader } from '@auth/stores';
import type {
  SocialRelay,
  SocialRelayGuard,
} from '@auth/types/social-sign-in/social-callback-view';
import type { SocialSignInOutcome } from '@auth/types/social-sign-in/social-sign-in-outcome';
import socialCallbackViewMapper from '@auth/utils/social-callback-view-mapper';

const UNAVAILABLE: SocialSignInOutcome = { kind: 'failed', error: 'unavailable' };

// The provider's code is single-use, and React's StrictMode runs a mount effect twice. One relay
// per `state` is shared by both runs, so the second never spends the code a second time.
class SocialCallbackCache {
  private readonly pending = new Map<string, Promise<SocialSignInOutcome>>();

  public run(key: string, start: () => Promise<SocialSignInOutcome>): Promise<SocialSignInOutcome> {
    const existing = this.pending.get(key);
    if (existing !== undefined) return existing;
    const started = start().finally(() => this.pending.delete(key));
    this.pending.set(key, started);
    return started;
  }
}

const socialCallbackCache = new SocialCallbackCache();

async function relay(loader: AuthProviderLoader, run: SocialRelay): Promise<SocialSignInOutcome> {
  let provider: SocialSignInProvider;
  try {
    provider = await loader.resolve<SocialSignInProvider>(AUTH_TOKENS.SocialSignInProvider);
  } catch {
    return UNAVAILABLE;
  }
  return provider.complete(run.view.provider, run.params, new AbortController().signal);
}

async function settleRelay(
  loader: AuthProviderLoader,
  run: SocialRelay,
  guard: SocialRelayGuard
): Promise<void> {
  const outcome = await socialCallbackCache.run(run.params.state, () => relay(loader, run));
  if (guard.active && outcome.kind !== 'aborted') {
    run.settle(socialCallbackViewMapper.outcomeView(run.view, outcome));
  }
}

// The relay is never aborted: aborting would only throw away the answer to a code user-service
// has already consumed. A page that unmounted ignores the result instead.
export default function useSocialCallbackRelay(
  loader: AuthProviderLoader,
  run: SocialRelay | null
): void {
  useEffect(() => {
    if (run === null) return undefined;
    const guard: SocialRelayGuard = { active: true };
    void settleRelay(loader, run, guard);
    return (): void => {
      guard.active = false;
    };
  }, [loader, run]);
}
