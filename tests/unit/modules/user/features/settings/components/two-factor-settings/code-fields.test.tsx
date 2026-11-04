import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import type { JSX } from 'react';
import { I18nextProvider } from 'react-i18next';

import { TwoFactorPanel } from '@/modules/user/features/settings/components/two-factor-settings';
import { buildOtpauthUri, buildTotpSecret } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

import { EMPTY_SETTINGS, panelProps, viewState } from './render-panel';

type I18n = ReturnType<typeof createSettingsLocaleI18n>;
type View = ReturnType<typeof viewState>;

const SETUP_SETTINGS = {
  ...EMPTY_SETTINGS,
  otpauthUri: buildOtpauthUri(),
  secret: buildTotpSecret(),
};

function Panel({ view, i18n }: { view: View; i18n: I18n }): JSX.Element {
  const props = panelProps({ settings: SETUP_SETTINGS, view });
  return (
    <I18nextProvider i18n={i18n}>
      <main>
        <TwoFactorPanel
          settings={props.settings}
          view={props.view}
          callbacks={props.callbacks}
          isSubmitting={props.isSubmitting}
        />
        <button type="button">Elsewhere</button>
      </main>
    </I18nextProvider>
  );
}

const mount = (view: View, i18n = createSettingsLocaleI18n('uk', [])): void => {
  render(<Panel view={view} i18n={i18n} />);
};

describe('ConfirmCodeField', () => {
  const firstCell = (): HTMLElement => screen.getByLabelText('Цифра 1 з 6');

  it('marks no cell invalid while there is no field error', () => {
    mount(viewState('setup'));

    expect(firstCell()).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('marks no cell invalid for an error it has no text for', () => {
    mount(viewState('setup', { fieldError: 'format' }));

    expect(firstCell()).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('marks the cells invalid and shows the text of a wrong code', () => {
    mount(viewState('setup', { fieldError: 'invalid_code' }));

    expect(firstCell()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Невірний код. Спробуйте ще раз.')).toBeInTheDocument();
  });
});

describe('DisableCodeField', () => {
  it('does not take focus back when only the language of its error changes', async () => {
    const i18n = createSettingsLocaleI18n('uk', ['en']);
    mount(viewState('disable', { fieldError: 'invalid_code' }), i18n);
    await waitFor(() => expect(screen.getByLabelText('Код підтвердження')).toHaveFocus());
    const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
    act(() => elsewhere.focus());

    await act(async () => {
      await i18n.changeLanguage('en');
    });

    expect(await screen.findByText('Invalid code. Try again.')).toBeInTheDocument();
    expect(elsewhere).toHaveFocus();
  });
});
