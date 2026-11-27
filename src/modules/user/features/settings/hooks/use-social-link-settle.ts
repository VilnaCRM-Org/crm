import { useLayoutEffect, useState } from 'react';

import useNotifications from '@/hooks/use-notifications';
import type { NotificationMessageKey } from '@/lib/notifications/types/notification-draft';
import type { NotificationKind } from '@/lib/notifications/types/notification-kind';

import type { SocialLinkFailureKind } from '../types/social-link/outcome';
import type {
  SocialLinkAdopt,
  SocialLinkSettle,
  SocialLinkSettleDeps,
  SocialLinkSettlement,
  SocialLinkShow,
  SocialLinkStep,
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

function useTileReturn(deps: SocialLinkSettleDeps): SocialLinkStep {
  const { returnFocusRef } = deps;
  const [returned, setReturned] = useState<SocialLinkTarget | null>(null);
  useLayoutEffect(() => {
    if (returned !== null) returnFocusRef.current = returned.controlRef.current;
  }, [returned, returnFocusRef]);

  return (target: SocialLinkTarget): void => setReturned({ ...target });
}

export default function useSocialLinkSettle(deps: SocialLinkSettleDeps): SocialLinkSettle {
  const { raise } = useNotifications();
  const returnTo = useTileReturn(deps);

  return (settlement: SocialLinkSettlement): void => {
    const { target } = settlement;
    const show = (kind: NotificationKind, messageKey: NotificationMessageKey): void => {
      returnTo(target);
      raise({
        items: [
          {
            kind,
            messageKey,
            messageValues: { items: [{ name: 'provider', value: target.label }] },
          },
        ],
      });
    };
    settleOutcome(settlement, deps.adopt, show);
  };
}
