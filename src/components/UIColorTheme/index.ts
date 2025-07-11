import { Theme, createTheme } from '@mui/material';

const colorTheme: Theme = createTheme({
  palette: {
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
      text: {
        disabled: '#969B9D',
      },
    },
  },
});

export default colorTheme;
