import type { SxProps, Theme } from '@mui/material/styles';

export interface StatusBadgeProps {
  readonly label: string;
  readonly active: boolean;
  readonly sx?: SxProps<Theme> | undefined;
}
