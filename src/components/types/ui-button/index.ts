import type { ButtonProps } from '@mui/material/Button';

export interface ButtonLinkLocation {
  pathname?: string;
  search?: string;
  hash?: string;
}

export type ButtonLinkTarget = string | ButtonLinkLocation;

export interface UiButtonProps extends ButtonProps {
  to?: ButtonLinkTarget;
}
