import { useEffect } from 'react';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type SocialSignInProvider from '@auth/data-providers/social-sign-in-provider';
import type { AuthProviderLoader } from '@auth/stores';
import type {
  SocialCallbackView,
  SocialRelay,
  SocialRelayGuard,
} from '@auth/types/social-sign-in/social-callback-view';
import socialCallbackViewMapper from '@auth/utils/social-callback-view-mapper';

// A state is issued once and a provider code is single-use, and React's StrictMode runs a mount
// effect twice. One relay per key is shared by both runs, so the second never repeats it.
class SocialCallbackCache {
  private readonly pending = new Map<string, Promise<SocialCallbackView>>();

  public run(key: string, start: () => Promise<SocialCallbackView>): Promise<SocialCallbackView> {
    const existing = this.pending.get(key);
    if (existing !== undefined) return existing;
    const started = start().finally(() => this.pending.delete(key));
    this.pending.set(key, started);
    return started;
  }
}

const socialCallbackCache = new SocialCallbackCache();

async function relay(
  provider: SocialSignInProvider,
  run: SocialRelay
): Promise<SocialCallbackView> {
  const { signal } = new AbortController();
  if (run.kind === 'start') {
    return socialCallbackViewMapper.startView(
      run.view,
      await provider.start(run.view.provider, signal)
    );
  }
  const outcome = await provider.complete(run.view.provider, run.params, signal);
  return socialCallbackViewMapper.outcomeView(run.view, outcome);
}

async function load(loader: AuthProviderLoader, run: SocialRelay): Promise<SocialCallbackView> {
  try {
    const provider = await loader.resolve<SocialSignInProvider>(AUTH_TOKENS.SocialSignInProvider);
    return await relay(provider, run);
  } catch {
    return socialCallbackViewMapper.unavailableView(run.view);
  }
}

async function settleRelay(
  loader: AuthProviderLoader,
  run: SocialRelay,
  guard: SocialRelayGuard
): Promise<void> {
  const view = await socialCallbackCache.run(run.key, () => load(loader, run));
  if (guard.active) run.settle(view);
}

// Never aborted: aborting would only throw away the answer to a state or code user-service has
// already spent. A page that unmounted ignores the result instead.
export default function useSocialCallbackRelay(
  loader: AuthProviderLoader,
  run: SocialRelay | null
): void {
  useEffect(
    () => {
      if (run === null) return undefined;
      const guard: SocialRelayGuard = { active: true };
      void settleRelay(loader, run, guard);
      return (): void => {
        guard.active = false;
      };
    },
    // Stryker disable next-line ArrayDeclaration: equivalent, both deps are useState-held per mount
    [loader, run]
  );
}
