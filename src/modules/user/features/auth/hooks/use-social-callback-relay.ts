import { useEffect } from 'react';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type SocialSignInProvider from '@auth/data-providers/social-sign-in-provider';
import type { AuthProviderLoader } from '@auth/stores';
import type {
  SocialCallbackEntry,
  SocialCallbackView,
  SocialRelay,
  SocialRelayGuard,
  SocialRelayStart,
} from '@auth/types/social-sign-in/social-callback-view';
import socialCallbackViewMapper from '@auth/utils/social-callback-view-mapper';

// A state is issued once and a provider code is single-use, and React's StrictMode runs a mount
// effect twice. One relay per key is shared by both runs, so the second never repeats it.
class SocialCallbackCache {
  private readonly pending = new Map<string, SocialCallbackEntry>();

  public join(key: string, page: SocialRelayGuard, start: SocialRelayStart): SocialCallbackEntry {
    const entry = this.pending.get(key) ?? this.open(key, start);
    entry.pages.add(page);
    return entry;
  }

  public leave(key: string, page: SocialRelayGuard, entry: SocialCallbackEntry): void {
    entry.pages.delete(page);
    queueMicrotask(() => {
      if (entry.pages.size === 0 && this.forget(key, entry)) entry.controller.abort();
    });
  }

  private open(key: string, start: SocialRelayStart): SocialCallbackEntry {
    const controller = new AbortController();
    const view = start(controller.signal);
    const entry: SocialCallbackEntry = { view, controller, pages: new Set() };
    void view.then(() => this.forget(key, entry));
    this.pending.set(key, entry);
    return entry;
  }

  private forget(key: string, entry: SocialCallbackEntry): boolean {
    return this.pending.get(key) === entry && this.pending.delete(key);
  }
}

const socialCallbackCache = new SocialCallbackCache();

async function relay(
  provider: SocialSignInProvider,
  run: SocialRelay,
  signal: AbortSignal
): Promise<SocialCallbackView> {
  if (run.kind === 'start') {
    return socialCallbackViewMapper.startView(
      run.view,
      await provider.start(run.view.provider, signal)
    );
  }
  const outcome = await provider.complete(run.view.provider, run.params, signal);
  return socialCallbackViewMapper.outcomeView(run.view, outcome);
}

async function load(
  loader: AuthProviderLoader,
  run: SocialRelay,
  signal: AbortSignal
): Promise<SocialCallbackView> {
  try {
    const provider = await loader.resolve<SocialSignInProvider>(AUTH_TOKENS.SocialSignInProvider);
    return await relay(provider, run, signal);
  } catch {
    return socialCallbackViewMapper.unavailableView(run.view);
  }
}

async function settleRelay(
  entry: SocialCallbackEntry,
  run: SocialRelay,
  guard: SocialRelayGuard
): Promise<void> {
  const view = await entry.view;
  if (guard.active) run.settle(view);
}

// Aborted only when every page that shares the relay is gone: StrictMode's remount joins it again
// before the check runs, so a spent state or code is never thrown away while a page waits for it.
export default function useSocialCallbackRelay(
  loader: AuthProviderLoader,
  run: SocialRelay | null
): void {
  useEffect(
    () => {
      if (run === null) return undefined;
      const guard: SocialRelayGuard = { active: true };
      const entry = socialCallbackCache.join(run.key, guard, (signal) => load(loader, run, signal));
      void settleRelay(entry, run, guard);
      return (): void => {
        guard.active = false;
        socialCallbackCache.leave(run.key, guard, entry);
      };
    },
    // Stryker disable next-line ArrayDeclaration: equivalent, both deps are useState-held per mount
    [loader, run]
  );
}
