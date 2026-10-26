import type { KeyboardEvent, RefObject } from 'react';

import type { ShellLayout } from '@/components/types/ui-app-shell';

export type UserChipKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => void;

export type UserMenuKeyDown = (event: KeyboardEvent<HTMLElement>) => void;

export interface UserMenuOptions {
  readonly layout: ShellLayout;
}

export interface UserMenuState {
  readonly open: boolean;
  readonly chip: RefObject<HTMLButtonElement | null>;
  readonly show: () => void;
  readonly close: () => void;
  readonly dismiss: () => void;
  readonly chipKeyDown: UserChipKeyDown;
  readonly menuKeyDown: UserMenuKeyDown;
}

export interface UserMenuKeysOptions {
  readonly show: () => void;
  readonly dismiss: () => void;
}

export interface UserMenuKeys {
  readonly chipKeyDown: UserChipKeyDown;
  readonly menuKeyDown: UserMenuKeyDown;
}
