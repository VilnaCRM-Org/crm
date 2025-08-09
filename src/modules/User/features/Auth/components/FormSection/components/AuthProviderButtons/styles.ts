import breakpointsTheme from '@/components/UIBreakpoints';
import { customColors } from '@/styles/colors';

export default {
  thirdPartyWrapper: {
    marginTop: '1.0625rem',

    [`@media (max-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginTop: '1.08rem',
    },
    [`@media (max-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginTop: '1.5rem',
    },
    [`@media (max-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      marginTop: '0.8125rem',
    },
  },

  dividerText: {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 500,
    fontStyle: 'normal',
    fontSize: '0.875rem',
    lineHeight: '1.125rem',
    letterSpacing: 0,
    textTransform: 'uppercase',
    color: customColors.decorative.divider,

    [`@media (max-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      fontWeight: 400,
      fontSize: '1.125rem',
    },
    [`@media (max-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.2857,
    },
  },

  servicesList: {
    padding: 0,

    '& .MuiButton-root': {
      margin: 0,
    },

    [`@media (min-width:375px)`]: {
      display: 'flex',
      flexWrap: 'wrap',
    },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      flexWrap: 'nowrap',
      justifyContent: 'space-between',
    },
  },
  servicesItem: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',

    width: '100%',
    maxWidth: '9.5625',

    border: '1px solid  #E1E7EA',
    borderRadius: '0.75rem',

    [`@media (max-width:374px)`]: {
      '&:not(:last-child)': {
        marginBottom: '1rem',
      },
    },

    [`@media (min-width:375px)`]: {
      maxWidth: '9.625rem',
      marginTop: '0.5rem',

      '&:nth-of-type(2n+1)': {
        marginRight: '0.3rem',
      },

      '&:nth-of-type(-n+2)': {
        marginTop: 0,
      },
    },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      maxWidth: '8.0625rem',
      margin: 0,

      '&:nth-of-type(2n+1)': {
        margin: 0,
      },
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      maxWidth: '100px',
    },
  },
  serviceItemButton: {
    width: '100%',
    height: '100%',

    '&:hover, &:focus': {
      borderColor: customColors.brand.blue,
    },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      maxHeight: '75px',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      padding: '18px 39px',
    },
  },
  serviceItemButtonIcon: {
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      width: '2rem',
      height: '2rem',
    },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      width: '1.375rem',
      height: '1.375rem',
    },
  },
};
