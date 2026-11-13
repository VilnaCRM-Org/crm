import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors, paletteColors } from '@/styles/colors';

const CELL = '& .ui-pin-input__cell';
const ACTIVE_CELL = '&& .ui-pin-input__cell';
const ENABLED = ':not([aria-disabled="true"])';
const ERROR_HELPER = '&& .MuiFormHelperText-root.Mui-error';

export const PIN_GROUP_WRAPPER_SX = { width: '100%' };

export default {
  '&': {
    width: '100%',
  },
  '& [role="group"]': {
    width: '100%',
    gap: '4px',
    containerType: 'inline-size',
  },
  [CELL]: {
    '--pin-cell-width': 'min(49px, calc((100cqw - 20px) / 6))',
    boxSizing: 'border-box',
    flex: '0 0 auto',
    width: 'var(--pin-cell-width)',
    minWidth: 0,
    maxWidth: 'none',
    minHeight: '64px',
    height: '64px',
    color: customColors.text.muted,
    borderColor: paletteColors.background.subtle,
    caretColor: paletteColors.primary.main,
  },
  [`${CELL}::placeholder`]: {
    color: customColors.checkbox.main,
    opacity: 1,
  },
  [`${ACTIVE_CELL}:hover${ENABLED}`]: {
    borderColor: customColors.checkbox.main,
  },
  [`${ACTIVE_CELL}[aria-invalid="true"]${ENABLED}`]: {
    borderColor: paletteColors.error.main,
  },
  [`${ACTIVE_CELL}:focus${ENABLED}`]: {
    color: customColors.text.dark,
    outline: 'none',
  },
  [`${ACTIVE_CELL}:focus:placeholder-shown${ENABLED}`]: {
    paddingLeft: 'calc((var(--pin-cell-width) - 2px - 1ch) / 2)',
    paddingRight: 0,
  },
  [`${ACTIVE_CELL}:focus${ENABLED}::placeholder`]: {
    textIndent: 0,
  },
  [ERROR_HELPER]: {
    color: paletteColors.error.text,
  },
  [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
    '& [role="group"]': {
      gap: '8px',
    },
    [CELL]: {
      '--pin-cell-width': 'min(64px, calc((100cqw - 40px) / 6))',
      minHeight: '86px',
      height: '86px',
    },
  },
};
