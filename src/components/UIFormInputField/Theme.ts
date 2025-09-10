import { createTheme } from '@mui/material';

import breakpointsTheme from '@/components/UIBreakpoints';
import { customColors, paletteColors } from '@/styles/colors';
import theme from '@/styles/theme';

export default createTheme({
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '8px',

          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: customColors.text.secondary,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            border: `1px solid ${customColors.text.secondary}`,
          },
          '&.Mui-disabled': {
            backgroundColor: paletteColors.background.subtle,
            color: customColors.text.secondary,
          },
          '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
            borderWidth: 0,
          },
        },
        notchedOutline: {
          border: `1px solid ${customColors.checkbox.main}`,
          borderRadius: '0.5rem',
          padding: 0,
        },

        input: {
          height: 'clamp(3rem, 4vw, 4rem)',
          padding: 'clamp(0.9375rem, 2vw, 1.4375rem) clamp(1.25rem, 2vw, 1.6875rem)',

          fontFamily: theme.customFonts.inter,
          fontWeight: 500,
          fontStyle: 'normal',
          fontSize: '1rem',
          lineHeight: '1.125rem',
          letterSpacing: 0,
          color: customColors.decorative.divider,

          boxSizing: 'border-box',

          '&::placeholder': {
            fontFamily: theme.customFonts.inter,
            fontWeight: 500,
            fontSize: '0.875rem',
            lineHeight: '1.125rem',
            letterSpacing: 0,

            color: customColors.text.secondary,

            [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
              fontWeight: 400,

              fontSize: '1.125rem',
              lineHeight: 1,
            },

            [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
              fontSize: '1.125rem',
              lineHeight: '1.125rem',
            },
            [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
              fontSize: '1rem',
              lineHeight: 1.125,
              letterSpacing: 0,
            },
          },

          [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
            height: '4.9375rem',

            paddingTop: '1.9375rem',
            paddingBottom: '1.875rem',
            paddingLeft: '1.75rem',
          },

          [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
            paddingTop: '1.9375rem',
            paddingLeft: '1.75rem',
            paddingBottom: '1.875rem',
          },
          [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
            maxHeight: '4rem',
            paddingTop: '1.4375rem',
            paddingBottom: '1.4375rem',
            paddingLeft: '1.6875rem',
          },
        },
      },
    },

    MuiFormHelperText: {
      styleOverrides: {
        root: {
          '&.Mui-error': {
            margin: '0.25rem 0 0 0',

            fontFamily: theme.customFonts.inter,
            fontWeight: 500,
            fontSize: '0.875rem',
            lineHeight: '1.125rem',
            letterSpacing: 0,
            color: paletteColors.error.main,
          },
        },
      },
    },
  },
});
