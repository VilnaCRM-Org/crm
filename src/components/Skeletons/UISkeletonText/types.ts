import { SxProps, Theme } from '@mui/material';

export type SkeletonTextSize = 's' | 'm' | 'l';

export interface UISkeletonTextProps {
  size?: SkeletonTextSize;
  width?: string | number;
  sx?: SxProps<Theme>;
  'data-testid'?: string;
}
