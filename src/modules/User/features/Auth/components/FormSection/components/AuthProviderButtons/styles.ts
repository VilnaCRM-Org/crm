import breakpointsTheme from '@/components/UIBreakpoints';
import { customColors } from '@/styles/colors';

export default {
  thirdPartyWrapper: {
    marginTop: '1.0625rem',

    [`@media (max-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginTop: '1.08rem',
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
      maxWidth: '8.25rem',
      margin: 0,

      '&:nth-of-type(2n+1)': {
        margin: 0,
      },
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      maxWidth: '6.25rem',
    },
  },
  serviceItemButton: {
    width: '100%',

    '&:hover, &:focus': {
      borderColor: customColors.brand.blue,
    },
  },
};
