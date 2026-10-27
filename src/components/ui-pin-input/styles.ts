import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors, paletteColors } from '@/styles/colors';
import { focusVisibleRing } from '@/styles/focus-ring';

const CELL = '& .ui-pin-input__cell';
const ACTIVE_CELL = '&& .ui-pin-input__cell';
const ENABLED = ':not([aria-disabled="true"])';

export default {
  '&': {
    width: '100%',
  },
  '& [role="group"]': {
    width: '100%',
    gap: '4px',
  },
  [CELL]: {
    flex: '1 1 0',
    width: 'auto',
    minWidth: 0,
    maxWidth: '49px',
    minHeight: '64px',
    height: '64px',
    color: customColors.text.dark,
    borderColor: paletteColors.border.strong,
  },
  [`${CELL}::placeholder`]: {
    color: 'transparent',
  },
  [`${ACTIVE_CELL}:hover${ENABLED}`]: {
    borderColor: customColors.text.muted,
  },
  [`${ACTIVE_CELL}[aria-invalid="true"]${ENABLED}`]: {
    borderColor: paletteColors.error.main,
  },
  [`${ACTIVE_CELL}:focus-visible${ENABLED}`]: focusVisibleRing['&:focus-visible'],
  [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
    '& [role="group"]': {
      gap: '8px',
    },
    [CELL]: {
      flex: '0 1 auto',
      width: '64px',
      maxWidth: '64px',
      minWidth: 0,
      minHeight: '86px',
      height: '86px',
    },
  },
};
