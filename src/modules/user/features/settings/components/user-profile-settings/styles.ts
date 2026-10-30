import { customColors, paletteColors } from '@/styles/colors';

import {
  SETTINGS_DESKTOP,
  SETTINGS_OUTLINED_PILL,
  SETTINGS_PILL_FROM_TABLET,
  SETTINGS_TABLET,
} from '../profile-form/styles';

const SKELETON_FIELD_ROW = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 0,
};

export default {
  card: {
    '--settings-card-inset-start': '1.0625rem',
    '--settings-card-inset-end': '1rem',
    marginInline: '-0.4375rem',
    padding: '1.4375rem var(--settings-card-inset-end) 0.9375rem var(--settings-card-inset-start)',
    backgroundColor: paletteColors.background.default,
    border: `1px solid ${paletteColors.background.subtle}`,
    borderRadius: '0.75rem',
    [SETTINGS_TABLET]: {
      '--settings-card-inset-start': '1.9375rem',
      '--settings-card-inset-end': '1.9375rem',
      marginInline: 0,
      paddingTop: '1.1875rem',
    },
    [SETTINGS_DESKTOP]: {
      '--settings-card-inset-end': '1.4375rem',
      paddingTop: '1.0625rem',
      paddingBottom: '1.1875rem',
    },
  },
  skeleton: {
    '@media (prefers-reduced-motion: reduce)': {
      '& *': { animation: 'none' },
    },
  },
  skeletonMonogram: {
    flexShrink: 0,
    width: '4rem',
    height: '4rem',
    [SETTINGS_TABLET]: { width: '6.1875rem', height: '6.1875rem' },
  },
  skeletonLines: { flex: 1 },
  skeletonGreeting: { width: '9.75rem', maxWidth: '100%', height: '1.125rem' },
  skeletonName: {
    width: '11.875rem',
    maxWidth: '100%',
    height: '1.375rem',
    [SETTINGS_TABLET]: { height: '1.625rem' },
  },
  skeletonTitle: {
    width: '8.75rem',
    height: '1.375rem',
    [SETTINGS_TABLET]: { width: '10.8125rem', height: '1.625rem' },
  },
  skeletonField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    marginBottom: '1rem',
    [SETTINGS_TABLET]: { ...SKELETON_FIELD_ROW, marginBottom: '0.8125rem' },
    [SETTINGS_DESKTOP]: { marginBottom: '0.75rem' },
  },
  skeletonLabel: {
    flexShrink: 0,
    width: '8.75rem',
    height: '1.125rem',
    [SETTINGS_TABLET]: { width: '8rem', height: '1.375rem', marginRight: '2.8125rem' },
    [SETTINGS_DESKTOP]: { width: '7.5rem', height: '1.125rem', marginRight: '2rem' },
  },
  skeletonInput: {
    height: '3rem',
    [SETTINGS_TABLET]: { flex: '1 1 0', minWidth: 0, height: '4.375rem' },
    [SETTINGS_DESKTOP]: { height: '4rem' },
  },
  skeletonActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    [SETTINGS_TABLET]: { flexDirection: 'row', gap: '0.5rem' },
  },
  skeletonPill: {
    width: '100%',
    height: '3.125rem',
    [SETTINGS_TABLET]: { flex: 1, height: '4.375rem' },
  },
  skeletonSave: { [SETTINGS_DESKTOP]: { flex: '0 0 16.875rem', height: '3.875rem' } },
  skeletonClear: { [SETTINGS_DESKTOP]: { flex: '0 0 11.25rem', height: '3.875rem' } },
  error: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '1rem',
    fontFamily: 'Golos',
  },
  errorMessage: {
    margin: 0,
    fontWeight: 600,
    fontSize: '1.125rem',
    lineHeight: 'normal',
    color: customColors.text.dark,
  },
  retryButton: {
    '&&': {
      ...SETTINGS_OUTLINED_PILL,
      width: '100%',
      height: '3.125rem',
      [SETTINGS_TABLET]: {
        ...SETTINGS_PILL_FROM_TABLET,
        width: 'auto',
        minWidth: '11.25rem',
        height: '4.375rem',
      },
      [SETTINGS_DESKTOP]: { height: '3.875rem' },
    },
  },
} as const;
