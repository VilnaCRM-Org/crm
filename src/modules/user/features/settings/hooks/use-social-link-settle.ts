import { useTranslation } from 'react-i18next';

import type { ToastQueue, ToastTone } from '@/components/types/ui-toast';

import type { SocialLinkFailureKind } from '../types/social-link/outcome';
import type {
  SocialLinkAdopt,
  SocialLinkSettle,
  SocialLinkSettlement,
  SocialLinkShow,
  SocialLinkTarget,
} from '../types/social-link/social-links';

function settleFailure(
  target: SocialLinkTarget,
  reason: SocialLinkFailureKind,
  adopt: SocialLinkAdopt
): void {
  if (reason === 'provider_linked') adopt(target.id, 'linked');
}

function settleOutcome(
  { target, intent, outcome }: SocialLinkSettlement,
  adopt: SocialLinkAdopt,
  show: SocialLinkShow
): void {
  if (outcome.kind === 'aborted') return;
  if (outcome.kind === 'failed') {
    settleFailure(target, outcome.reason, adopt);
    show('error', `settings.social.failures.${outcome.reason}`);
    return;
  }
  adopt(target.id, intent);
  show('success', `settings.social.${intent}`);
}

export default function useSocialLinkSettle(
  adopt: SocialLinkAdopt,
  toasts: ToastQueue
): SocialLinkSettle {
  const { t } = useTranslation();

  return (settlement: SocialLinkSettlement): void => {
    const { label, controlRef } = settlement.target;
    const show = (tone: ToastTone, key: string): void =>
      toasts.show({
        items: [{ tone, message: t(key, { provider: label }), returnFocusRef: controlRef }],
      });
    settleOutcome(settlement, adopt, show);
  };
}
