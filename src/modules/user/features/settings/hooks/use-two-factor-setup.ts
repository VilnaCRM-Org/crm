import type { TwoFactorSetup } from '../types/hooks/two-factor-operations';
import type {
  TwoFactorOperationPlan,
  TwoFactorSettingsHookDeps,
} from '../types/two-factor/settings-view';

import useCodeSubmit from './use-code-submit';
import useSettledSubmit from './use-settled-submit';
import useTwoFactorSettle from './use-two-factor-settle';

const SETUP_PLAN: TwoFactorOperationPlan = {
  view: 'setup',
  statusCode: null,
  record: null,
  failures: new Map([
    [
      'already_enabled',
      { view: 'on', fieldError: null, statusCode: 'already_on', record: 'enabled' },
    ],
  ]),
};

const CONFIRM_PLAN: TwoFactorOperationPlan = {
  view: 'codes',
  statusCode: null,
  record: 'enabled',
  failures: new Map([
    ['invalid_code', { view: null, fieldError: 'invalid_code', statusCode: null, record: null }],
    ['setup_not_initiated', { view: 'off', fieldError: null, statusCode: 'stale', record: null }],
  ]),
};

export default function useTwoFactorSetup(deps: TwoFactorSettingsHookDeps): TwoFactorSetup {
  const { provider, normalizer } = deps;
  const { settle, show, refuse } = useTwoFactorSettle(deps);
  const setup = useSettledSubmit<null>({
    run: (_input, signal) => provider.setup(signal),
    plan: SETUP_PLAN,
    settle,
  });
  const entry = { normalizer, accept: 'totp', refusal: 'incomplete', refuse } as const;
  const confirmation = useCodeSubmit(entry, {
    run: (dto, signal) => provider.confirm(dto, signal),
    plan: CONFIRM_PLAN,
    settle,
  });

  return {
    isSubmitting: setup.isSubmitting || confirmation.isSubmitting,
    start: () => setup.send(null),
    confirm: confirmation.send,
    done: () => show('on'),
  };
}
