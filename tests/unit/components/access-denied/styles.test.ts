import { paletteColors } from '@/styles/colors';
import loadIsolated from '@tests/unit/utils/isolated-module';

type AccessDeniedStyles = typeof import('@/components/access-denied/styles');

/**
 * The token is a top-level literal evaluated at module load, so it is loaded inside the test body
 * rather than imported at the top: a mutant in such a literal is otherwise credited to whichever
 * unrelated suite imported the module first and comes back unscored.
 */
const loadStyles = (): Promise<AccessDeniedStyles> =>
  loadIsolated(() => import('@/components/access-denied/styles'));

describe('access denied style tokens', () => {
  it('pins the heading focus token in both states', async () => {
    const { default: headingFocusStyles } = await loadStyles();

    expect(headingFocusStyles).toEqual({
      outline: 'none',
      '&:focus-visible': {
        outline: `2px solid ${paletteColors.primary.main}`,
        outlineOffset: '2px',
      },
    });
  });
});
