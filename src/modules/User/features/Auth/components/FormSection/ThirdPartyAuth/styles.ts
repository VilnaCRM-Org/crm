import breakpointsTheme from '@/components/UIBreakpoints';
import Colors from '@/components/UIColorTheme/colors';

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
    color: Colors.decorative.divider,
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

    [`@media (min-width:375px)`]: {
      display: 'flex',
      flexWrap:'wrap',
    },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      flexWrap:'nowrap',
      justifyContent:'space-between',
    },
  },
  servicesItem: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',

    width: '100%',

    [`@media (max-width:374px)`]:{
      '&:not(:last-child)':{
        marginBottom:'1rem'
      },
    },


    [`@media (min-width:375px)`]: {
      maxWidth:'9.625rem',
      marginTop:'1rem',

      '&:nth-of-type(2n+1)':{
        marginRight:'0.3rem'
      },

      '&:nth-of-type(-n+2)': {
        marginTop:0
      }
    },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      maxWidth:'8.25rem',
      margin:0,

      '&:nth-of-type(2n+1)':{
        margin:0
      },
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      maxWidth:'6.25rem',

    },
  },
  serviceItemButton: {
    width: '100%',
    margin: 0,
    padding: 0,

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
     padding:'1.0625rem 2.5rem'
    },
  },
};
