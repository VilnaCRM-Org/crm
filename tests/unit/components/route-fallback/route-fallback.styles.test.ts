import loadIsolated from '@tests/unit/utils/isolated-module';

const SPIN_KEYFRAMES = [
  '_EMO_animation-1xwdn1n_@keyframes animation-1xwdn1n{',
  '  to {',
  '    transform: rotate(360deg);',
  '  }',
  '}_EMO_',
].join('\n');

/**
 * Style modules are design contracts: the literal IS the test case, so these are pinned values
 * rather than Faker data. Loading the module inside the test keeps its literals under this
 * assertion instead of crediting them to whichever suite happened to import it first.
 */
describe('route-fallback styles', () => {
  it('pins every styles token', async () => {
    const { default: styles } = await loadIsolated(
      () => import('@/components/route-fallback/styles')
    );

    expect(styles).toEqual({
      wrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      pill: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E1E7EA',
        borderRadius: '57px',
        padding: '20px 32px',
      },
      spinner: {
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: '3px solid rgba(255, 255, 255, 0.35)',
        borderTopColor: '#FFFFFF',
        animation: `${SPIN_KEYFRAMES} 0.9s linear infinite`,
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'none',
        },
      },
    });
  });
});
