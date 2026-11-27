import { useLayoutEffect, useRef } from 'react';
import { useParams } from 'react-router';

import socialLinkChannelAdapter from '@/modules/user/lib/social-link/social-link-channel-adapter';
import type { SocialCallbackQuery } from '@auth/types/social-sign-in/social-callback-view';
import socialCallbackViewMapper from '@auth/utils/social-callback-view-mapper';

export default function useSocialLinkReturn(query: SocialCallbackQuery): void {
  const { provider } = useParams();
  const handed = useRef<SocialCallbackQuery | null>(null);
  useLayoutEffect(() => {
    socialCallbackViewMapper.stripQuery();
    if (handed.current === query) return;
    handed.current = query;
    socialLinkChannelAdapter.post({ provider, ...query });
    window.close();
  }, [provider, query]);
}
