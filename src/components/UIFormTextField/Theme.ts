import { createTheme } from '@mui/material';

import breakpointsTheme from '@/components/UIBreakpoints';

export default createTheme({
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          paddingRight: '1.25rem',
          borderRadius: '8px',

          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#969B9D',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            border: '1px solid #969B9D',
          },
          '&.Mui-disabled': {
            backgroundColor: '#E1E7EA',
            color: '#969B9D',
          },
          '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
            borderWidth: 0,
          },
        },
        notchedOutline: {
          border: '1px solid #D0D4D8',
          borderRadius: '8px',
          padding: 0,

          '&:hover': {
            borderColor: '#969B9D',
          },
        },

        input: {
          height: '3rem',
          paddingTop: '0.9375rem',
          paddingBottom: '0.9375rem',
          paddingLeft: '1.25rem',

          fontFamily: `Inter, sans-serif`,
          fontWeight: 500,
          fontStyle: 'normal',
          fontSize: '0.875rem',
          lineHeight: 1.2857,
          letterSpacing: 0,
          color: '#404142',

          boxSizing: 'border-box',
          borderRadius: '0.5rem',
          borderWidth: '1px',

          '&::placeholder': {
            color: '#969B9D',
          },

          [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
            height: '4.9375rem',

            paddingTop: '1.9375rem',
            paddingBottom: '1.875rem',
            paddingLeft: '1.75rem',

            fontWeight: 400,
            fontSize: '1.125rem',
            lineHeight: 1,
          },
          [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
            maxHeight: '4.6rem',
            paddingTop: '2.2rem',
            paddingLeft: '1.7rem',

            fontSize: '1.125rem',
            lineHeight: '1.125rem',
          },
        },
      },
    },
  },
});
