import type { SxProps, Theme } from '@mui/material/styles';
import type { ChangeEvent } from 'react';

export type CheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  sx?: SxProps<Theme> | undefined;
};
