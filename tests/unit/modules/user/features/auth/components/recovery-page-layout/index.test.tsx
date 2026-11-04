import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import appI18n from '@/i18n';
import RecoveryPageLayout from '@auth/components/recovery-page-layout';
import createRecoveryLocaleI18n from '@tests/unit/utils/create-recovery-locale-i18n';

jest.mock('@/components/ui-back-to-main', () => ({
  __esModule: true,
  default: (): JSX.Element => <div>auth shell header</div>,
}));

jest.mock('@/components/ui-footer', () => ({
  __esModule: true,
  default: (): JSX.Element => <div>auth shell footer</div>,
}));

const i18n = createRecoveryLocaleI18n('uk', ['en']);

function Wrapper({ children }: { children: ReactNode }): JSX.Element {
  return (
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>{children}</MemoryRouter>
    </I18nextProvider>
  );
}

describe('RecoveryPageLayout', () => {
  it('renders its children inside the auth page shell and titles the document', () => {
    render(
      <RecoveryPageLayout titleKey="password_reset.title">
        <p>recovery step</p>
      </RecoveryPageLayout>,
      { wrapper: Wrapper }
    );

    expect(screen.getByRole('main')).toContainElement(screen.getByText('recovery step'));
    expect(screen.getByText('auth shell header')).toBeInTheDocument();
    expect(screen.getByText('auth shell footer')).toBeInTheDocument();
    expect(document.title).toBe('Створіть новий пароль - VilnaCRM');
  });

  it('follows the title key it is given', () => {
    render(
      <RecoveryPageLayout titleKey="password_recovery.title">
        <p>recovery step</p>
      </RecoveryPageLayout>,
      { wrapper: Wrapper }
    );

    expect(document.title).toBe('Забули пароль? - VilnaCRM');
  });

  it('registers the recovery catalog on the app i18n instance when its module loads', () => {
    expect(appI18n.getResource('uk', 'translation', 'password_recovery.title')).toBe(
      'Забули пароль?'
    );
    expect(appI18n.getResource('en', 'translation', 'password_reset.title')).toBe(
      'Create a new password'
    );
  });
});
