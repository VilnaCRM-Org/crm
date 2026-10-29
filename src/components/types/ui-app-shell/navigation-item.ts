import type { ComponentType, SVGProps } from 'react';

import type { FeatureFlag } from '@/config/runtime/types/feature-flag';

export type NavigationItemId =
  | 'boards'
  | 'products'
  | 'orders'
  | 'contacts'
  | 'analytics'
  | 'settings'
  | 'integrations'
  | 'webhooks'
  | 'billing';

export type NavigationIcon = ComponentType<SVGProps<SVGSVGElement>>;

export interface NavigationLeaf {
  readonly id: NavigationItemId;
  readonly href: string;
  readonly labelKey: string;
  readonly icon: NavigationIcon;
  readonly flag?: FeatureFlag | undefined;
}

export interface NavigationLeafSet {
  readonly items: readonly NavigationLeaf[];
}

export interface NavigationGroup extends NavigationLeaf {
  readonly children: NavigationLeafSet;
}

export type NavigationItem = NavigationLeaf | NavigationGroup;

export interface NavigationItemSet {
  readonly items: readonly NavigationItem[];
}
