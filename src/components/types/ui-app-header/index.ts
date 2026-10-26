import type { ReactNode, Ref, RefObject } from 'react';

import type { ShellLayout } from '../ui-app-shell';
import type { NavigationItemSet } from '../ui-app-shell/navigation-item';
import type { ActivateHandler, SignOutHandler } from '../ui-sidebar';

import type { ShellBadgeCounts } from './shell-badge-counts';

export type HeaderControlKind = 'notifications' | 'tasks';

export type HeaderSearchLayout = 'tablet' | 'desktop' | 'drawer';

export interface HeaderNavigation {
  readonly items: NavigationItemSet;
  readonly signOut: SignOutHandler;
  readonly avatar?: ReactNode | undefined;
}

export interface UIAppHeaderProps {
  readonly layout: ShellLayout;
  readonly navigation?: HeaderNavigation | undefined;
  readonly badgeCounts?: ShellBadgeCounts | null | undefined;
  readonly userMenu?: ReactNode | undefined;
}

export interface HeaderLogoProps {
  readonly layout: ShellLayout;
}

export interface HeaderSearchProps {
  readonly layout: HeaderSearchLayout;
}

export interface HeaderIconButtonProps {
  readonly layout: ShellLayout;
  readonly kind: HeaderControlKind;
  readonly count?: number | null | undefined;
}

export interface UserSlotFrameProps {
  readonly layout: ShellLayout;
  readonly children?: ReactNode | undefined;
}

export interface HeaderHiddenTextProps {
  readonly id: string;
  readonly children: ReactNode;
}

export interface MenuToggleButtonProps {
  readonly open: boolean;
  readonly controls?: string | undefined;
  readonly onToggle: ActivateHandler;
  readonly ref?: Ref<HTMLButtonElement> | undefined;
}

export interface MobileNavigationProps {
  readonly items: NavigationItemSet;
  readonly signOut: SignOutHandler;
  readonly avatar?: ReactNode | undefined;
}

export interface DrawerOpenFlags {
  readonly open: boolean;
  readonly restore: boolean;
}

export interface DrawerOpenState extends DrawerOpenFlags {
  readonly show: ActivateHandler;
  readonly dismiss: ActivateHandler;
  readonly leave: ActivateHandler;
}

export interface DrawerFocusOptions extends DrawerOpenFlags {
  readonly burger: RefObject<HTMLButtonElement | null>;
}
