import type { ReactNode } from 'react';

import type { ShellLayout } from '@/components/types/ui-app-shell';
import type { SignOutHandler } from '@/components/types/ui-sidebar';
import type { UserDisplayName } from '@/modules/user/types/lib/user-display-name';

import type { UserMenuState } from '../hooks/use-user-menu';

export type UserMenuChunkSource = 'app-shell:current-user';

export type UserMenuChunkFailureHandler = (source: UserMenuChunkSource, error: unknown) => void;

export interface UserMenuSlotProps {
  readonly signOut: SignOutHandler;
  readonly onChunkFailure: UserMenuChunkFailureHandler;
}

export interface CurrentUserMenuProps {
  readonly signOut: SignOutHandler;
}

export interface UserMenuProps {
  readonly identity: UserDisplayName | null;
  readonly settingsAvailable: boolean;
  readonly signOut: SignOutHandler;
}

export type UserAvatarSize = 'chip' | 'avatar';

export interface UserAvatarProps {
  readonly monogram: string;
  readonly size: UserAvatarSize;
}

export interface UserChipProps {
  readonly layout: ShellLayout;
  readonly identity: UserDisplayName | null;
  readonly menu: UserMenuState;
  readonly menuId: string;
}

export interface UserChipBodyProps {
  readonly layout: 'desktop' | 'tablet';
  readonly identity: UserDisplayName | null;
}

export interface UserMenuItemsProps {
  readonly layout: ShellLayout;
  readonly menuId: string;
  readonly settingsAvailable: boolean;
  readonly menu: UserMenuState;
  readonly signOut: SignOutHandler;
}

export interface UserMenuCardProps {
  readonly layout: ShellLayout;
  readonly open: boolean;
  readonly chip: ReactNode;
  readonly items: ReactNode;
}

export interface UserMenuLinkProps {
  readonly layout: ShellLayout;
  readonly label: string;
  readonly onClose: () => void;
}
