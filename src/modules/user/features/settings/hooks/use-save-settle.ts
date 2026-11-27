import useNotifications from '@/hooks/use-notifications';
import type {
  NotificationDraft,
  NotificationDraftSet,
} from '@/lib/notifications/types/notification-draft';

import type { SavedAspect, SectionTargets } from '../types/hooks/use-profile-save';
import type {
  SaveSettle,
  SaveSettleContext,
  SaveSettleOptions,
} from '../types/hooks/use-save-settle';
import type {
  ProfileFailedOutcome,
  ProfileFailureReason,
  ProfileUpdateOutcome,
} from '../types/user-profile/outcome';
import type { ProfileChange } from '../types/user-profile/profile-change';

const SAVED_TOASTS = new Map<SavedAspect, string>([
  ['fullName', 'settings.toasts.saved'],
  ['email', 'settings.toasts.email_sent'],
  ['newPassword', 'settings.toasts.password_changed'],
]);

const FAILURE_TOASTS = new Map<ProfileFailureReason, string>([
  ['transient', 'settings.toasts.save_failed_transient'],
  ['rejected', 'settings.toasts.save_failed'],
  ['rate_limited', 'settings.toasts.rate_limited'],
]);

function savedDrafts(change: ProfileChange): NotificationDraftSet {
  const items: NotificationDraft[] = [];
  for (const [aspect, messageKey] of SAVED_TOASTS) {
    if (change[aspect] !== undefined) items.push({ kind: 'success', messageKey });
  }
  return { items };
}

function failureDrafts(
  outcome: ProfileFailedOutcome,
  { buttonRef }: SectionTargets
): NotificationDraftSet | null {
  const messageKey = FAILURE_TOASTS.get(outcome.reason);
  if (messageKey === undefined) return null;
  const action =
    outcome.reason === 'transient'
      ? { labelKey: 'auth.error.tryAgain', onActivate: (): void => buttonRef.current?.click() }
      : undefined;
  return { items: [{ kind: 'error', messageKey, action }] };
}

function settleSave(
  outcome: ProfileUpdateOutcome,
  change: ProfileChange,
  { props, targets, raise, dispatch }: SaveSettleContext
): void {
  if (outcome.kind === 'invalid') {
    return dispatch({ type: 'invalid', errors: outcome.errors });
  }
  if (outcome.kind === 'ok') props.adoption.adopt(outcome.user);
  const drafts = outcome.kind === 'ok' ? savedDrafts(change) : failureDrafts(outcome, targets);
  if (drafts === null) return;
  raise(drafts);
  dispatch({ type: 'settled', saved: outcome.kind === 'ok' });
}

export default function useSaveSettle(options: SaveSettleOptions): SaveSettle {
  const { raise } = useNotifications();

  return (outcome: ProfileUpdateOutcome, change: ProfileChange): void =>
    settleSave(outcome, change, { ...options, raise });
}
