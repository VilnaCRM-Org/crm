import { customColors } from '@/styles/colors';

import edgeButtonStyles from './edge-button-styles';

export default {
  burger: { ...edgeButtonStyles.target, color: customColors.text.muted },
  glyph: { display: 'block', width: '24px', height: '24px' },
} as const;
