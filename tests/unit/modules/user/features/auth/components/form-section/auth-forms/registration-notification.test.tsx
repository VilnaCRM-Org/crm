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
  ReactComponent: (): JSX.Element => <svg aria-hidden="true" />,
}));

jest.mock('@/assets/notification/settings.svg', () => ({
  ReactComponent: (): JSX.Element => <svg aria-hidden="true" />,
}));

describe('RegistrationNotification', () => {
  it('shows loading indicator on retry button while retry request is in flight', () => {
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
    const errorNotification = screen.getByRole('alert');

    expect(retryButton).toBeDisabled();

    const progress = within(errorNotification).getByRole('progressbar');
    expect(progress).toBeInTheDocument();
    expect(progress).toHaveClass('MuiCircularProgress-colorPrimary');
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
    jest.advanceTimersByTime(260);
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
});
