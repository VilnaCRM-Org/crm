import {
  formSection as sharedFormSection,
  formWrapper as sharedFormWrapper,
} from '@/components/skeletons/base/auth-form-shared-styles';
import loadIsolated from '@tests/unit/utils/isolated-module';

type FormSectionStyles = (typeof import('@auth/components/form-section/styles'))['default'];

const loadStyles = (): Promise<FormSectionStyles> =>
  loadIsolated(async () => (await import('@auth/components/form-section/styles')).default);

describe('form section styles', () => {
  it('delegates the section and wrapper slots to the shared auth form styles', async () => {
    const styles = await loadStyles();

    expect(styles.formSection).toEqual(sharedFormSection);
    expect(styles.formWrapper).toEqual(sharedFormWrapper);
  });

  it('pins every formSwitcherButton token', async () => {
    const styles = await loadStyles();

    expect(styles.formSwitcherButton).toEqual({
      display: 'block',
      padding: 0,
      margin: '1.4375rem auto 0',
      fontFamily: 'Golos',
      fontWeight: 500,
      fontSize: '0.9375rem',
      fontStyle: 'normal',
      lineHeight: 1.2,
      letterSpacing: 0,
      color: '#969B9D',
      textTransform: 'none',
      '@media (min-width:1024px)': {
        margin: '2.75rem auto 0',
        fontSize: '1.125rem',
      },
      '@media (min-width:1440px)': {
        margin: '1.5rem auto 0',
        fontWeight: 500,
        fontSize: '0.9375rem',
        lineHeight: 1.2,
      },
    });
  });

  it('exposes exactly the three documented style slots', async () => {
    const styles = await loadStyles();

    expect(Object.keys(styles).sort()).toEqual([
      'formSection',
      'formSwitcherButton',
      'formWrapper',
    ]);
  });
});
