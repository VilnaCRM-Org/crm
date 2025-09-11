import { Theme, createTheme } from '@mui/material';

const breakpointsTheme: Theme = createTheme({
  breakpoints: {
    values: {
      xs: 320,
      sm: 480,
      md: 768,
      lg: 1024,
      xl: 1440,
    },
  },
});

export default breakpointsTheme;
