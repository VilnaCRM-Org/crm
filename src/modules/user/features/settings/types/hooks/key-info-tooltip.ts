import type { RefObject } from 'react';

export interface KeyInfoTooltipState {
  readonly hovered: boolean;
  readonly engaged: boolean;
  readonly dismissed: boolean;
}

export interface KeyInfoTooltipHandlers {
  readonly onMouseEnter: () => void;
  readonly onMouseLeave: () => void;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
  readonly onClick: () => void;
}

export interface KeyInfoDismissal {
  readonly onEscape: () => void;
  readonly onOutside: () => void;
}

export type KeyInfoChange = Partial<KeyInfoTooltipState>;

export type KeyInfoUpdate = (change: KeyInfoChange) => void;

export interface KeyInfoTooltip {
  readonly open: boolean;
  readonly anchorRef: RefObject<HTMLElement | null>;
  readonly handlers: KeyInfoTooltipHandlers;
}
