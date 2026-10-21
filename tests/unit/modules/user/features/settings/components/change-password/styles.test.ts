import loadIsolated from '@tests/unit/utils/isolated-module';

type PasswordStylesModule =
  typeof import('@/modules/user/features/settings/components/change-password/styles');

const loadModule = (): Promise<PasswordStylesModule> =>
  loadIsolated(
    async () => await import('@/modules/user/features/settings/components/change-password/styles')
  );

const VISUALLY_HIDDEN = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

describe('change password styles', () => {
  it('hides the hint, and the rules while the empty new password has no focus', async () => {
    const styles = await loadModule();

    expect(styles.NEW_PASSWORD_HINT_ID).toBe('new-password-hint');
    expect(styles.NEW_PASSWORD_RULES_ID).toBe('new-password-rules');
    expect(styles.default).toEqual({
      hint: VISUALLY_HIDDEN,
      newPassword: {
        position: 'relative',
        '&[data-empty="true"]:not(:focus-within) #new-password-rules': VISUALLY_HIDDEN,
      },
    });
  });
});
