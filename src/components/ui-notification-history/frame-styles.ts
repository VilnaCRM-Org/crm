import { cardAnchor, caretShape } from '@/components/ui-bell-notice/styles';
import { customColors, paletteColors } from '@/styles/colors';

const FORCED_COLORS = '@media (forced-colors: active)';

const white = paletteColors.background.default;

const caret = {
  ...caretShape,
  content: '""',
  position: 'absolute',
  top: '-7px',
  backgroundColor: paletteColors.border.default,
} as const;

export default {
  frame: {
    ...cardAnchor,
    position: 'fixed',
    boxSizing: 'border-box',
    borderRadius: '0.5rem',
    border: `1px solid ${paletteColors.border.default}`,
    backgroundColor: white,
    boxShadow: customColors.shell.popoverShadow,
    '&::before': caret,
    '&::after': {
      ...caret,
      top: '-6px',
      backgroundColor: white,
      width: '22px',
      height: '6px',
      left: 'calc(var(--bell-centre-x, 0px) - var(--bell-card-left) - 12px)',
    },
    [FORCED_COLORS]: { border: '1px solid CanvasText', boxShadow: 'none' },
  },
  scroller: {
    maxHeight: 'max(3.125rem, calc(100dvh - 80px - var(--toast-stack-clearance, 0px)))',
    overflowY: 'auto',
    borderRadius: 'inherit',
  },
} as const;
