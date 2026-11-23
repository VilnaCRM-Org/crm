import { useEffect, useRef } from 'react';

import socialLinkChannelAdapter from '@/modules/user/lib/social-link/social-link-channel-adapter';
import socialLinkWindowNavigator from '@/modules/user/lib/social-link/social-link-window-navigator';
import type { SocialLinkAnswer } from '@/modules/user/types/social-link/social-link-callback';

import type { SocialLinkChangeOutcome, SocialLinkFailureKind } from '../types/social-link/outcome';
import type {
  SocialLinkAction,
  SocialLinkDeps,
  SocialLinkFlight,
  SocialLinkRun,
  SocialLinkTarget,
} from '../types/social-link/social-links';

const failed = (reason: SocialLinkFailureKind): SocialLinkChangeOutcome => ({
  kind: 'failed',
  reason,
});

function refusalOf({ code, error }: SocialLinkAnswer): SocialLinkFailureKind | null {
  if (error !== null) return 'cancelled';
  return code === null ? 'expired' : null;
}

function finish(
  { deps, id, flight }: SocialLinkRun,
  state: string,
  answer: SocialLinkAnswer | null
): Promise<SocialLinkChangeOutcome> | SocialLinkChangeOutcome {
  if (answer === null) return { kind: 'aborted' };
  const reason = refusalOf(answer);
  if (reason !== null) return failed(reason);
  const { signal } = flight.controller;
  return deps.busy.hold(deps.provider.complete(id, { code: String(answer.code), state }, signal));
}

async function attempt(run: SocialLinkRun): Promise<SocialLinkChangeOutcome> {
  const { deps, id, flight } = run;
  const { signal } = flight.controller;
  const start = await deps.busy.hold(deps.provider.start(id, signal));
  if (start.kind !== 'started' || signal.aborted) {
    flight.popup.close();
  }
  if (start.kind !== 'started') return start;
  const { state, authorizationUrl } = start;
  const answer = socialLinkChannelAdapter.next({ provider: id, state }, signal);
  if (!signal.aborted) socialLinkWindowNavigator.leave(flight.popup, authorizationUrl);
  return finish(run, state, await answer);
}

function open(): SocialLinkFlight | null {
  const popup = socialLinkWindowNavigator.open();
  return popup === null ? null : { controller: new AbortController(), popup };
}

async function fly(
  deps: SocialLinkDeps,
  target: SocialLinkTarget,
  flight: SocialLinkFlight | null
): Promise<void> {
  const outcome =
    flight === null ? failed('blocked') : await attempt({ deps, id: target.id, flight });
  if (flight?.controller.signal.aborted !== true) {
    deps.settle({ target, intent: 'linked', outcome });
  }
}

export default function useSocialLinkAttempt(deps: SocialLinkDeps): SocialLinkAction {
  const current = useRef<SocialLinkFlight | null>(null);
  useEffect(
    () => (): void => current.current?.controller.abort(),
    // Stryker disable next-line ArrayDeclaration: equivalent, deps stay Object.is-equal
    []
  );

  return async (target: SocialLinkTarget): Promise<void> => {
    if (deps.busy.isHeld()) return;
    current.current?.controller.abort();
    current.current = open();
    await fly(deps, target, current.current);
  };
}
