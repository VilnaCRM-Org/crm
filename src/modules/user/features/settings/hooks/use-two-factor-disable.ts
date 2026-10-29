import type { TwoFactorDisable } from '../types/hooks/two-factor-operations';
import type {
  TwoFactorOperationPlan,
  TwoFactorSettingsHookDeps,
} from '../types/two-factor/settings-view';

import useCodeSubmit from './use-code-submit';
import useTwoFactorSettle from './use-two-factor-settle';

const DISABLE_PLAN: TwoFactorOperationPlan = {
  view: 'off',
  statusCode: 'disabled',
  record: 'disabled',
  failures: new Map([
    [
      'not_enabled',
      { view: 'off', fieldError: null, statusCode: 'already_off', record: 'disabled' },
    ],
    ['invalid_code', { view: null, fieldError: 'invalid_code', statusCode: null, record: null }],
  ]),
};

export default function useTwoFactorDisable(deps: TwoFactorSettingsHookDeps): TwoFactorDisable {
  const { provider, normalizer } = deps;
  const { settle, show, refuse } = useTwoFactorSettle(deps);
  const entry = { normalizer, accept: 'any', refusal: 'format', refuse } as const;
  const disabling = useCodeSubmit(entry, {
    run: (dto, signal) => provider.disable(dto, signal),
    plan: DISABLE_PLAN,
    settle,
  });

  return {
    isSubmitting: disabling.isSubmitting,
    open: () => show('disable'),
    disable: disabling.send,
    cancel: () => show('on'),
  };
}
