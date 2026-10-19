import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { ToastQueue } from '@/components/types/ui-toast';
import useAbortableSubmit from '@/hooks/use-abortable-submit';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { UserEntity } from '@/modules/user/types/user/user-entity';
import { useService } from '@/providers/di';

import type ProfileProvider from '../data-providers/profile-provider';
import type { EmailResend, ResendSettleContext } from '../types/hooks/use-email-resend';
import type { UserEntityAdoption } from '../types/hooks/use-profile-load';
import type { ProfileFailureReason, ProfileResendOutcome } from '../types/user-profile/outcome';

const FAILURE_TOASTS = new Map<ProfileFailureReason, string>([
  ['rate_limited', 'settings.toasts.rate_limited'],
  ['transient', 'settings.toasts.resend_failed'],
  ['rejected', 'settings.toasts.resend_failed'],
]);

function settleResend(
  outcome: ProfileResendOutcome,
  { adoption, toasts, t }: ResendSettleContext
): void {
  if (outcome.kind === 'sent') {
    adoption.confirm(outcome.confirmed);
    if (outcome.confirmed) document.getElementById('email')?.focus();
    toasts.show({ items: [{ tone: 'success', message: t('settings.toasts.resent') }] });
    return;
  }
  const key = FAILURE_TOASTS.get(outcome.reason);
  if (key !== undefined) toasts.show({ items: [{ tone: 'error', message: t(key) }] });
}

export default function useEmailResend(
  user: UserEntity,
  adoption: UserEntityAdoption,
  toasts: ToastQueue
): EmailResend {
  const { t } = useTranslation();
  const provider = useService<ProfileProvider>(AUTH_TOKENS.ProfileProvider);
  const run = useCallback(
    (userId: string, signal: AbortSignal) => provider.resend(userId, signal),
    // Stryker disable next-line ArrayDeclaration: equivalent, the provider identity never changes
    [provider]
  );
  const { isSubmitting, submit } = useAbortableSubmit(run);

  const resend = async (): Promise<void> => {
    const outcome = await submit(user.id);
    if (outcome !== null) settleResend(outcome, { adoption, toasts, t });
  };

  return { isSubmitting, resend };
}
