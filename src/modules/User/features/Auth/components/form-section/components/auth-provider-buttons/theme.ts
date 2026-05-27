import { createTheme } from '@mui/material';

import breakpointsTheme from '@/components/UIBreakpoints';

export default createTheme({
  components: {
    MuiDivider: {
      styleOverrides: {
        root: {
          marginBottom: '14px',

          [`@media (max-width:${breakpointsTheme.breakpoints.values.md - 1}px)`]: {
            marginBottom: '0.875rem',
          },
          '@media (min-width:768px)': {
            marginBottom: '1.5rem',
          },
          [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
            marginBottom: ' 1.125rem',
          },

          [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
            marginBottom: '1.5rem',
          },

          '& .MuiDivider-wrapper': {
            padding: '0 1.375rem',

            [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
              padding: '0 1.375rem',
            },
          },
        },
      },
    },
  },
});
