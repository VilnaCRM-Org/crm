import { customColors, paletteColors } from '@/styles/colors';

const FONT = 'Inter, sans-serif';

const ring = {
  '&:focus-visible': {
    outline: `2px solid ${customColors.text.dark}`,
    outlineOffset: '2px',
  },
  '&:focus:not(:focus-visible)': { outline: 'none' },
};

const root = { position: 'relative', flexShrink: 0 };

const chipBase = {
  ...ring,
  position: 'relative',
  display: 'block',
  boxSizing: 'border-box',
  width: '100%',
  margin: 0,
  padding: 0,
  border: 0,
  background: 'transparent',
  textAlign: 'left',
  cursor: 'pointer',
  borderRadius: '7px',
  fontFamily: FONT,
};

const caretBase = {
  position: 'absolute',
  width: '20px',
  height: '20px',
  transform: 'rotate(-90deg)',
  fill: 'none',
  color: customColors.text.secondary,
};

const cardBase = {
  position: 'relative',
  zIndex: 2,
  boxSizing: 'border-box',
  border: `1px solid ${customColors.checkbox.main}`,
  borderRadius: '8px',
  backgroundColor: paletteColors.background.default,
};

const itemBase = {
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  width: '100%',
  minHeight: 0,
  padding: '0 0 0 20px',
  fontFamily: FONT,
  fontWeight: 500,
  color: customColors.text.dark,
  textDecoration: 'none',
  '&:visited': { color: customColors.text.dark },
  '&:hover, &:focus-visible, &.Mui-focusVisible': {
    backgroundColor: paletteColors.background.paper,
  },
  '&:focus-visible, &.Mui-focusVisible': {
    outline: `2px solid ${customColors.text.dark}`,
    outlineOffset: '-2px',
  },
};

const cardItemEdges = {
  '&[href]:first-of-type, &:only-child': {
    borderTop: `1px solid ${paletteColors.background.subtle}`,
  },
  '&:last-child': { borderRadius: '0 0 7px 7px' },
};

const cardList = { margin: '1px -1px -1px', padding: 0, listStyle: 'none' };

export default {
  root: {
    desktop: { ...root, width: 'max-content', minWidth: '225px', height: '48px' },
    tablet: { ...root, width: 'max-content', minWidth: '253px', height: '52px' },
    mobile: { ...root, width: '40px', height: '40px' },
  },
  backdrop: { position: 'fixed', inset: 0, zIndex: 1 },
  card: {
    desktop: { ...cardBase, minWidth: '225px', minHeight: '48px' },
    tablet: { ...cardBase, minWidth: '253px', minHeight: '52px' },
    open: { boxShadow: customColors.shell.cardShadow },
  },
  chip: {
    desktop: { ...chipBase, height: '46px' },
    tablet: { ...chipBase, height: '50px' },
    mobile: {
      ...chipBase,
      position: 'absolute',
      inset: '-2px',
      width: '44px',
      height: '44px',
      padding: '2px',
      borderRadius: '50%',
    },
  },
  avatar: {
    chip: { desktop: { left: '7px', top: '6px' }, tablet: { left: '15px', top: '9px' } },
    base: {
      position: 'absolute',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      backgroundColor: paletteColors.background.subtle,
      color: customColors.text.dark,
      fontFamily: 'Golos',
      fontWeight: 700,
      lineHeight: 1,
    },
    sizes: {
      chip: { width: '32px', height: '32px', fontSize: '12px' },
      avatar: { position: 'relative', width: '40px', height: '40px', fontSize: '15px' },
    },
  },
  glyph: { chip: { fontSize: '20px' }, avatar: { fontSize: '24px' } },
  caret: {
    desktop: { ...caretBase, right: '12px', top: '13px' },
    tablet: { ...caretBase, right: '15px', top: '15px' },
  },
  list: {
    desktop: cardList,
    tablet: cardList,
    mobile: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      margin: 0,
      padding: 0,
      listStyle: 'none',
    },
  },
  item: {
    desktop: {
      ...itemBase,
      ...cardItemEdges,
      height: '44px',
      fontSize: '14px',
      lineHeight: '18px',
    },
    tablet: {
      ...itemBase,
      ...cardItemEdges,
      height: '60px',
      fontSize: '16px',
      lineHeight: '18px',
    },
    mobile: { ...itemBase, height: '44px', fontSize: '14px', lineHeight: '18px' },
  },
  popover: {
    position: 'absolute',
    top: '45px',
    right: '-45px',
    zIndex: 2,
    width: '225px',
  },
  popoverCaret: {
    marginLeft: '148px',
    width: '26px',
    height: '6px',
    backgroundColor: paletteColors.background.subtle,
    clipPath: 'polygon(50% 0, 100% 100%, 0 100%)',
  },
  popoverBody: {
    boxSizing: 'border-box',
    borderRadius: '8px',
    backgroundColor: paletteColors.background.default,
    boxShadow: `inset 0 0 0 1px ${customColors.checkbox.main}, ${customColors.shell.popoverShadow}`,
    overflow: 'hidden',
  },
} as const;
