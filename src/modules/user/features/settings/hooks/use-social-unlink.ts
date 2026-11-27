import useAbortableSubmit from '@/hooks/use-abortable-submit';
import type { SocialLinkProviderId } from '@/modules/user/types/social-link/social-link-callback';

import type {
  SocialLinkAction,
  SocialLinkDeps,
  SocialLinkTarget,
} from '../types/social-link/social-links';

export default function useSocialUnlink({
  provider,
  settle,
  busy,
}: SocialLinkDeps): SocialLinkAction {
  const { submit } = useAbortableSubmit((id: SocialLinkProviderId, signal) =>
    provider.unlink(id, signal)
  );

  return async (target: SocialLinkTarget): Promise<void> => {
    if (busy.isHeld()) return;
    const outcome = await busy.hold(submit(target.id));
    if (outcome !== null) settle({ target, intent: 'unlinked', outcome });
  };
}
