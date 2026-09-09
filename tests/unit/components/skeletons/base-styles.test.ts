import loadIsolated from '@tests/unit/utils/isolated-module';

type BaseSkeletonStyles = typeof import('@/components/skeletons/base/styles');

/**
 * Every token here is evaluated at module load, so it is loaded inside the test body rather than
 * imported at the top: a mutant in a top-level literal is otherwise credited to whichever
 * unrelated suite happened to import the module first, and comes back unscored.
 *
 * Style modules are design contracts, so the literal IS the test case — pinned values, not Faker.
 */
const loadBaseStyles = (): Promise<BaseSkeletonStyles> =>
  loadIsolated(() => import('@/components/skeletons/base/styles'));

describe('base skeleton style tokens', () => {
  it('pins the shimmer keyframes', async () => {
    const { shimmerAnimation } = await loadBaseStyles();

    expect(shimmerAnimation.styles).toContain('0% {\n    background-position: 0% 0;\n  }');
    expect(shimmerAnimation.styles).toContain('100% {\n    background-position: 100% 0;\n  }');
  });

  it('pins the shadow-pulse keyframes', async () => {
    const { shadowPulseAnimation } = await loadBaseStyles();

    expect(shadowPulseAnimation.styles).toContain(
      '0% {\n    box-shadow: 0px 7px 20px 0px rgba(211, 216, 224, 0.2);\n  }'
    );
    expect(shadowPulseAnimation.styles).toContain(
      '100% {\n    box-shadow: 0px 7px 60px 0px rgba(211, 216, 224, 0.8);\n  }'
    );
  });

  it('pins the shimmer gradient', async () => {
    const { shimmerGradient } = await loadBaseStyles();

    expect(shimmerGradient).toBe(
      'linear-gradient(\n' +
        '  90deg,\n' +
        '  rgba(211, 216, 224, 0) 0%,\n' +
        '  rgba(211, 216, 224, 0.6) 49.13%,\n' +
        '  rgba(211, 216, 224, 0) 100%\n' +
        ')'
    );
  });

  it('pins the small-mobile breakpoint and the exclusive bound derived from it', async () => {
    const { SMALL_MOBILE_BREAKPOINT, SMALL_MOBILE_BREAKPOINT_UPPER } = await loadBaseStyles();

    expect(SMALL_MOBILE_BREAKPOINT).toBe(375);
    expect(SMALL_MOBILE_BREAKPOINT_UPPER).toBe(376);
  });

  it('pins the skeleton border tokens', async () => {
    const { SKELETON_BORDER_COLOR, SKELETON_BORDER_RADIUS } = await loadBaseStyles();

    expect(SKELETON_BORDER_RADIUS).toBe('57px');
    expect(SKELETON_BORDER_COLOR).toBe('#E1E7EA');
  });

  it('pins every property of the shared base skeleton style', async () => {
    const { baseSkeletonStyle, shimmerAnimation, shimmerGradient } = await loadBaseStyles();

    expect(baseSkeletonStyle).toEqual({
      backgroundImage: shimmerGradient,
      backgroundSize: '200% 100%',
      animation: `${shimmerAnimation} 1.5s ease-in-out infinite alternate`,
    });
  });
});
