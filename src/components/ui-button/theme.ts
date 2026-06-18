import { createTheme } from '@mui/material';
import { circularProgressClasses } from '@mui/material/CircularProgress';

import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors, paletteColors } from '@/styles/colors';

const { lg } = breakpointsTheme.breakpoints.values;

export default createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: 'Golos, Inter',
        },
        contained: {
          backgroundColor: '#1EAEFF',
          borderRadius: '57px',
          padding: '20px 32px',

          '&:hover': {
            backgroundColor: paletteColors.primary.hover,
            boxShadow: 'none',
          },
          '&:focus-visible': {
            backgroundColor: paletteColors.primary.hover,
            boxShadow: 'none',
            outline: `2px solid ${customColors.text.primary}`,
            outlineOffset: '2px',
          },
          '&:active': {
            backgroundColor: paletteColors.primary.active,
            boxShadow: 'none',
          },
          '&:disabled': {
            backgroundColor: paletteColors.background.subtle,
            color: paletteColors.background.default,
          },
          [`@media (prefers-reduced-motion: reduce)`]: {
            [`& .${circularProgressClasses.svg}`]: {
              animation: 'none',
            },
          },
        },
        outlined: {
          padding: '17px 38px',
          borderRadius: '12px',
          borderColor: '#E1E7EA',
          [`@media (max-width: ${lg}px)`]: {
            padding: '26px 52px',
          },
          '@media (max-width: 375px)': {
            padding: '17px 65px',
            marginBottom: '8px',
          },
        },
      },
    },
  },
});
