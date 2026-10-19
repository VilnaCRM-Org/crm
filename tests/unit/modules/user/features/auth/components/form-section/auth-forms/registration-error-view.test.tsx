import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RegErrorView from '@auth/components/form-section/auth-forms/registration-error-view';

jest.mock('@/assets/notification/error.svg', () => ({ ReactComponent: 'svg' }));

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

const ERROR_TEXT = 'Registration failed';
const SUBMITTING = 'Submitting…';
const BACK_LABEL = 'notifications.error.button';
const RETRY_LABEL = 'notifications.error.retry_button';

interface Overrides {
  isClosing?: boolean;
  isSubmitting?: boolean;
}

function renderErrorView(overrides: Overrides = {}): { onRetry: jest.Mock; onBack: jest.Mock } {
  const onRetry = jest.fn();
  const onBack = jest.fn();
  render(
    <RegErrorView
      resolvedErrorText={ERROR_TEXT}
      submittingMessage={SUBMITTING}
      isSubmitting={overrides.isSubmitting ?? false}
      isClosing={overrides.isClosing ?? false}
      onRetry={onRetry}
      onBack={onBack}
    />
  );
  return { onRetry, onBack };
}

describe('RegistrationErrorView', () => {
  it('labels the error illustration with its own translation key', () => {
    renderErrorView();

    expect(
      screen.getByRole('img', { name: 'notifications.error.images.error' })
    ).toBeInTheDocument();
  });

  it('focuses the heading itself, out of the tab order', () => {
    renderErrorView();

    const heading = screen.getByRole('heading', { level: 2, name: 'notifications.error.title' });
    expect(heading).toHaveFocus();
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('alert')).not.toContainElement(heading);
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

  it('fills the alert with the resolved error text after mount', async () => {
    renderErrorView();

    expect(await screen.findByRole('alert')).toHaveTextContent(ERROR_TEXT);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('keeps both buttons focusable while a retry runs and ignores busy clicks', async () => {
    const { onRetry, onBack } = renderErrorView({ isSubmitting: true });
    const retry = screen.getByRole('button', { name: RETRY_LABEL });
    const back = screen.getByRole('button', { name: BACK_LABEL });

    expect(retry).toHaveAttribute('aria-disabled', 'true');
    expect(retry).toBeEnabled();
    expect(back).not.toHaveAttribute('aria-disabled');

    await userEvent.click(retry);
    await userEvent.click(back);

    expect(onRetry).not.toHaveBeenCalled();
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('announces the running retry and blanks the alert until it settles', () => {
    renderErrorView({ isSubmitting: true });

    expect(screen.getByRole('status')).toHaveTextContent(SUBMITTING);
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
  });

  it('marks both buttons busy while the card closes', async () => {
    const { onRetry, onBack } = renderErrorView({ isClosing: true });

    for (const name of [RETRY_LABEL, BACK_LABEL]) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'true');
    }
    await userEvent.click(screen.getByRole('button', { name: BACK_LABEL }));

    expect(onBack).not.toHaveBeenCalled();
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('calls retry and back when idle', async () => {
    const { onRetry, onBack } = renderErrorView();

    await userEvent.click(screen.getByRole('button', { name: RETRY_LABEL }));
    await userEvent.click(screen.getByRole('button', { name: BACK_LABEL }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
