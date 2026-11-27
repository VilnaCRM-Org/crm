import useNotifications from '@/hooks/use-notifications';
import type { NotificationMessageKey } from '@/lib/notifications/types/notification-draft';
import type { NotificationKind } from '@/lib/notifications/types/notification-kind';

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

export default function useSocialLinkSettle(adopt: SocialLinkAdopt): SocialLinkSettle {
  const { raise } = useNotifications();

  return (settlement: SocialLinkSettlement): void => {
    const provider = settlement.target.label;
    const show = (kind: NotificationKind, messageKey: NotificationMessageKey): void =>
      raise({
        items: [
          { kind, messageKey, messageValues: { items: [{ name: 'provider', value: provider }] } },
        ],
      });
    settleOutcome(settlement, adopt, show);
  };
}
