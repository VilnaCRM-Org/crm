import type { FocusEventHandler, KeyboardEventHandler, RefObject } from 'react';

import type { ShellLayout } from '@/components/types/ui-app-shell';

export interface BellDisclosureControls {
  readonly show: () => void;
  readonly close: () => void;
  readonly toggle: () => void;
}

export interface BellDismissal {
  readonly keyDown: KeyboardEventHandler<HTMLElement>;
  readonly focusOut: FocusEventHandler<HTMLElement>;
}

export interface BellDisclosure extends BellDisclosureControls, BellDismissal {
  readonly expanded: boolean;
  readonly visited: boolean;
  readonly opens: number;
  readonly bell: RefObject<HTMLButtonElement | null>;
  readonly wrapper: RefObject<HTMLDivElement | null>;
}

export interface BellOutsideCloseOptions {
  readonly expanded: boolean;
  readonly close: () => void;
  readonly wrapper: RefObject<HTMLDivElement | null>;
}

export interface BellFocusOutOptions {
  readonly close: () => void;
  readonly wrapper: RefObject<HTMLDivElement | null>;
}

export interface BellDismissalOptions {
  readonly expanded: boolean;
  readonly close: () => void;
  readonly bell: RefObject<HTMLButtonElement | null>;
  readonly wrapper: RefObject<HTMLDivElement | null>;
}

export interface BellContextCloseOptions {
  readonly layout: ShellLayout;
  readonly close: () => void;
}
