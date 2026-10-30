import layoutStyles from '@/components/layouts/app-layout.styles';
import { customColors, paletteColors } from '@/styles/colors';

const REDUCED_MOTION = '@media (prefers-reduced-motion: reduce)';

const wrapper = {
  position: 'relative',
  flexShrink: 0,
  transition: 'width 200ms ease-out',
  [REDUCED_MOTION]: { transitionDuration: '0s' },
};

const panel = {
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  border: `1px solid ${paletteColors.background.subtle}`,
  borderRadius: '12px',
  backgroundColor: paletteColors.background.default,
  boxShadow: customColors.shell.cardShadow,
};

const handle = {
  position: 'absolute',
  zIndex: 1,
  boxSizing: 'border-box',
  display: 'block',
  margin: 0,
  padding: 0,
  border: `1px solid ${paletteColors.background.subtle}`,
  borderRadius: '33px',
  backgroundColor: paletteColors.background.default,
  boxShadow: customColors.shell.handleShadow,
  color: customColors.text.secondary,
  cursor: 'pointer',
  '&:focus-visible': {
    outline: `2px solid ${customColors.text.dark}`,
    outlineOffset: '2px',
  },
  '&:focus:not(:focus-visible)': { outline: 'none' },
};

export default {
  wrapper: {
    desktop: {
      expanded: { ...wrapper, width: '238px' },
      rail: { ...wrapper, width: '72px', marginRight: '41px' },
    },
    tablet: { expanded: { ...wrapper, width: '238px' }, rail: { ...wrapper, width: '76px' } },
  },
  panel: {
    desktop: {
      ...panel,
      ...layoutStyles.navPanel.desktop,
      padding: '20px 0 21px',
    },
    tablet: {
      ...panel,
      ...layoutStyles.navPanel.tablet,
      padding: '23px 0 29px',
    },
  },
  handle: {
    desktop: {
      expanded: { ...handle, top: '15px', left: '223px', width: '24px', height: '24px' },
      rail: { ...handle, top: '15px', left: '57px', width: '24px', height: '24px' },
    },
    tablet: {
      expanded: { ...handle, top: '15px', left: '222px', width: '32px', height: '32px' },
      rail: { ...handle, top: '15px', left: '60px', width: '32px', height: '32px' },
    },
  },
  handleGlyph: {
    desktop: {
      position: 'absolute',
      top: '2px',
      left: '3px',
      width: '16px',
      height: '16px',
      fill: 'none',
    },
    tablet: {
      position: 'absolute',
      top: '5px',
      left: '5px',
      width: '20px',
      height: '20px',
      fill: 'none',
    },
  },
  handlePoints: {
    expanded: { transform: 'none' },
    rail: { transform: 'rotate(180deg)' },
  },
} as const;
