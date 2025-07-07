import breakpointsTheme from '@/components/UIBreakpoints';

export default {
  thirdPartyWrapper: {
    paddingTop: '1.0625rem',

    [`@media (max-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      paddingTop: '1.5rem',
    },
  },

  divider: {
    marginBottom: '0.875rem',

    '& .MuiDivider-wrapper': {
      padding: '0rem 1.375rem',
    },

    fontFamily: `'Inter', sans-serif`,
    fontWeight: 500,
    fontStyle: 'normal',
    fontSize: '0.875rem',
    lineHeight: '1.2857',
    letterSpacing: 0,
    color: '#57595B',
    textTransform: 'uppercase',

    [`@media (max-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginBottom: '1.125rem',

      fontWeight: 400,
      fontSize: '1.125rem',
      lineHeight: 1,
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginBottom: '1.5rem',

      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: '1.2857',
    },
  },

  servicesList: {
    padding: 0,

    '& .MuiButton-root': {
      margin: 0,
    },
  },
  servicesItem: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',

    width: '100%',
  },
  serviceItemButton: {
    margin: 0,
    padding: 0,
  },
};
