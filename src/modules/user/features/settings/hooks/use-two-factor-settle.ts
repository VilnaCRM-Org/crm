import type {
  TwoFactorBannerCode,
  TwoFactorFieldError,
} from '@/modules/user/types/two-factor/code';

import type {
  TwoFactorSettingsFailureReason,
  TwoFactorSettingsOutcome,
} from '../types/two-factor/outcome';
import type {
  TwoFactorFailureRow,
  TwoFactorOperationPlan,
  TwoFactorSettingsHookDeps,
  TwoFactorSettingsView,
  TwoFactorSettingsViewState,
  TwoFactorSettle,
} from '../types/two-factor/settings-view';

const BANNERS = new Map<TwoFactorSettingsFailureReason, TwoFactorBannerCode>([
  ['rate_limited', 'rate_limited'],
  ['network', 'transient'],
  ['server', 'transient'],
  ['already_enabled', 'transient'],
  ['not_enabled', 'transient'],
  ['setup_not_initiated', 'transient'],
  ['invalid_code', 'transient'],
  ['reauth_required', 'transient'],
]);

function freshView(view: TwoFactorSettingsView): TwoFactorSettingsViewState {
  return { view, fieldError: null, banner: null, statusCode: null };
}

function show(deps: TwoFactorSettingsHookDeps, view: TwoFactorSettingsView): void {
  deps.apply({ settings: deps.read().settings, view: freshView(view) });
}

function refuse(deps: TwoFactorSettingsHookDeps, fieldError: TwoFactorFieldError): void {
  const { settings, view } = deps.read();
  deps.apply({ settings, view: { ...view, fieldError, banner: null } });
}

function keepWithBanner(
  deps: TwoFactorSettingsHookDeps,
  reason: TwoFactorSettingsFailureReason
): void {
  const { settings, view } = deps.read();
  const banner = BANNERS.get(reason);
  if (banner !== undefined) deps.apply({ settings, view: { ...view, fieldError: null, banner } });
}

function moveTo(deps: TwoFactorSettingsHookDeps, row: TwoFactorFailureRow): void {
  const { settings, view } = deps.read();
  const { fieldError, statusCode } = row;
  deps.apply({
    settings,
    view: { view: row.view ?? view.view, fieldError, banner: null, statusCode },
  });
  if (row.record !== null) deps.recordStatus(row.record);
}

function settle(
  deps: TwoFactorSettingsHookDeps,
  outcome: TwoFactorSettingsOutcome,
  plan: TwoFactorOperationPlan
): void {
  if (outcome.kind === 'changed') {
    const view = { ...freshView(plan.view), statusCode: plan.statusCode };
    deps.apply({ settings: outcome.settings, view });
    if (plan.record !== null) deps.recordStatus(plan.record);
    return;
  }
  const row = plan.failures.get(outcome.reason);
  if (row === undefined) keepWithBanner(deps, outcome.reason);
  else moveTo(deps, row);
}

export default function useTwoFactorSettle(deps: TwoFactorSettingsHookDeps): TwoFactorSettle {
  return {
    settle: (outcome, plan) => settle(deps, outcome, plan),
    show: (view) => show(deps, view),
    refuse: (fieldError) => refuse(deps, fieldError),
  };
}
