import { Theme, createTheme } from '@mui/material';

const colorTheme: Theme = createTheme({
  palette: {
    primary: {
      main: '#1EAEFF',
    },
    secondary: {
      main: '#FFC01E',
    },
    error: {
      main: '#DC3939',
    },
    background: {
      default: '#FFFFFF',
    },
    grey: {
      50: '#E1E7EA',
      100: '#F4F5F6',
    },

    custom: {
      social: {
        icon: '#1B2327',
        iconHover: '#333333',
      },
      border: {
        default: '#EAECEE',
        focus: '#969B9D',
      },
      shadow: {
        subtle: '#E7E7E77D',
      },
      decorative: {
        divider: '#57595B',
      },
    },
  },
});

export default colorTheme;
