import type { ReactNode } from 'react';

import type { ShellLayout } from '../ui-app-shell';

import type { ShellBadgeCounts } from './shell-badge-counts';

export type HeaderControlKind = 'notifications' | 'tasks';

export type HeaderSearchLayout = 'tablet' | 'desktop';

export interface UIAppHeaderProps {
  readonly layout: ShellLayout;
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
