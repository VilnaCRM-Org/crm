import breakpointsTheme from '@/components/ui-breakpoints';
import styles from '@/modules/user/features/auth/components/form-section/auth-forms/registration-notification.styles';

describe('registration notification success button styles', () => {
  it('keeps success button text color white for visited links', () => {
    const successButton = styles.messageButton;

    expect(successButton.color).toBe('#FFFFFF');
    expect(successButton['&:visited, &:hover, &:active, &:focus-visible'].color).toBe('#FFFFFF');
    expect(successButton['&.MuiButton-contained']['&:hover, &:focus-visible'].color).toBe(
      '#FFFFFF'
    );
    expect(successButton['&.MuiButton-contained']['&:active'].color).toBe('#FFFFFF');
  });

  it('keeps error buttons at minimum touch-target size regardless of text length', () => {
    expect(styles.errorButton.minWidth).toBe('260px');
    expect(styles.errorButton.height).toBe('50px');
  });

  it('applies Golos font family to button text, title, and description', () => {
    expect(styles.messageButtonText.fontFamily).toBe('Golos, Golos Fallback');
    expect(styles.messageTitle.fontFamily).toBe('Golos, Golos Fallback');
    expect(styles.messageDescription.fontFamily).toBe('Golos, Golos Fallback');
  });

  it('uses theme breakpoints for error notification layout transitions', () => {
    const mdMinMedia = `@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`;
    const mdMaxMedia = `@media (max-width:${breakpointsTheme.breakpoints.values.md - 1}px)`;
    const xlPaddingMedia = '@media (min-width: 1131px)';

    type MediaStyles = Record<string, Record<string, string>>;

    expect((styles.imageWrapperError as unknown as MediaStyles)[mdMinMedia].marginBottom).toBe('0.75rem');
    expect((styles.messageContainerError as unknown as MediaStyles)[mdMaxMedia].padding).toBe('0rem 0.6rem');
    expect((styles.messageContainerError as unknown as MediaStyles)[xlPaddingMedia].padding).toBe('0rem 1.2rem');
    expect((styles.buttonsBox as unknown as MediaStyles)[mdMinMedia].marginTop).toBe('2rem');
    expect((styles.errorButton as unknown as MediaStyles)[mdMinMedia].height).toBe('70px');
  });
});
