import { fieldGapMargins } from '../styles';

export default {
  formFieldWrapper: {
    '&:nth-of-type(-n+2):not(:last-of-type)': {
      ...fieldGapMargins,
    },
  },
};
