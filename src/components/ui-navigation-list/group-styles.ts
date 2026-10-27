import { customColors } from '@/styles/colors';

const groupBase = { position: 'relative', flexShrink: 0, margin: 0, listStyle: 'none' };

const hitArea = { content: '""', position: 'absolute' };

export default {
  group: {
    expanded: {
      desktop: { ...groupBase, padding: '0 0 12px' },
      tablet: { ...groupBase, padding: '0 0 12px' },
      drawer: { ...groupBase, width: '233px', padding: '0 0 14px' },
    },
    collapsed: {
      desktop: { ...groupBase, padding: 0 },
      tablet: { ...groupBase, padding: 0 },
      drawer: { ...groupBase, width: '233px', padding: 0 },
    },
  },
  subList: { margin: 0, padding: 0, listStyle: 'none' },
  toggleBase: {
    position: 'absolute',
    display: 'block',
    margin: 0,
    padding: 0,
    border: 0,
    background: 'transparent',
    cursor: 'pointer',
    color: customColors.text.secondary,
    '&:hover': { color: customColors.text.primary },
    '& svg': { display: 'block', width: '100%', height: '100%', fill: 'none' },
    '&:focus-visible': {
      outline: `2px solid ${customColors.text.dark}`,
      outlineOffset: '2px',
    },
    '&:focus:not(:focus-visible)': { outline: 'none' },
  },
  toggle: {
    desktop: {
      left: '192px',
      top: '19px',
      width: '20px',
      height: '20px',
      '&::after': { ...hitArea, inset: '-12px' },
    },
    tablet: {
      left: '190px',
      top: '24px',
      width: '24px',
      height: '24px',
      '&::after': { ...hitArea, inset: '-10px' },
    },
    drawer: {
      left: '185px',
      top: '12px',
      width: '24px',
      height: '24px',
      '&::after': { ...hitArea, inset: '-10px' },
    },
  },
  toggleDrawerCollapsed: { top: '18px' },
  toggleGlyph: {
    expanded: { transform: 'rotate(90deg)' },
    collapsed: { transform: 'rotate(-90deg)' },
  },
} as const;
