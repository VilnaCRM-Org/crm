import type { NavigationItemSet } from '../ui-app-shell/navigation-item';

export type SidebarLayout = 'tablet' | 'desktop';

export type SignOutHandler = () => void;

export type ActivateHandler = () => void;

export interface UISidebarProps {
  readonly layout: SidebarLayout;
  readonly items: NavigationItemSet;
  readonly signOut: SignOutHandler;
}

export interface CollapseHandleProps {
  readonly layout: SidebarLayout;
  readonly collapsed: boolean;
  readonly onToggle: ActivateHandler;
}
