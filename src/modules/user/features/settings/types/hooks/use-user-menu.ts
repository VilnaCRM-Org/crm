import type { Dispatch, KeyboardEvent, RefObject, SetStateAction } from 'react';

import type { ShellLayout } from '@/components/types/ui-app-shell';

export type UserChipKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => void;

export type UserMenuKeyDown = (event: KeyboardEvent<HTMLElement>) => void;

export interface UserMenuOptions {
  readonly layout: ShellLayout;
}

export interface UserMenuControls {
  readonly show: () => void;
  readonly close: () => void;
  readonly dismiss: () => void;
}

export interface UserMenuState extends UserMenuControls {
  readonly open: boolean;
  readonly chip: RefObject<HTMLButtonElement | null>;
  readonly chipKeyDown: UserChipKeyDown;
  readonly menuKeyDown: UserMenuKeyDown;
}

export interface UserMenuRefocus {
  readonly refocus: boolean;
  readonly setRefocus: Dispatch<SetStateAction<boolean>>;
  readonly chip: RefObject<HTMLButtonElement | null>;
}

export interface UserMenuLayoutClose extends UserMenuOptions {
  readonly open: boolean;
  readonly setOpen: Dispatch<SetStateAction<boolean>>;
  readonly chip: RefObject<HTMLButtonElement | null>;
}

export interface UserMenuKeysOptions {
  readonly show: () => void;
  readonly dismiss: () => void;
}

export interface UserMenuKeys {
  readonly chipKeyDown: UserChipKeyDown;
  readonly menuKeyDown: UserMenuKeyDown;
}
