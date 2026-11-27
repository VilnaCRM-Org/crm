import { keyframes } from '@emotion/react';

import { customColors, paletteColors } from '@/styles/colors';

const DESKTOP = '@media (min-width:1440px)';

const BELOW_DESKTOP = '@media (max-width:1439.95px)';

const DESKTOP_COLOURS = '@media (min-width:1440px) and (forced-colors: none)';

const DESKTOP_FORCED = '@media (min-width:1440px) and (forced-colors: active)';

const REDUCED_MOTION = '@media (prefers-reduced-motion: reduce)';

const FORCED_COLORS = '@media (forced-colors: active)';

const CARD_WIDTH = 'min(313px, calc(100vw - 32px))';

const CARD_LEFT_CENTRED = `calc(var(--bell-centre-x, 100vw) - ${CARD_WIDTH} / 2)`;

const CARD_LEFT_LIMIT = `calc(100vw - 16px - ${CARD_WIDTH})`;

const CARD_LEFT = `clamp(16px, ${CARD_LEFT_CENTRED}, ${CARD_LEFT_LIMIT})`;

const CARET_POLYGON = 'polygon(50% 0, 0 100%, 100% 100%)';

export const cardAnchor = {
  top: 'calc(var(--bell-bottom, 64px) + 10px)',
  left: CARD_LEFT,
  width: CARD_WIDTH,
  '--bell-card-left': CARD_LEFT,
} as const;

export const caretShape = {
  clipPath: CARET_POLYGON,
  left: 'calc(var(--bell-centre-x, 0px) - var(--bell-card-left) - 14px)',
  width: '26px',
  height: '6px',
} as const;

const OUTLINE_OFFSETS = ['1px 0 0', '-1px 0 0', '0 1px 0', '0 -1px 0'];

const CARD_DROP = 'drop-shadow(0 8px 27px rgba(49, 59, 67, 0.05))';

const white = paletteColors.background.default;

const EDGE = 'var(--bell-notice-edge)';

const outline = OUTLINE_OFFSETS.map((offset) => `drop-shadow(${offset} ${EDGE})`);

const enter = keyframes`
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: none; }
`;

const entrance = '180ms cubic-bezier(0.2, 0, 0, 1)';

export default {
  root: {
    '--bell-notice-edge': paletteColors.border.strong,
    [DESKTOP]: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '279px',
      height: '117px',
      pointerEvents: 'none',
      transformOrigin: '24px 0',
      animation: `${enter} ${entrance}`,
    },
    [DESKTOP_COLOURS]: {
      filter: [...outline, CARD_DROP].join(' '),
    },
    [DESKTOP_FORCED]: { isolation: 'isolate' },
    [REDUCED_MOTION]: { animation: 'none' },
  },
  pill: {
    display: 'none',
    [DESKTOP]: {
      display: 'block',
      position: 'absolute',
      left: 0,
      top: 0,
      width: '48px',
      height: '67px',
      borderRadius: '24px 24px 0 0',
      backgroundColor: white,
    },
    [DESKTOP_FORCED]: {
      zIndex: 1,
      boxSizing: 'border-box',
      height: '56px',
      border: '1px solid CanvasText',
      borderBottom: 'none',
    },
  },
  card: {
    position: 'fixed',
    ...cardAnchor,
    boxSizing: 'border-box',
    borderRadius: '0.5rem',
    border: `1px solid ${EDGE}`,
    backgroundColor: white,
    boxShadow: customColors.shell.popoverShadow,
    [BELOW_DESKTOP]: {
      transformOrigin: 'calc(var(--bell-centre-x, 0px) - var(--bell-card-left)) 0',
      animation: `${enter} ${entrance}`,
    },
    [DESKTOP]: {
      position: 'absolute',
      left: 0,
      top: '55px',
      width: '279px',
      minHeight: '62px',
      borderRadius: '0 0.75rem 0.75rem 0.75rem',
      border: 0,
      boxShadow: 'none',
      pointerEvents: 'auto',
    },
    [REDUCED_MOTION]: { animation: 'none' },
    [FORCED_COLORS]: { border: '1px solid CanvasText', boxShadow: 'none' },
  },
  caret: {
    position: 'absolute',
    ...caretShape,
    top: '-7px',
    backgroundColor: EDGE,
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '1px',
      right: '2px',
      bottom: '-1px',
      left: '2px',
      backgroundColor: white,
      clipPath: CARET_POLYGON,
    },
    [DESKTOP]: { display: 'none' },
    [FORCED_COLORS]: { backgroundColor: 'CanvasText' },
  },
  body: {
    padding: '15px 14px 11px 14px',
    maxHeight: 'max(4rem, calc(50dvh - 4rem))',
    overflowY: 'auto',
    color: customColors.text.dark,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    margin: 0,
    padding: 0,
    listStyle: 'none',
    '& > li + li': {
      borderTop: `1px solid ${paletteColors.background.subtle}`,
      paddingTop: '0.75rem',
    },
  },
} as const;
