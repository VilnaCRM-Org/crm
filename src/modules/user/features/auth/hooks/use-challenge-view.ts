import { useReducer } from 'react';

import type {
  TwoFactorBannerCode,
  TwoFactorFieldError,
} from '@/modules/user/types/two-factor/code';
import type { ChallengeFailureReason, ChallengeResult } from '@auth/types/two-factor/challenge';
import type {
  ChallengeAction,
  ChallengeRejectedAction,
  ChallengeSubmittedAction,
  ChallengeView,
  ChallengeViewStore,
} from '@auth/types/two-factor/challenge-view';

const INITIAL_VIEW: ChallengeView = {
  mode: 'totp',
  value: '',
  fieldError: null,
  banner: null,
  focusRequest: 0,
};

const BANNER_BY_REASON = new Map<ChallengeFailureReason, TwoFactorBannerCode>([
  ['rate_limited', 'rate_limited'],
  ['network', 'transient'],
  ['server', 'transient'],
]);

const SHORT_DIGITS = /^\d{0,5}$/;
const WHITESPACE = /\s+/g;

export function fieldErrorOf(raw: string, mode: ChallengeView['mode']): TwoFactorFieldError {
  const compact = raw.replace(WHITESPACE, '');
  return mode === 'totp' && SHORT_DIGITS.test(compact) ? 'incomplete' : 'format';
}

function settle(view: ChallengeView, result: ChallengeResult | null): ChallengeView {
  if (result === null || result.kind === 'completed') return view;
  if (result.reason === 'invalid_code') {
    return { ...view, value: '', fieldError: 'invalid_code', focusRequest: view.focusRequest + 1 };
  }
  const banner = BANNER_BY_REASON.get(result.reason);
  return banner === undefined ? view : { ...view, banner };
}

function withInput(
  view: ChallengeView,
  action: ChallengeSubmittedAction | ChallengeRejectedAction
): ChallengeView {
  if (action.type === 'submitted') {
    return { ...view, value: action.value, fieldError: null, banner: null };
  }
  const { value, fieldError } = action;
  return { ...view, value, fieldError, banner: null, focusRequest: view.focusRequest + 1 };
}

function switchView(view: ChallengeView): ChallengeView {
  const mode = view.mode === 'totp' ? 'recovery' : 'totp';
  return { ...INITIAL_VIEW, mode, focusRequest: view.focusRequest + 1 };
}

function reduceChallenge(view: ChallengeView, action: ChallengeAction): ChallengeView {
  if (action.type === 'settled') return settle(view, action.result);
  if (action.type === 'switched') return switchView(view);
  return withInput(view, action);
}

export default function useChallengeView(): ChallengeViewStore {
  const [view, dispatch] = useReducer(reduceChallenge, INITIAL_VIEW);
  return { view, dispatch };
}
