import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { fireEvent, render, screen, within, act } from '@testing-library/react';
import React from 'react';

import RegistrationNotification from '@/modules/user/features/auth/components/form-section/auth-forms/registration-notification';

const createSvg = (props: React.SVGProps<SVGSVGElement>): JSX.Element =>
  React.createElement('svg', props);

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

jest.mock('@/assets/notification/confetti.svg', () => ({
  ReactComponent: (): JSX.Element => createSvg({ 'aria-hidden': true }),
}));

jest.mock('@/assets/notification/error.svg', () => ({
  ReactComponent: (): JSX.Element =>
    createSvg({ role: 'img', 'aria-label': 'notifications.error.icon' }),
}));

jest.mock('@/assets/notification/settings.svg', () => ({
  ReactComponent: (): JSX.Element => createSvg({ 'aria-hidden': true }),
}));

const theme = createTheme();

describe('RegistrationNotification Integration', () => {
  it('renders success view with real MUI components inside ThemeProvider', () => {
    render(
      <ThemeProvider theme={theme}>
        <RegistrationNotification view="success" isSubmitting={false} onBack={jest.fn()} />
      </ThemeProvider>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('notifications.success.title')).toBeInTheDocument();
    expect(screen.getByText('notifications.success.description')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'notifications.success.button' })
    ).toBeInTheDocument();
  });

  it('renders error view with real MUI components inside ThemeProvider', () => {
    render(
      <ThemeProvider theme={theme}>
        <RegistrationNotification
          view="error"
          isSubmitting={false}
          onBack={jest.fn()}
          onRetry={jest.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'notifications.error.retry_button' })
    ).toBeEnabled();
    expect(screen.getByRole('button', { name: 'notifications.error.button' })).toBeEnabled();
  });

  it('renders CircularProgress in error view when isSubmitting is true', () => {
    render(
      <ThemeProvider theme={theme}>
        <RegistrationNotification
          view="error"
          isSubmitting
          onBack={jest.fn()}
          onRetry={jest.fn()}
        />
      </ThemeProvider>
    );

    const errorNotification = screen.getByRole('alert');
    expect(within(errorNotification).getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'notifications.error.retry_button' })).toBeDisabled();
  });

  it('calls onBack after animation delay when back button is clicked', () => {
    jest.useFakeTimers();
    const onBack = jest.fn();

    render(
      <ThemeProvider theme={theme}>
        <RegistrationNotification
          view="success"
          isSubmitting={false}
          onBack={onBack}
        />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'notifications.success.button' }));
    expect(onBack).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(onBack).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('displays errorText prop over the default fallback message', () => {
    const customError = 'Email already registered';

    render(
      <ThemeProvider theme={theme}>
        <RegistrationNotification
          view="error"
          isSubmitting={false}
          errorText={customError}
          onBack={jest.fn()}
          onRetry={jest.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByText(customError)).toBeInTheDocument();
    expect(
      screen.queryByText('failure_responses.client_errors.something_went_wrong')
    ).not.toBeInTheDocument();
  });
});
