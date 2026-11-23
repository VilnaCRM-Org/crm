import setupStepsStyles from './setup-steps-styles';

export default {
  slot: { minHeight: '1rem' },
  failedLine: { ...setupStepsStyles.copyFailed, margin: 0, overflowWrap: 'anywhere' },
  label: { display: 'inline-grid' },
  text: {
    shown: { gridArea: '1/1', visibility: 'visible' },
    hidden: { gridArea: '1/1', visibility: 'hidden' },
  },
} as const;
