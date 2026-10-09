import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors } from '@/styles/colors';

export default {
  thirdPartyWrapper: {
    marginTop: '1.0625rem',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginTop: '1.5rem',
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

    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      fontWeight: 400,
      fontSize: '1.125rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: '1.125rem',
    },
  },

  servicesList: {
    padding: 0,

    '& .MuiButton-root': {
      margin: 0,
    },

    [`@media (min-width:375px)`]: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 154fr) minmax(0, 153fr)',
      gridTemplateRows: 'repeat(2, auto)',
      gridAutoFlow: 'column',
      gap: '0.5rem',
    },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      display: 'flex',
      flexWrap: 'nowrap',
      justifyContent: 'space-between',
      gap: 0,
    },
  },
  servicesItem: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',

    width: '100%',
    borderRadius: '0.75rem',

    [`@media (max-width:374px)`]: {
      '&:not(:last-child)': {
        marginBottom: '1rem',
      },
    },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      maxWidth: '8.0625rem',
    },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      maxWidth: '6.25rem',
    },
  },
  serviceItemButton: {
    width: '100%',
    height: '100%',
    padding: '1.0625rem 4.0625rem',

    '&:hover, &:focus-visible': {
      borderColor: customColors.brand.blue,
    },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      padding: '1.3125rem 3rem 1.25rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      padding: '17px 39px',
    },
  },
  serviceItemButtonIcon: {
    width: '1.375rem',
    height: '1.375rem',

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
