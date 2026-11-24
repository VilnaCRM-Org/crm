import { paletteColors } from '@/styles/colors';

const forcedColors = { '@media (forced-colors: active)': { color: 'CanvasText' } };

export default {
  success: { color: paletteColors.success.text, ...forcedColors },
  error: { color: paletteColors.error.main, ...forcedColors },
  close: {},
} as const;
