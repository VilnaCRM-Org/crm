import { customColors, paletteColors } from '@/styles/colors';

import { SETTINGS_DESKTOP, SETTINGS_TABLET } from '../profile-form/styles';

const VISUALLY_HIDDEN = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export default {
  card: {
    marginInline: '-0.4375rem',
    padding: '0.9375rem 1rem 0.9375rem 1.0625rem',
    backgroundColor: paletteColors.background.default,
    border: `1px solid ${paletteColors.background.subtle}`,
    borderRadius: '0.75rem',
    [SETTINGS_TABLET]: {
      marginInline: 0,
      padding: '1.1875rem 1.9375rem',
    },
    [SETTINGS_DESKTOP]: {
      padding: '1.4375rem 1.9375rem 2.625rem 1.875rem',
    },
  },
  heading: {
    margin: '0 0 1rem',
    fontFamily: 'Golos',
    fontWeight: 600,
    fontSize: '1.125rem',
    lineHeight: '1.375rem',
    color: customColors.text.dark,
    [SETTINGS_TABLET]: {
      marginBottom: '1.25rem',
      fontWeight: 700,
      fontSize: '1.375rem',
      lineHeight: '1.625rem',
    },
    [SETTINGS_DESKTOP]: { marginLeft: '0.0625rem' },
  },
  list: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gridTemplateRows: 'repeat(2, auto)',
    gridAutoFlow: 'column',
    columnGap: '0.5625rem',
    rowGap: '0.5rem',
    margin: 0,
    padding: 0,
    listStyle: 'none',
    [SETTINGS_TABLET]: {
      gridAutoFlow: 'row',
      columnGap: '0.75rem',
      rowGap: '0.8125rem',
    },
    [SETTINGS_DESKTOP]: { columnGap: '0.25rem', rowGap: '0.5rem' },
  },
  tile: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5625rem',
    boxSizing: 'border-box',
    height: '3.625rem',
    backgroundColor: paletteColors.background.default,
    border: `1px solid ${paletteColors.background.subtle}`,
    borderRadius: '0.75rem',
    [SETTINGS_DESKTOP]: { borderWidth: '2px' },
  },
  icon: { width: '1.375rem', height: '1.375rem' },
  label: {
    ...VISUALLY_HIDDEN,
    fontFamily: 'Golos',
    fontWeight: 600,
    fontSize: '1.125rem',
    lineHeight: 'normal',
    color: customColors.text.dark,
    [SETTINGS_TABLET]: {
      position: 'static',
      width: 'auto',
      height: 'auto',
      margin: 0,
      overflow: 'visible',
      clip: 'auto',
    },
  },
  status: VISUALLY_HIDDEN,
};
