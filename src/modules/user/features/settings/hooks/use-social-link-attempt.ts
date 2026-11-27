import { useEffect, useRef } from 'react';

import socialLinkChannelAdapter from '@/modules/user/lib/social-link/social-link-channel-adapter';
import socialLinkWindowNavigator from '@/modules/user/lib/social-link/social-link-window-navigator';
import type {
  SocialLinkAnswer,
  SocialLinkAnswerFault,
} from '@/modules/user/types/social-link/social-link-callback';

import type {
  SocialLinkAbortedOutcome,
  SocialLinkChangeOutcome,
  SocialLinkFailedOutcome,
  SocialLinkFailureKind,
  SocialLinkStartedOutcome,
  SocialLinkStartOutcome,
} from '../types/social-link/outcome';
import type {
  SocialLinkAction,
  SocialLinkDeps,
  SocialLinkFlight,
  SocialLinkRun,
  SocialLinkTarget,
} from '../types/social-link/social-links';

const ANSWER_FAILURES = {
  refused: 'cancelled',
  missing: 'expired',
  malformed: 'generic',
} as const satisfies Record<SocialLinkAnswerFault, SocialLinkFailureKind>;

const ABORTED: SocialLinkAbortedOutcome = { kind: 'aborted' };

const failed = (reason: SocialLinkFailureKind): SocialLinkFailedOutcome => ({
  kind: 'failed',
  reason,
});

function leave(
  start: SocialLinkStartedOutcome,
  { controller, popup }: SocialLinkFlight
): SocialLinkStartOutcome {
  if (controller.signal.aborted || popup.closed) return failed('cancelled');
  socialLinkWindowNavigator.leave(popup, start.authorizationUrl);
  return start;
}

function depart(start: SocialLinkStartOutcome, flight: SocialLinkFlight): SocialLinkStartOutcome {
  const departed = start.kind === 'started' ? leave(start, flight) : start;
  if (departed.kind !== 'started') flight.popup.close();
  return departed;
}

async function answerOf(
  { id, flight }: SocialLinkRun,
  state: string
): Promise<SocialLinkAnswer | null> {
  const { controller, popup } = flight;
  const answer = await socialLinkChannelAdapter.next({ provider: id, state }, controller.signal);
  popup.close();
  return answer;
}

function finish(
  { deps, id, flight }: SocialLinkRun,
  state: string,
  answer: SocialLinkAnswer | null
): Promise<SocialLinkChangeOutcome> | SocialLinkChangeOutcome {
  if (answer === null) return ABORTED;
  if (answer.kind !== 'code') return failed(ANSWER_FAILURES[answer.kind]);
  const { signal } = flight.controller;
  return deps.busy.hold(deps.provider.complete(id, { code: answer.code, state }, signal));
}

async function attempt(run: SocialLinkRun): Promise<SocialLinkChangeOutcome> {
  const { deps, id, flight } = run;
  const started = await deps.busy.hold(deps.provider.start(id, flight.controller.signal));
  const start = depart(started, flight);
  if (start.kind !== 'started') return start;
  return finish(run, start.state, await answerOf(run, start.state));
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
