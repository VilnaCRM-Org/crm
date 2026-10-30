import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import Guide from '@/modules/user/features/settings/components/two-factor-settings/setup-guide';
import { buildOtpauthUri } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

function Wrapper({ children }: { children: ReactNode }): JSX.Element {
  return <I18nextProvider i18n={createSettingsLocaleI18n('uk', [])}>{children}</I18nextProvider>;
}

describe('SetupGuide', () => {
  it('lists the install and scan steps and gives the manual-key hint', () => {
    render(<Guide otpauthUri={buildOtpauthUri()} />, { wrapper: Wrapper });

    const steps = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(steps.map((step) => step.textContent)).toEqual([
      '1Завантажте й установіть застосунок автентифікації, наприклад Google Authenticator',
      '2Відскануйте QR-код у застосунку автентифікації',
    ]);
    expect(
      screen.getByText(
        'Якщо не вдається відсканувати QR-код, введіть цей ключ у застосунок вручну.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'QR-код для застосунку автентифікації' })
    ).toBeInTheDocument();
  });

  it('leaves the QR image out when there is no otpauth URI', () => {
    render(<Guide otpauthUri={null} />, { wrapper: Wrapper });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(2);
  });
});
