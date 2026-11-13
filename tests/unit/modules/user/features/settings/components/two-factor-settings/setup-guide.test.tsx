import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import Guide from '@/modules/user/features/settings/components/two-factor-settings/setup-guide';
import { buildOtpauthUri, buildTotpSecret } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import { assertInstanceOf } from '@tests/utils/assert-result';

function Wrapper({ children }: { children: ReactNode }): JSX.Element {
  return <I18nextProvider i18n={createSettingsLocaleI18n('uk', [])}>{children}</I18nextProvider>;
}

const stepsOf = (): HTMLElement[] => within(screen.getByRole('list')).getAllByRole('listitem');

describe('SetupGuide', () => {
  it('lists the three steps in order', () => {
    render(<Guide otpauthUri={buildOtpauthUri()} secret={buildTotpSecret()} />, {
      wrapper: Wrapper,
    });

    const steps = stepsOf();
    expect(steps).toHaveLength(3);
    expect(steps[0]).toHaveTextContent('Завантажте й установіть застосунок Google Authenticator');
    expect(steps[1]).toHaveTextContent('Відскануйте QR-код у застосунку Authenticator');
    expect(steps[2]).toHaveTextContent('Збережіть резервний ключ у надійному місці');
  });

  it('keeps the QR image, the key and the manual hint inside the scan step', () => {
    render(<Guide otpauthUri={buildOtpauthUri()} secret={buildTotpSecret()} />, {
      wrapper: Wrapper,
    });

    const scan = within(stepsOf()[1] as HTMLElement);
    expect(scan.getByRole('img', { name: 'QR-код для застосунку автентифікації' })).toBeVisible();
    expect(scan.getByRole('button', { name: 'Скопіювати ключ' })).toBeInTheDocument();
    expect(
      scan.getByText('Якщо не вдається відсканувати QR-код, введіть цей ключ у застосунку вручну.')
    ).toBeInTheDocument();
  });

  it('keeps the info button and the backup key copy inside the save step', () => {
    render(<Guide otpauthUri={buildOtpauthUri()} secret={buildTotpSecret()} />, {
      wrapper: Wrapper,
    });

    const save = within(stepsOf()[2] as HTMLElement);
    expect(save.getByRole('button', { name: 'Навіщо зберігати ключ' })).toBeInTheDocument();
    expect(save.getByRole('button', { name: 'Скопіювати резервний ключ' })).toBeInTheDocument();
  });

  it('leaves the QR image out when there is no otpauth URI', () => {
    render(<Guide otpauthUri={null} secret={buildTotpSecret()} />, { wrapper: Wrapper });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(stepsOf()).toHaveLength(3);
  });

  it('leaves both keys out when there is no secret', () => {
    render(<Guide otpauthUri={buildOtpauthUri()} secret={null} />, { wrapper: Wrapper });

    expect(screen.queryByRole('button', { name: /Скопіювати/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('code')).not.toBeInTheDocument();
    const save = stepsOf()[2];
    assertInstanceOf(save, HTMLElement);
    expect(within(save).getAllByRole('generic')).toHaveLength(2);
  });
});
