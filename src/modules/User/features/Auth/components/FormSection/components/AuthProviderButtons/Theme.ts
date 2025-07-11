import breakpointsTheme from '@/components/UIBreakpoints';
import { customColors } from '@/styles/colors';
import { createTheme } from '@mui/material';

export default createTheme({
  components: {
    MuiDivider: {
      styleOverrides: {
        root: {
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontStyle: 'normal',
          fontSize: '0.875rem',
          lineHeight: '1.2857',
          textTransform: 'uppercase',
          color: customColors.decorative.divider,

          '& .MuiDivider-wrapper': {
            padding: '0rem 1.375rem',
          },

          [`@media (max-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
            marginBottom: '1.125rem',

            fontWeight: 400,
            fontSize: '1.125rem',
            lineHeight: 1,
          },
          '@media (min-width:768px)': {
            marginBottom: '1.5rem',

            fontWeight: 500,
            fontSize: '0.875rem',
            lineHeight: '1.2857',
          },
        },
      },
    },
  },
});
