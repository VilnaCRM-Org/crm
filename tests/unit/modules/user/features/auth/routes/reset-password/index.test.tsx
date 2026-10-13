import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import appI18n from '@/i18n';
import ResetPassword from '@auth/routes/reset-password';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';

jest.mock('@auth/routes/reset-password/form-section-loader', () => ({
  __esModule: true,
  default: {
    load: async (): Promise<{ default: () => JSX.Element }> => ({
      default: (): JSX.Element => <p>request section</p>,
    }),
  },
}));

jest.mock('@/components/ui-back-to-main', () => ({
  __esModule: true,
  default: (): JSX.Element => <div>auth shell header</div>,
}));

jest.mock('@/components/ui-footer', () => ({
  __esModule: true,
  default: (): JSX.Element => <div>auth shell footer</div>,
}));

const i18n = createLocaleI18n('uk', ['en']);

function Wrapper({ children }: { children: ReactNode }): JSX.Element {
  return (
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>{children}</MemoryRouter>
    </I18nextProvider>
  );
}

describe('ResetPassword page', () => {
  it('renders the lazy section and sets the document title', async () => {
    render(<ResetPassword />, { wrapper: Wrapper });

    expect(await screen.findByText('request section')).toBeInTheDocument();
    expect(document.title).toBe('Забули пароль? - VilnaCRM');
  });

  it('registers the recovery catalog on the app i18n instance when the route module loads', () => {
    expect(appI18n.getResource('uk', 'translation', 'password_recovery.title')).toBe(
      'Забули пароль?'
    );
    expect(appI18n.getResource('en', 'translation', 'password_recovery.title')).toBe(
      'Forgot your password?'
    );
  });
});
