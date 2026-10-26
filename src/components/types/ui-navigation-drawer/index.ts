import type { NavigationItemSet } from '../ui-app-shell/navigation-item';
import type { ActivateHandler, SignOutHandler } from '../ui-sidebar';

export interface UINavigationDrawerProps {
  readonly open: boolean;
  readonly id: string;
  readonly items: NavigationItemSet;
  readonly signOut: SignOutHandler;
  readonly onClose: ActivateHandler;
  readonly onNavigate: ActivateHandler;
}

export interface DrawerHeaderProps {
  readonly onDismiss: ActivateHandler;
}

export interface DrawerPanelProps {
  readonly items: NavigationItemSet;
  readonly signOut: SignOutHandler;
  readonly onNavigate: ActivateHandler;
}

export interface DrawerScrimProps {
  readonly duration: number;
}
