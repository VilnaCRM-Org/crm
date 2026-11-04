import { customColors, paletteColors } from '@/styles/colors';

import { SETTINGS_DESKTOP, SETTINGS_FOCUS_RING, SETTINGS_TABLET } from '../profile-form/styles';

const ROW_FROM_TABLET = { gap: '1.25rem', marginInline: '-1.9375rem', paddingInline: '1.9375rem' };

const ROW = {
  display: 'flex',
  gap: '0.75rem',
  marginInline: '-1.0625rem -1rem',
  paddingInline: '1.0625rem 1rem',
  [SETTINGS_TABLET]: ROW_FROM_TABLET,
};

export default {
  divided: {
    ...ROW,
    alignItems: 'center',
    marginBottom: '1.4375rem',
    [SETTINGS_TABLET]: { ...ROW_FROM_TABLET, marginBottom: '2.75rem' },
    [SETTINGS_DESKTOP]: {
      marginBottom: '1.25rem',
      paddingBottom: '1.8125rem',
      borderBottom: `1px solid ${paletteColors.background.subtle}`,
    },
  },
  plain: { ...ROW, alignItems: 'flex-start' },
  logo: {
    flexShrink: 0,
    width: '2.5rem',
    height: '2.5rem',
    [SETTINGS_TABLET]: { width: '4.5625rem', height: '4.5625rem' },
  },
  text: { display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 },
  title: {
    margin: 0,
    fontFamily: 'Golos',
    fontWeight: 600,
    fontSize: '1.125rem',
    lineHeight: '1.375rem',
    color: customColors.text.dark,
    outline: 'none',
    '&:focus-visible': SETTINGS_FOCUS_RING,
    [SETTINGS_TABLET]: { fontWeight: 700, fontSize: '1.75rem', lineHeight: '2.125rem' },
    [SETTINGS_DESKTOP]: { fontSize: '1.375rem', lineHeight: '1.625rem' },
  },
  subtitle: {
    margin: 0,
    maxWidth: '19.8125rem',
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: '0.875rem',
    lineHeight: '1rem',
    color: customColors.text.primary,
    [SETTINGS_TABLET]: { fontSize: '1rem', lineHeight: '1.125rem' },
    [SETTINGS_DESKTOP]: { fontSize: '0.875rem', lineHeight: '1rem' },
  },
} as const;
