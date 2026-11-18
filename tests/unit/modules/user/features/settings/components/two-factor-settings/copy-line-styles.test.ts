import loadIsolated from '@tests/unit/utils/isolated-module';

const FADE_KEYFRAMES = [
  '_EMO_animation-1qa43bj_@keyframes animation-1qa43bj{',
  '  to {',
  '    opacity: 0;',
  '  }',
  '}_EMO_',
].join('\n');

const LINE = {
  margin: 0,
  fontFamily: 'Inter',
  fontWeight: 400,
  fontSize: '0.875rem',
  lineHeight: '1rem',
  color: '#404142',
  overflowWrap: 'anywhere',
};

describe('recovery-codes copy line styles', () => {
  it('holds for 3 s and fades over 0.4 s', async () => {
    const { default: timing } = await loadIsolated(
      () =>
        import('@/modules/user/features/settings/components/two-factor-settings/copy-line-timing')
    );

    expect(timing).toEqual({ holdMs: 3000, fadeMs: 400 });
  });

  it('pins a 16 px slot and the failure-line type for both lines', async () => {
    const { default: styles } = await loadIsolated(
      () =>
        import('@/modules/user/features/settings/components/two-factor-settings/copy-line-styles')
    );

    expect(styles).toEqual({
      slot: { minHeight: '1rem' },
      failedLine: LINE,
      copiedLine: {
        ...LINE,
        animation: `${FADE_KEYFRAMES} 400ms ease-out 3000ms forwards`,
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      },
    });
  });
});
