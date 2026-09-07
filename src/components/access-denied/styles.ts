import { paletteColors } from '@/styles/colors';

export default {
  outline: 'none',
  '&:focus-visible': {
    outline: `2px solid ${paletteColors.primary.main}`,
    outlineOffset: '2px',
  },
};
