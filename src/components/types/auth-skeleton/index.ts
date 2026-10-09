import type { SxProps, Theme } from '@mui/material';
import type { SystemStyleObject } from '@mui/system';

export interface AuthSkeletonProps {
  disableAnimation?: boolean;
}

export type Wrap = (baseSx: SystemStyleObject<Theme>) => SxProps<Theme>;

export interface SkeletonWrapProps {
  wrap: Wrap;
}

export interface SkeletonAnimatedWrapProps extends SkeletonWrapProps {
  disableAnimation: boolean;
}
