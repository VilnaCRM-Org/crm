import type { RecoveryCodesRegenerate } from '../types/hooks/two-factor-operations';
import type {
  TwoFactorOperationPlan,
  TwoFactorSettingsHookDeps,
} from '../types/two-factor/settings-view';

import useSettledSubmit from './use-settled-submit';
import useTwoFactorSettle from './use-two-factor-settle';

const REGENERATE_PLAN: TwoFactorOperationPlan = {
  view: 'codes',
  statusCode: null,
  record: null,
  failures: new Map([
    ['reauth_required', { view: 'reauth', fieldError: null, statusCode: null, record: null }],
    [
      'not_enabled',
      { view: 'off', fieldError: null, statusCode: 'already_off', record: 'disabled' },
    ],
  ]),
};

export default function useRecoveryCodesRegenerate(
  deps: TwoFactorSettingsHookDeps
): RecoveryCodesRegenerate {
  const { provider } = deps;
  const { settle, show } = useTwoFactorSettle(deps);
  const regenerating = useSettledSubmit<null>({
    run: (_input, signal) => provider.regenerate(signal),
    plan: REGENERATE_PLAN,
    settle,
  });

  return {
    isSubmitting: regenerating.isSubmitting,
    open: () => show('regenerate'),
    regenerate: () => regenerating.send(null),
  };
}
