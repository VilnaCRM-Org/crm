import type { ComponentType, SVGProps } from 'react';

import type { SocialProvider } from '@auth/types/social-sign-in/social-provider';

export interface OAuthProviderList {
  readonly items: readonly OAuthProvider[];
}

export interface OAuthProvider {
  label: string;
  SvgComponent: ComponentType<SVGProps<SVGSVGElement>>;
  onClick: () => void;
}

export type OAuthProviderStart = (provider: SocialProvider) => void;
