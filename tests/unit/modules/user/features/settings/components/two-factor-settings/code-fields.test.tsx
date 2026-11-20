import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import type { JSX } from 'react';
import * as ReactI18next from 'react-i18next';
import { I18nextProvider } from 'react-i18next';

import { TwoFactorPanel } from '@/modules/user/features/settings/components/two-factor-settings';
import { buildOtpauthUri, buildTotpCode, buildTotpSecret } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import loadIsolated from '@tests/unit/utils/isolated-module';

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
    expect(
      screen.getByText(
        'Невірний код. Перевірте, чи правильно встановлено час на телефоні, і спробуйте ще раз.'
      )
    ).toBeInTheDocument();
  });

  it('clears the six cells and focuses the first when a wrong code settles', async () => {
    const i18n = createSettingsLocaleI18n('uk', []);
    const { rerender } = render(<Panel view={viewState('setup')} i18n={i18n} />);
    await userEvent.click(firstCell());
    await userEvent.keyboard(buildTotpCode());
    expect(firstCell()).not.toHaveValue('');

    rerender(<Panel view={viewState('setup', { fieldError: 'invalid_code' })} i18n={i18n} />);

    await waitFor(() => expect(firstCell()).toHaveFocus());
    const cells = screen.getAllByLabelText(/^Цифра \d з 6$/);
    expect(cells).toHaveLength(6);
    cells.forEach((cell) => expect(cell).toHaveValue(''));
  });

  it('keeps the typed code when only the incomplete error settles', async () => {
    const i18n = createSettingsLocaleI18n('uk', []);
    const code = buildTotpCode();
    const { rerender } = render(<Panel view={viewState('setup')} i18n={i18n} />);
    await userEvent.click(firstCell());
    await userEvent.keyboard(code);

    rerender(<Panel view={viewState('setup', { fieldError: 'incomplete' })} i18n={i18n} />);

    await waitFor(() => expect(firstCell()).toHaveFocus());
    expect(firstCell()).toHaveValue(code.charAt(0));
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

    expect(await screen.findByText('Incorrect code. Try again.')).toBeInTheDocument();
    expect(elsewhere).toHaveFocus();
  });
});

describe('code field error tables loaded inside the test', () => {
  const TEXTS = {
    incomplete: 'Введіть усі 6 цифр коду',
    confirmInvalid:
      'Невірний код. Перевірте, чи правильно встановлено час на телефоні, і спробуйте ще раз.',
    format: 'Введіть 6 цифр або резервний код у форматі XXXX-XXXX',
    disableInvalid: 'Невірний код. Спробуйте ще раз.',
  } as const;

  const mountLoaded = async (view: View): Promise<void> => {
    const Loaded = await loadIsolated(async () => {
      jest.doMock('react', () => React);
      jest.doMock('react-i18next', () => ReactI18next);
      return (await import('@/modules/user/features/settings/components/two-factor-settings'))
        .TwoFactorPanel;
    });
    const props = panelProps({ settings: SETUP_SETTINGS, view });
    render(
      <I18nextProvider i18n={createSettingsLocaleI18n('uk', [])}>
        <main>
          <Loaded
            settings={props.settings}
            view={props.view}
            callbacks={props.callbacks}
            isSubmitting={props.isSubmitting}
          />
        </main>
      </I18nextProvider>
    );
  };

  const shown = (): string[] =>
    Object.values(TEXTS).filter((text) => screen.queryByText(text) !== null);

  it.each([
    ['incomplete', [TEXTS.incomplete]],
    ['invalid_code', [TEXTS.confirmInvalid]],
    ['format', []],
    [null, []],
  ] as const)('shows the confirm field error %s as %j', async (fieldError, texts) => {
    await mountLoaded(viewState('setup', { fieldError }));

    await act(async () => undefined);

    expect(screen.getByLabelText('Цифра 1 з 6').getAttribute('aria-invalid') === 'true').toBe(
      texts.length > 0
    );
    expect(shown()).toStrictEqual(texts);
  });

  it.each([
    ['format', [TEXTS.format]],
    ['invalid_code', [TEXTS.disableInvalid]],
    ['incomplete', []],
    [null, []],
  ] as const)('shows the disable field error %s as %j', async (fieldError, texts) => {
    await mountLoaded(viewState('disable', { fieldError, fieldErrorOccurrence: 1 }));

    await act(async () => undefined);

    expect(shown()).toStrictEqual(texts);
  });
});
