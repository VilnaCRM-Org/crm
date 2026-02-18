import { SMALL_MOBILE_BREAKPOINT } from '@/components/Skeletons/base/styles';
import breakpointsTheme from '@/components/UIBreakpoints';

export default {
  titleSkeleton: {
    height: '1.375rem',
    marginBottom: '0.5rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      height: '1.875rem',
      width: '10.3125rem',
      marginBottom: '0.9375rem',
    },
  },
  subtitleWrapper: {
    marginBottom: '1.0625rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginBottom: '1.25rem',
    },
  },
  subtitleFirstLine: {
    height: '1.5625rem',
    '@media (max-width:336px)': {
      height: '1.375rem',
      width: '100%',
      marginBottom: '0.375rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
      height: '1.625rem',
      width: '18.5rem',
    },
  },
  subtitleSecondLine: {
    display: 'none',
    '@media (max-width:336px)': {
      display: 'block',
      height: '1.375rem',
    },
  },
  fieldContainer: {
    marginBottom: '0.5rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
      marginBottom: '1.125rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginBottom: '1.4375rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginBottom: '1.125rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      marginBottom: '1rem',
    },
  },
  fieldLabel: {
    height: '1.125rem',
    marginBottom: '0.25rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      height: '0.984375rem',
      marginBottom: '0.25rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      height: '1.125rem',
      marginBottom: '0.5625rem',
    },
  },
  lastFieldContainer: {
    marginBottom: 0,
  },
  buttonSkeleton: {
    marginTop: '1rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginTop: '2.125rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginTop: '2.0625rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      marginTop: '1.1875rem',
    },
  },
  dividerText: {
    width: '1.86rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      width: '2.23rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      width: '1.86rem',
    },
  },
  divider: {
    marginTop: '1.0625rem',
    marginBottom: '0.875rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginBottom: '1.5rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginTop: '1.5625rem',
      marginBottom: '1.125rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      marginTop: '0.8755rem',
      marginBottom: '1.5rem',
    },
  },
  socialContainer: {
    display: 'block',
    [`@media (min-width:${SMALL_MOBILE_BREAKPOINT}px)`]: {
      display: 'flex',
      flexWrap: 'wrap',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      flexWrap: 'nowrap',
      justifyContent: 'space-between',
    },
  },
  socialButton: {
    border: '1px solid #E1E7EA',
    borderRadius: '0.75rem',
    height: '3.625rem',
    width: '100%',
    marginBottom: '1rem',
    '&:last-child': {
      marginBottom: 0,
    },
    [`@media (min-width:${SMALL_MOBILE_BREAKPOINT}px)`]: {
      maxWidth: '9.625rem',
      height: '4.75rem',
      marginTop: '0.5rem',
      marginBottom: 0,
      '&:nth-of-type(2n+1)': {
        marginRight: '0.3rem',
      },
      '&:nth-of-type(-n+2)': {
        marginTop: 0,
      },
      '&:last-child': {
        marginBottom: 0,
      },
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      maxWidth: '8.0625rem',
      height: '5.375rem',
      margin: 0,
      '&:nth-of-type(2n+1)': {
        margin: 0,
      },
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      height: '4.75rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      maxWidth: '6.25rem',
      height: '3.75rem',
    },
  },
  spacer: {
    height: '2.5625rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      height: '4.1rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      height: '2.625rem',
    },
  },
};
