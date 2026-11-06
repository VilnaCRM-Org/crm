import { keyframes } from '@emotion/react';

import layoutStyles from '@/components/layouts/app-layout.styles';
import { customColors, paletteColors } from '@/styles/colors';

const REDUCED_MOTION = '@media (prefers-reduced-motion: reduce)';

const wrapper = {
  position: 'relative',
  flexShrink: 0,
  transition: 'width 200ms ease-out, padding-right 200ms ease-out',
  [REDUCED_MOTION]: { transitionDuration: '0s' },
};

const tabletWrapper = { ...wrapper, boxSizing: 'border-box' };

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
  top: '15px',
  right: '-9px',
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
  transition: 'right 200ms ease-out',
  [REDUCED_MOTION]: { transitionDuration: '0s' },
  '&:focus-visible': {
    outline: `2px solid ${customColors.text.dark}`,
    outlineOffset: '2px',
  },
  '&:focus:not(:focus-visible)': { outline: 'none' },
};

const textReveal = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const revealing = {
  animation: `${textReveal} 200ms ease-out`,
  [REDUCED_MOTION]: { animation: 'none' },
};

const glyphTurn = {
  transition: 'transform 200ms ease-out',
  [REDUCED_MOTION]: { transitionDuration: '0s' },
};

export default {
  wrapper: {
    desktop: {
      expanded: { ...wrapper, width: layoutStyles.sidebarExpandedWidth },
      rail: { ...wrapper, width: '72px' },
    },
    tablet: {
      expanded: { ...tabletWrapper, width: layoutStyles.sidebarExpandedWidth, paddingRight: 0 },
      rail: { ...tabletWrapper, width: '113px', paddingRight: '37px' },
    },
  },
  reveal: { '& li span, & li button[aria-expanded] svg': revealing },
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
      expanded: { ...handle, width: '24px', height: '24px' },
      rail: { ...handle, width: '24px', height: '24px' },
    },
    tablet: {
      expanded: { ...handle, width: '32px', height: '32px' },
      rail: { ...handle, right: '28px', width: '32px', height: '32px' },
    },
  },
  handleGlyph: {
    desktop: {
      position: 'absolute',
      top: '3px',
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
    expanded: { ...glyphTurn, transform: 'rotate(0deg)' },
    rail: { ...glyphTurn, transform: 'rotate(180deg)' },
  },
} as const;
