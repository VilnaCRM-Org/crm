import breakpointsTheme from '@/components/UIBreakpoints';
import { createTheme } from '@mui/material';

export default createTheme({
  components: {
    MuiDivider: {
      styleOverrides: {
        root: {
          '& .MuiDivider-wrapper': {
            [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
              padding: '0 1.375rem',
            },
          },
          [`@media (max-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
            marginBottom: '0.875rem',
          },
          '@media (min-width:768px)': {
            marginBottom: '1.5rem',
          },
          [`@media (max-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
            marginBottom: '1.125rem',
          },
        },
      },
    },
  },
});
