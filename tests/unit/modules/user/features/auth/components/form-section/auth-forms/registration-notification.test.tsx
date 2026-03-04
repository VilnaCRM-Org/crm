import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';

import RegistrationNotification from '@/modules/user/features/auth/components/form-section/auth-forms/registration-notification';

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

jest.mock('@/components/ui-typography', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }): JSX.Element => <span>{children}</span>,
}));

jest.mock('@/assets/notification/confetti.svg', () => ({
  ReactComponent: (): JSX.Element => <svg aria-hidden="true" />,
}));

jest.mock('@/assets/notification/error.svg', () => ({
  ReactComponent: ({
    role,
    'aria-label': ariaLabel,
  }: React.SVGProps<SVGSVGElement>): JSX.Element => <svg role={role} aria-label={ariaLabel} />,
}));

jest.mock('@/assets/notification/settings.svg', () => ({
  ReactComponent: (): JSX.Element => <svg aria-hidden="true" />,
}));

describe('RegistrationNotification', () => {
  it('disables retry button while retry request is in flight', () => {
    render(
      <RegistrationNotification
        view="error"
        isSubmitting
        errorText="request failed"
        onBack={jest.fn()}
        onRetry={jest.fn()}
      />
    );

    const retryButton = screen.getByRole('button', { name: 'notifications.error.retry_button' });
    expect(retryButton).toBeDisabled();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows fallback error text and keeps retry action enabled when not submitting', () => {
    jest.useFakeTimers();
    const onBack = jest.fn();
    const onRetry = jest.fn();

    render(
      <RegistrationNotification
        view="error"
        isSubmitting={false}
        onBack={onBack}
        onRetry={onRetry}
      />
    );

    const retryButton = screen.getByRole('button', { name: 'notifications.error.retry_button' });
    const backButton = screen.getByRole('button', { name: 'notifications.error.button' });

    expect(retryButton).toBeEnabled();
    expect(within(retryButton).queryByRole('progressbar')).not.toBeInTheDocument();
    expect(
      screen.getByText('failure_responses.client_errors.something_went_wrong')
    ).toBeInTheDocument();

    fireEvent.click(retryButton);
    fireEvent.click(backButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onBack).not.toHaveBeenCalled();
    jest.advanceTimersByTime(300);
    expect(onBack).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('renders success state content with a back button', () => {
    render(<RegistrationNotification view="success" isSubmitting={false} onBack={jest.fn()} />);

    expect(screen.getByText('notifications.success.title')).toBeInTheDocument();
    expect(screen.getByText('notifications.success.description')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'notifications.success.button' })
    ).toBeInTheDocument();
  });

  it('announces error notification politely to screen readers', () => {
    render(
      <RegistrationNotification
        view="error"
        isSubmitting={false}
        onBack={jest.fn()}
        onRetry={jest.fn()}
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('announces success notification politely to screen readers', () => {
    render(<RegistrationNotification view="success" isSubmitting={false} onBack={jest.fn()} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('displays custom errorText instead of the default fallback', () => {
    const customError = 'Email already in use';

    render(
      <RegistrationNotification
        view="error"
        isSubmitting={false}
        errorText={customError}
        onBack={jest.fn()}
        onRetry={jest.fn()}
      />
    );

    expect(screen.getByText(customError)).toBeInTheDocument();
    expect(
      screen.queryByText('failure_responses.client_errors.something_went_wrong')
    ).not.toBeInTheDocument();
  });

  it('keeps the back-to-form button enabled while retry is in flight', () => {
    render(
      <RegistrationNotification
        view="error"
        isSubmitting
        onBack={jest.fn()}
        onRetry={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'notifications.error.retry_button' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'notifications.error.button' })).toBeEnabled();
  });

  it('error image has an accessible label', () => {
    render(
      <RegistrationNotification
        view="error"
        isSubmitting={false}
        onBack={jest.fn()}
        onRetry={jest.fn()}
      />
    );

    expect(screen.getByRole('img', { name: 'notifications.error.images.error' })).toBeInTheDocument();
  });
});
