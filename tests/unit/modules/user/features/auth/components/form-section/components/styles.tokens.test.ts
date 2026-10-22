import { fieldGapMargins } from '@/components/skeletons/base/auth-form-shared-styles';
import loadIsolated from '@tests/unit/utils/isolated-module';

type ComponentStyles =
  (typeof import('@auth/components/form-section/components/styles'))['default'];

const loadStyles = (): Promise<ComponentStyles> =>
  loadIsolated(
    async () => (await import('@auth/components/form-section/components/styles')).default
  );

describe('form section component styles', () => {
  it('applies the shared field gap to the first two fields, never to the last one', async () => {
    const styles = await loadStyles();

    expect(styles.formFieldWrapper).toEqual({
      '&:nth-of-type(-n+2):not(:last-of-type)': { ...fieldGapMargins },
    });
  });

  it('exposes exactly the one documented style slot', async () => {
    const styles = await loadStyles();

    expect(Object.keys(styles)).toEqual(['formFieldWrapper']);
  });
});
