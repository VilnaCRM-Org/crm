import { useEffect } from 'react';
import { useParams } from 'react-router';

import socialLinkChannelAdapter from '@/modules/user/lib/social-link/social-link-channel-adapter';
import type { SocialCallbackQuery } from '@auth/types/social-sign-in/social-callback-view';
import socialCallbackViewMapper from '@auth/utils/social-callback-view-mapper';

export default function useSocialLinkReturn(query: SocialCallbackQuery): void {
  const { provider } = useParams();
  useEffect(() => {
    socialLinkChannelAdapter.post({ provider, ...query });
    socialCallbackViewMapper.stripQuery();
    window.close();
  }, [provider, query]);
}
