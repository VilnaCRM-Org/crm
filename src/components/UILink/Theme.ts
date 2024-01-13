import { createTheme } from '@mui/material';

export default createTheme({
  components: {
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
        },
      }
    }
  }
});
