import type { NavigationRowId, RailShape } from '@/components/types/ui-navigation-list';
import { customColors, paletteColors } from '@/styles/colors';

import { control } from './styles';

const FONT = 'Inter, sans-serif';

const pill = {
  ...control,
  width: '56px',
  height: '40px',
  margin: '7px 8px',
  padding: '8px 16px',
  borderRadius: '8px',
  '&:hover': {
    backgroundColor: paletteColors.background.paper,
    '& svg': { color: customColors.text.dark },
  },
};

const tabletPill = { ...pill, width: '60px', height: '44px' };

const tabletShapes: Partial<Record<NavigationRowId, RailShape>> = {
  signOut: 'action',
  products: 'tabletProducts',
  integrations: 'tabletCompact',
  webhooks: 'tabletCompact',
  billing: 'tabletCompact',
};

const itemBase = { position: 'relative', display: 'flex' };

export default {
  rail: {
    desktop: pill,
    tablet: { ...tabletPill, margin: '11px 8px' },
    tabletProducts: { ...tabletPill, margin: '12px 8px 11px' },
    tabletCompact: { ...pill, margin: '13px 8px' },
    action: pill,
  },
  railIcon: {
    desktop: { width: '24px', height: '24px' },
    tablet: { width: '28px', height: '28px' },
    tabletProducts: { width: '28px', height: '28px' },
    tabletCompact: { width: '24px', height: '24px' },
    action: { width: '24px', height: '24px' },
  },
  railItem: {
    desktop: { ...itemBase, height: '54px' },
    tablet: { ...itemBase, height: '66px' },
    tabletProducts: { ...itemBase, height: '67px' },
    tabletCompact: { ...itemBase, height: '66px' },
    action: { ...itemBase, height: '54px' },
  },
  tabletShapes,
  tooltip: {
    desktop: { left: '61px', top: '4px' },
    tablet: { left: '65px', top: '8px' },
    tabletProducts: { left: '65px', top: '9px' },
    tabletCompact: { left: '65px', top: '10px' },
    action: { left: '65px', top: '4px' },
  },
  tooltipBase: {
    position: 'absolute',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    filter: `drop-shadow(${customColors.shell.tooltipShadow})`,
  },
  tooltipCaret: {
    flexShrink: 0,
    width: '6px',
    height: '20.785px',
    backgroundColor: paletteColors.background.subtle,
    clipPath: 'polygon(100% 0, 0 50%, 100% 100%)',
  },
  tooltipBody: {
    boxSizing: 'border-box',
    padding: '12px 16px',
    borderRadius: '8px',
    backgroundColor: paletteColors.background.default,
    boxShadow: `inset 0 0 0 1px ${paletteColors.background.subtle}`,
    fontFamily: FONT,
    fontWeight: 500,
    fontSize: '16px',
    lineHeight: '18px',
    whiteSpace: 'nowrap',
    color: customColors.shell.tooltipText,
  },
} as const;
