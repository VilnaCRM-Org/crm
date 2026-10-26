import { customColors } from '@/styles/colors';

const GROW = 'var(--user-chip-grow, 0px)';

const nameBase = {
  position: 'absolute',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontWeight: 500,
  lineHeight: '18px',
  color: customColors.text.dark,
};

const sizerBox = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: 0,
  height: 0,
  overflow: 'hidden',
  visibility: 'hidden',
  pointerEvents: 'none',
  fontWeight: 500,
};

const copyBase = { display: 'block', width: 'max-content', whiteSpace: 'nowrap' };

const copyText = { content: 'attr(data-text)' };

export default {
  box: {
    desktop: { display: 'block', width: `calc(223px + ${GROW})`, maxWidth: '648px' },
    tablet: { display: 'block', width: `calc(251px + ${GROW})`, maxWidth: '367px' },
  },
  name: {
    desktop: {
      ...nameBase,
      left: '49px',
      top: '13px',
      width: `calc(121px + ${GROW})`,
      minWidth: '121px',
      maxWidth: '546px',
      fontSize: '14px',
    },
    tablet: {
      ...nameBase,
      left: '57px',
      top: '16px',
      width: `calc(138px + ${GROW})`,
      minWidth: '138px',
      maxWidth: '254px',
      fontSize: '16px',
    },
  },
  sizers: {
    desktop: { ...sizerBox, fontSize: '14px', '--chip-name-base': '14px' },
    tablet: { ...sizerBox, fontSize: '16px', '--chip-name-base': '16px' },
  },
  copy: {
    spaced: { ...copyBase, '&::before': copyText },
    rest: {
      ...copyBase,
      '&::before': {
        ...copyText,
        letterSpacing: 'normal !important',
        wordSpacing: 'normal !important',
      },
    },
  },
} as const;
