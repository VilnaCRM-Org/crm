import { customColors, paletteColors } from '@/styles/colors';
import recoveryStyles from '@auth/components/reset-password/styles';

export default {
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  // The secondary "Back to sign in" link under a primary "Try again". The shared result action
  // turns a visited link white, which suits only the blue contained button; on this transparent
  // text variant that would be white on white, and the text variant has no focus ring of its own.
  backText: {
    ...recoveryStyles.resultAction,
    color: paletteColors.primary.linkText,
    '&:visited': { color: paletteColors.primary.linkText },
    '&:hover': { color: paletteColors.primary.linkTextHover, backgroundColor: 'transparent' },
    '&:focus-visible, &.Mui-focusVisible': {
      outline: `2px solid ${customColors.text.primary}`,
      outlineOffset: '2px',
    },
  },
};
