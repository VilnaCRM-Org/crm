import type { ComponentType, SVGProps } from 'react';

export interface OAuthProvider {
  label: string;
  SvgComponent: ComponentType<SVGProps<SVGSVGElement>>;
  onClick: () => void;
  ariaLabel: string;
}
