import { type Theme } from '@mui/material/styles';
import { type SystemStyleObject } from '@mui/system';

import { SMALL_MOBILE_BREAKPOINT, baseSkeletonStyle } from '@/components/skeletons/base/styles';
import breakpointsTheme from '@/components/ui-breakpoints';

export default {
  inputContainer: (theme: Theme): SystemStyleObject<Theme> => ({
    position: 'relative',
    boxSizing: 'border-box',
    borderRadius: '0.5rem',
    height: 'clamp(3rem, 4vw, 4rem)',
    width: '100%',
    ...baseSkeletonStyle,
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: '1px',
      borderRadius: 'calc(0.5rem - 1px)',
      backgroundColor: theme.palette.background.default,
    },
    [`@media (min-width:${SMALL_MOBILE_BREAKPOINT}px)`]: {
      minWidth: '19.6875rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      height: '4.9375rem',
      minWidth: '33.75rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      minWidth: '26.375rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      maxHeight: '4rem',
    },
  }),
  inputPlaceholder: {
    ...baseSkeletonStyle,
    position: 'absolute',
    zIndex: 1,
    width: '9.1875rem',
    height: '1.125rem',
    left: '1.25rem',
    top: '50%',
    transform: 'translateY(-50%)',
    borderRadius: '3.5625rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      left: '1.75rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      left: '1.6875rem',
    },
  },
};
