import loadIsolated from '@tests/unit/utils/isolated-module';

type PasswordPolicyRulesStylesModule =
  typeof import('@auth/components/form-section/components/password-policy-rules-styles');
type PasswordPolicyRulesStyles = PasswordPolicyRulesStylesModule['default'];

const loadStyles = (): Promise<PasswordPolicyRulesStyles> =>
  loadIsolated(
    async () =>
      (await import('@auth/components/form-section/components/password-policy-rules-styles'))
        .default
  );

const ITEM = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
  fontFamily: 'Inter',
  fontSize: '0.875rem',
  lineHeight: '1.125rem',
};

describe('password policy rules styles', () => {
  it('pins every evaluated token', async () => {
    const styles = await loadStyles();

    expect(styles).toEqual({
      list: {
        listStyle: 'none',
        margin: '-0.5rem 0 1rem',
        padding: 0,
        display: 'grid',
        gap: '0.25rem',
      },
      met: { ...ITEM, color: '#1A1C1E' },
      unmet: { ...ITEM, color: '#404142' },
      icon: { fontSize: '1rem', flexShrink: 0 },
      visuallyHidden: {
        position: 'absolute',
        width: '1px',
        height: '1px',
        margin: '-1px',
        padding: 0,
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        whiteSpace: 'nowrap',
        border: 0,
      },
    });
  });
});
