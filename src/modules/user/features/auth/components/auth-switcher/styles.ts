import { customColors } from '@/styles/colors';
import formSectionStyles from '@auth/components/form-section/styles';

export default {
  switcher: {
    ...formSectionStyles.formSwitcherButton,
    '&:link, &:visited': {
      color: customColors.text.secondary,
    },
    '&:focus-visible': {
      outline: `2px solid ${customColors.text.primary}`,
      outlineOffset: '2px',
    },
  },
};
