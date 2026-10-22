import type { ComponentType, SVGProps } from 'react';

export interface SocialTileProps {
  readonly label: string;
  readonly Icon: ComponentType<SVGProps<SVGSVGElement>>;
  readonly status: string;
}
