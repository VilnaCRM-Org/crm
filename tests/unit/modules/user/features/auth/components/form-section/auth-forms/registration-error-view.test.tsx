import { render, screen } from '@testing-library/react';

import RegErrorView from '@auth/components/form-section/auth-forms/registration-error-view';

jest.mock('@/assets/notification/error.svg', () => ({ ReactComponent: 'svg' }));

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

const ERROR_TEXT = 'Registration failed';
const BACK_LABEL = 'notifications.error.button';
const RETRY_LABEL = 'notifications.error.retry_button';

function renderErrorView(overrides: { isClosing?: boolean; isSubmitting?: boolean } = {}): void {
  render(
    <RegErrorView
      resolvedErrorText={ERROR_TEXT}
      isSubmitting={overrides.isSubmitting ?? false}
      isClosing={overrides.isClosing ?? false}
      onRetry={jest.fn()}
      onBack={jest.fn()}
    />
  );
}

function focusTargets(): HTMLElement[] {
  return screen.getAllByRole('generic').filter((element) => element.hasAttribute('tabindex'));
}

describe('RegistrationErrorView', () => {
  it('labels the error illustration with its own translation key', () => {
    renderErrorView();

    expect(
      screen.getByRole('img', { name: 'notifications.error.images.error' })
    ).toBeInTheDocument();
  });

  it('exposes exactly one programmatic focus target that is out of the tab order', () => {
    renderErrorView();

    const targets = focusTargets();

    expect(targets).toHaveLength(1);
    expect(targets[0]).toHaveAttribute('tabindex', '-1');
    expect(targets[0]).toHaveFocus();
  });

  it('centres the focused message container as a column', () => {
    renderErrorView();

    expect(focusTargets()[0]).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
      textAlign: 'center',
    });
  });

  it('separates the secondary back button from the retry button with a top margin', () => {
    renderErrorView();

    expect(screen.getByRole('button', { name: BACK_LABEL })).toHaveStyle({
      marginTop: '0.5rem',
    });
    expect(screen.getByRole('button', { name: RETRY_LABEL })).not.toHaveStyle({
      marginTop: '0.5rem',
    });
  });

  it('keeps the back button reachable while a retry is in flight', () => {
    renderErrorView({ isSubmitting: true });

    expect(screen.getByRole('button', { name: RETRY_LABEL })).toBeDisabled();
    expect(screen.getByRole('button', { name: BACK_LABEL })).toBeEnabled();
  });

  it('shows the resolved error text as the alert body', () => {
    renderErrorView();

    expect(screen.getByRole('alert')).toHaveTextContent(ERROR_TEXT);
  });
});
