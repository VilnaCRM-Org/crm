import type { TFunction } from 'i18next';
import { useCallback, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ToastDraft, ToastDraftSet } from '@/components/types/ui-toast';
import useAbortableSubmit from '@/hooks/use-abortable-submit';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import { useService } from '@/providers/di';

import type ProfileProvider from '../data-providers/profile-provider';
import type { ProfileFormProps } from '../types/components/profile-form';
import type {
  ProfileFormAction,
  ProfileSave,
  SaveSettleContext,
} from '../types/hooks/use-profile-save';
import type { ProfileFormState } from '../types/user-profile/form-state';
import type {
  ProfileFailedOutcome,
  ProfileField,
  ProfileFailureReason,
  ProfileFieldErrorSet,
  ProfileUpdateOutcome,
} from '../types/user-profile/outcome';
import type { ProfileChange } from '../types/user-profile/profile-change';
import type { ProfileFormValues } from '../types/user-profile/profile-form-values';
import ProfileChangeDetector from '../utils/profile-change-detector';

const NO_ERRORS: ProfileFieldErrorSet = { items: [] };

const INITIAL_STATE: ProfileFormState = { fieldErrors: NO_ERRORS, noChanges: false, settled: 0 };

const FIELD_ORDER: readonly ProfileField[] = [
  'fullName',
  'email',
  'currentPassword',
  'newPassword',
];

const SAVED_TOASTS = new Map<'fullName' | 'email' | 'newPassword', string>([
  ['fullName', 'settings.toasts.saved'],
  ['email', 'settings.toasts.email_sent'],
  ['newPassword', 'settings.toasts.password_changed'],
]);

const FAILURE_TOASTS = new Map<ProfileFailureReason, string>([
  ['transient', 'settings.toasts.save_failed_transient'],
  ['rejected', 'settings.toasts.save_failed'],
  ['rate_limited', 'settings.toasts.rate_limited'],
]);

function reduceFormState(state: ProfileFormState, action: ProfileFormAction): ProfileFormState {
  if (action.type === 'invalid') {
    return { ...state, noChanges: false, fieldErrors: action.errors };
  }
  const settled = action.type === 'settled' ? state.settled + 1 : state.settled;
  return { fieldErrors: NO_ERRORS, noChanges: action.type === 'no_changes', settled };
}

function savedDrafts(change: ProfileChange, t: TFunction): ToastDraftSet {
  const items: ToastDraft[] = [];
  for (const [aspect, key] of SAVED_TOASTS) {
    if (change[aspect] !== undefined) items.push({ tone: 'success', message: t(key) });
  }
  return { items };
}

function failureDrafts(
  outcome: ProfileFailedOutcome,
  t: TFunction,
  retry: () => void
): ToastDraftSet | null {
  const key = FAILURE_TOASTS.get(outcome.reason);
  if (key === undefined) return null;
  const action =
    outcome.reason === 'transient'
      ? { label: t('auth.error.tryAgain'), onActivate: retry }
      : undefined;
  return { items: [{ tone: 'error', message: t(key), action }] };
}

function sortedErrors({ items }: ProfileFieldErrorSet): ProfileFieldErrorSet {
  return {
    items: [...items].sort((a, b) => FIELD_ORDER.indexOf(a.field) - FIELD_ORDER.indexOf(b.field)),
  };
}

function settleSave(
  outcome: ProfileUpdateOutcome,
  change: ProfileChange,
  { props, t, dispatch }: SaveSettleContext
): void {
  if (outcome.kind === 'invalid') {
    return dispatch({ type: 'invalid', errors: sortedErrors(outcome.errors) });
  }
  if (outcome.kind === 'ok') props.adoption.adopt(outcome.user);
  const retry = (): void => props.saveRef.current?.click();
  const drafts = outcome.kind === 'ok' ? savedDrafts(change, t) : failureDrafts(outcome, t, retry);
  if (drafts === null) return;
  props.toasts.show(drafts);
  dispatch({ type: 'settled' });
}

export default function useProfileSave(props: ProfileFormProps): ProfileSave {
  const { t } = useTranslation();
  const provider = useService<ProfileProvider>(AUTH_TOKENS.ProfileProvider);
  const [changes] = useState(() => new ProfileChangeDetector());
  const [state, dispatch] = useReducer(reduceFormState, INITIAL_STATE);
  const run = useCallback(
    (change: ProfileChange, signal: AbortSignal) => provider.update(change, signal),
    // Stryker disable next-line ArrayDeclaration: equivalent, the provider identity never changes
    [provider]
  );
  const { isSubmitting, submit } = useAbortableSubmit(run);

  const save = async (values: ProfileFormValues): Promise<void> => {
    const change = changes.detect(props.user, values);
    if (change === null) return dispatch({ type: 'no_changes' });
    const outcome = await submit(change);
    if (outcome !== null) settleSave(outcome, change, { props, t, dispatch });
  };

  return { state, isSubmitting, changes, save, clear: () => dispatch({ type: 'clear' }) };
}
