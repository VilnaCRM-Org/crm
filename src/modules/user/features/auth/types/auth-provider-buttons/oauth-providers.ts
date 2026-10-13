import type { ComponentType, SVGProps } from 'react';

export interface OAuthProviderList {
  readonly items: readonly OAuthProvider[];
}

export interface OAuthProvider {
  label: string;
  SvgComponent: ComponentType<SVGProps<SVGSVGElement>>;
  onClick: () => void;
}
