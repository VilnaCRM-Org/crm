import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import TwoFactorSettings from '@/modules/user/features/settings/components/two-factor-settings';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

import { panelProps, viewState } from './render-panel';

const mockHook = jest.fn();

jest.mock('@/modules/user/features/settings/hooks/use-two-factor-settings', () => ({
  __esModule: true,
  default: (): unknown => mockHook(),
}));

function Wrapper({ children }: { children: ReactNode }): JSX.Element {
  return (
    <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>
      <main>{children}</main>
    </I18nextProvider>
  );
}

describe('TwoFactorSettings', () => {
  beforeEach(() => mockHook.mockReset());

  it('renders the panel for the props the hook returns, off view included', () => {
    mockHook.mockReturnValue(panelProps());

    render(<TwoFactorSettings />, { wrapper: Wrapper });

    expect(screen.getByRole('region', { name: 'Двофакторна автентифікація' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Почати налаштування' })).toBeInTheDocument();
  });

  it('wires the hook callbacks to the controls', async () => {
    const props = panelProps();
    mockHook.mockReturnValue(props);
    render(<TwoFactorSettings />, { wrapper: Wrapper });

    await userEvent.click(screen.getByRole('button', { name: 'Почати налаштування' }));

    expect(props.callbacks.start).toHaveBeenCalledTimes(1);
  });

  it('passes the busy flag and the view to the panel', () => {
    mockHook.mockReturnValue(panelProps({ isSubmitting: true, view: viewState('off') }));

    render(<TwoFactorSettings />, { wrapper: Wrapper });

    expect(screen.getByText('Підготовка…')).toBeInTheDocument();
    expect(mockHook).toHaveBeenCalledTimes(1);
  });
});
