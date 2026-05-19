import {
  fieldGapMargins as sharedFieldGapMargins,
  formSection as sharedFormSection,
  formWrapper as sharedFormWrapper,
} from '@/components/skeletons/base/auth-form-shared-styles';
import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors, paletteColors } from '@/styles/colors';

// Re-exported for existing consumers (form-section/components/styles.ts).
export const fieldGapMargins = sharedFieldGapMargins;

export default {
  formSection: sharedFormSection,
  formWrapper: sharedFormWrapper,
  formSwitcherButton: {
    display: 'block',
    padding: 0,
    margin: '1.4375rem auto 0',

    fontFamily: 'Golos',
    fontWeight: 500,
    fontSize: '0.9375rem',
    fontStyle: 'normal',
    lineHeight: 1.2,
    letterSpacing: 0,
    color: customColors.text.secondary,
    textTransform: 'none',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      margin: '2.75rem auto 0',

      fontSize: '1.125rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      margin: '1.5rem auto 0',

      fontWeight: 500,
      fontSize: '0.9375rem',
      lineHeight: 1.2,
    },
  },
  formSwitcherError: {
    marginTop: '1rem',
    minHeight: '1.25rem',

    fontFamily: 'Golos',
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.43,
    color: paletteColors.error.main,
    textAlign: 'center',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginTop: '1.25rem',
    },
  },
};
