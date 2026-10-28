import breakpointsTheme from '@/components/ui-breakpoints';
import fieldStyles from '@/components/ui-form-field/styles';
import { customColors, paletteColors } from '@/styles/colors';

export default {
  note: {
    fontFamily: 'Golos',
    fontWeight: 400,
    fontSize: '0.875rem',
    lineHeight: '1.375rem',
    letterSpacing: 0,
    color: customColors.text.muted,
    margin: '0 0 1rem',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginBottom: '1.25rem',
    },
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '1.25rem',
    fontFamily: 'Golos',
    fontSize: '0.9375rem',
    lineHeight: '1.125rem',
  },
  recoveryField: {
    flexDirection: 'column',
    marginBottom: '1rem',
  },
  recoveryLabel: fieldStyles.formFieldLabel,
  recoveryInput: {
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: paletteColors.border.strong,
    },
    '& .MuiFormHelperText-root': {
      marginLeft: 0,
      color: customColors.text.muted,
    },
    '& .Mui-error ~ .MuiFormHelperText-root, & .MuiFormHelperText-root.Mui-error': {
      color: paletteColors.error.text,
    },
  },
} as const;
