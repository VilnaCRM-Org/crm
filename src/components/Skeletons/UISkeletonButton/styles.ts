import {
  SMALL_MOBILE_BREAKPOINT,
  baseSkeletonStyle,
} from '@/components/Skeletons/base/styles';
import breakpointsTheme from '@/components/UIBreakpoints';

export default {
  buttonSkeleton: {
    ...baseSkeletonStyle,
    border: '1px solid #E1E7EA',
    borderRadius: '57px',
    height: '3.125rem',
    width: '100%',
    [`@media (min-width:${SMALL_MOBILE_BREAKPOINT}px)`]: {
      minWidth: '19.6875rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      height: '4.375rem',
      minWidth: '33.75rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      minWidth: '26.375rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      height: '3.875rem',
    },
  },
};
