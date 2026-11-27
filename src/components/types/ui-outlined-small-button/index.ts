import type { SxProps, Theme } from '@mui/material/styles';
import type { MouseEventHandler, ReactNode, Ref } from 'react';

export interface OutlinedSmallButtonProps {
  readonly ref?: Ref<HTMLButtonElement> | undefined;
  readonly 'aria-label'?: string | undefined;
  readonly 'aria-disabled'?: boolean | undefined;
  readonly onClick?: MouseEventHandler<HTMLButtonElement> | undefined;
  readonly sx?: SxProps<Theme> | undefined;
  readonly children: ReactNode;
}
