import breakpointsTheme from '@/components/UIBreakpoints';

export default {
  formTitle: {
    fontSize: '1.375rem',
    fontFamily: 'Golos',
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: '1',

    marginBottom: '0.375rem',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
      fontSize: '1.875rem',
      fontWeight: '600',

      marginBottom: '0.74rem',
    },
  },

  formIntoText: {
    fontFamily: 'Golos',
    fontWeight: 400,
    fontSize: '0.9375rem',
    lineHeight: '1.67',
    letterSpacing: 0,

    marginBottom: '1rem',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
      fontSize: '1rem',
      lineHeight: '1.625',

      marginBottom: '1.25rem',
    },
  },
  formFieldWrapper: {
    '&:not(:last-of-type)': {
      marginBottom: '0.5rem',

      [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
        marginBottom: '1.125rem',
      },

      [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
        marginBottom: '1rem',
      },
    },
  },
  formFieldLabel: {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: 1.29,
    letterSpacing: 0,

    marginBottom: '0.25rem',

    color: '#404142',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
      fontSize: '1rem',
      lineHeight: 1.125,

      marginBottom: '0.6rem',
    },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      fontSize: '0.875rem',
    },
  },
};
