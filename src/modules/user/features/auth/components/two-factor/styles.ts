import fieldStyles from '@/components/ui-form-field/styles';
import { customColors, paletteColors } from '@/styles/colors';

export default {
  toggleRow: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '1.25rem',
    fontFamily: 'Golos',
    fontSize: '1rem',
    lineHeight: '1.625rem',
  },
  toggle: {
    minHeight: '1.5rem',
    '&&:focus-visible': {
      outline: `2px solid ${paletteColors.primary.linkText}`,
      outlineOffset: '2px',
    },
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
