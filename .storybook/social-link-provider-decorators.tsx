import type { Decorator } from '@storybook/react-webpack5';
import { type JSX, useEffect, useState } from 'react';

import container from '@/config/dependency-injection-config';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import { SocialLinkProvider } from '@/modules/user/features/settings/data-providers';

const UNLINKED = { linked: async (): Promise<object> => ({ items: [] }) };

export const withNoSocialLinks: Decorator = function SocialLinkProviderDecorator(
  Story
): JSX.Element {
  useState(() => container.register(AUTH_TOKENS.SocialLinkProvider, { useValue: UNLINKED }));
  useEffect(
    () => (): void => {
      container.registerSingleton(AUTH_TOKENS.SocialLinkProvider, SocialLinkProvider);
    },
    []
  );
  return <Story />;
};
