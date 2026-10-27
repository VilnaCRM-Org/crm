import type { ReactNode } from 'react';

import type { NavigationItemSet } from '../ui-app-shell/navigation-item';
import type { ActivateHandler, SignOutHandler } from '../ui-sidebar';

export interface UINavigationDrawerProps {
  readonly open: boolean;
  readonly id: string;
  readonly items: NavigationItemSet;
  readonly signOut: SignOutHandler;
  readonly onClose: ActivateHandler;
  readonly onNavigate: ActivateHandler;
  readonly avatar?: ReactNode | undefined;
}

export interface DrawerHeaderProps {
  readonly onDismiss: ActivateHandler;
  readonly avatar?: ReactNode | undefined;
}

export interface DrawerHeaderCopiesProps {
  readonly avatar?: ReactNode | undefined;
}

export interface DrawerPanelProps {
  readonly items: NavigationItemSet;
  readonly signOut: SignOutHandler;
  readonly onNavigate: ActivateHandler;
}

export interface DrawerScrimProps {
  readonly duration: number;
}

export type FooterInsetRef = (scrim: HTMLElement | null) => (() => void) | undefined;
