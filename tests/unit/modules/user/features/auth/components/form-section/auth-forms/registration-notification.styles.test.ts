import styles from '@/modules/user/features/auth/components/form-section/auth-forms/registration-notification.styles';

describe('registration notification success button styles', () => {
  it('keeps success button text color white for visited links', () => {
    const successButton = styles.messageButton;

    expect(successButton.color).toBe('#FFFFFF');
    expect(successButton['&:visited, &:hover, &:active, &:focus-visible'].color).toBe('#FFFFFF');
    expect(
      successButton[
        '&.MuiButton-contained:visited, &.MuiButton-contained:hover, &.MuiButton-contained:active, &.MuiButton-contained:focus-visible'
      ].color
    ).toBe('#FFFFFF');
  });

  it('keeps error notification actions full-width regardless of text length', () => {
    expect(styles.messageContainerError.width).toBe('100%');
    expect(styles.buttonsBox.width).toBe('100%');
  });
});
