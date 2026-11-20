import { customColors } from '@/styles/colors';

export const focusVisibleRing = {
  '&:focus-visible': {
    outline: `2px solid ${customColors.text.primary}`,
    outlineOffset: '2px',
  },
} as const;
