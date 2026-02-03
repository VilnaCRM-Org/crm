import breakpointsTheme from '@/components/UIBreakpoints';

export default {
  titleSkeleton: {
    marginBottom: '1rem',
  },
  subtitleSkeleton: {
    marginBottom: '3rem',
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
    marginBottom: '1rem',
  },
  lastFieldContainer: {
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
  inputSkeleton: {
    borderRadius: '8px',
    height: '3.25rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      height: '4.9375rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      height: '4rem',
    },
  },
  buttonSkeleton: {
    marginBottom: '3rem',
    borderRadius: '57px',
    height: '3.25rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      height: '4rem',
    },
  },
  divider: {
    marginBottom: '1.0625rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginBottom: '1.5625rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      marginBottom: '0.8755rem',
    },
  },
  dividerText: {
    width: 180,
  },
  socialContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.3rem',
    marginBottom: '1rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      flexWrap: 'nowrap',
      justifyContent: 'space-between',
      gap: 0,
    },
  },
  socialButton: {
    borderRadius: '12px',
    width: 'calc(50% - 0.15rem)',
    height: '3.25rem',
    marginBottom: '1rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
      marginBottom: '0.5rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      width: '8.0625rem',
      height: '3.75rem',
      marginBottom: 0,
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      width: '6.25rem',
    },
  },
  spacer: {
    height: '2.5rem',
  },
};
