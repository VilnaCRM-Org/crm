import '@testing-library/jest-dom';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TwoFactorPanel } from '@/modules/user/features/settings/components/two-factor-settings';
import { buildOtpauthUri, buildTotpSecret } from '@tests/builders';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

import { EMPTY_SETTINGS, panelProps, renderPanel, viewState } from './render-panel';

const SECRET = buildTotpSecret();
const URI = buildOtpauthUri();
const SETUP_SETTINGS = { ...EMPTY_SETTINGS, otpauthUri: URI, secret: SECRET };

const setupProps = (
  overrides: Parameters<typeof panelProps>[0] = {}
): ReturnType<typeof panelProps> =>
  panelProps({ settings: SETUP_SETTINGS, view: viewState('setup'), ...overrides });

describe('TwoFactorPanel', () => {
  describe('the section', () => {
    it('is a region named by its level-2 heading', () => {
      renderPanel(panelProps());

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'Двофакторна автентифікація'
      );
      expect(
        screen.getByRole('region', { name: 'Двофакторна автентифікація' })
      ).toBeInTheDocument();
    });

    it('speaks English when the language is English', () => {
      renderPanel(panelProps(), 'en');

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'Two-factor authentication'
      );
      expect(screen.getByRole('button', { name: 'Start setup' })).toBeInTheDocument();
    });
  });

  describe('the off view', () => {
    it('shows the description, three numbered steps and the start button', () => {
      renderPanel(panelProps());

      expect(
        screen.getByText(
          'Додайте до входу другий крок: одноразовий код із застосунку автентифікації.'
        )
      ).toBeInTheDocument();
      const steps = within(screen.getByRole('list')).getAllByRole('listitem');
      expect(steps.map((step) => step.textContent)).toEqual([
        '1Завантажте й установіть застосунок автентифікації, наприклад Google Authenticator',
        '2Відскануйте QR-код у застосунку автентифікації',
        '3Збережіть резервний ключ у надійному місці',
      ]);
      expect(screen.getByRole('button', { name: 'Почати налаштування' })).toBeEnabled();
    });

    it('starts setup once when the button is activated', async () => {
      const props = panelProps();
      renderPanel(props);

      await userEvent.click(screen.getByRole('button', { name: 'Почати налаштування' }));

      expect(props.callbacks.start).toHaveBeenCalledTimes(1);
    });

    it('marks the form busy and announces the preparing status while submitting', () => {
      renderPanel(panelProps({ isSubmitting: true }));

      expect(screen.getByText('Підготовка…')).toBeInTheDocument();
    });

    it('shows the rate-limited banner without Retry', () => {
      renderPanel(panelProps({ view: viewState('off', { banner: 'rate_limited' }) }));

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Забагато спроб. Зачекайте хвилину і спробуйте знову.'
      );
      expect(screen.queryByRole('button', { name: 'Спробувати ще раз' })).not.toBeInTheDocument();
    });

    it('shows the transient banner with a Retry that starts setup again once', async () => {
      const props = panelProps({ view: viewState('off', { banner: 'transient' }) });
      renderPanel(props);

      expect(screen.getByRole('alert')).toHaveTextContent('Не вдалося виконати дію');
      await userEvent.click(screen.getByRole('button', { name: /спробувати/i }));

      await waitFor(() => expect(props.callbacks.start).toHaveBeenCalledTimes(1));
    });

    it('mounts a new, focused banner for a second transient failure in a row', async () => {
      const first = panelProps({
        view: viewState('off', { banner: 'transient', bannerOccurrence: 1 }),
      });
      const utils = renderPanel(first);
      const firstAlert = screen.getByRole('alert');
      await userEvent.click(screen.getByRole('button', { name: /спробувати/i }));

      utils.rerender(
        <TwoFactorPanel
          settings={first.settings}
          view={viewState('off', { banner: 'transient', bannerOccurrence: 2 })}
          callbacks={first.callbacks}
          isSubmitting={false}
        />
      );

      const secondAlert = await screen.findByRole('alert');
      expect(secondAlert).not.toBe(firstAlert);
      const banner = screen
        .getAllByRole('generic')
        .find((element) => element.tagName === 'SECTION' && element.contains(secondAlert));
      expect(banner).toHaveFocus();
    });

    it('has no accessibility violation, with or without a banner', async () => {
      const utils = renderPanel(panelProps());
      await expectNoA11yViolations(utils.container);
      utils.unmount();

      const view = renderPanel(panelProps({ view: viewState('off', { banner: 'transient' }) }));
      await expectNoA11yViolations(view.container);
    });
  });

  describe('the setup view', () => {
    it('moves focus to the level-3 title and names the QR image', () => {
      renderPanel(setupProps());

      const title = screen.getByRole('heading', {
        level: 3,
        name: 'Налаштуйте двофакторну автентифікацію',
      });
      expect(title).toHaveFocus();
      expect(
        screen.getByRole('img', { name: 'QR-код для застосунку автентифікації' })
      ).toBeInTheDocument();
    });

    it('shows the key in groups of four and the two steps', () => {
      renderPanel(setupProps());

      const grouped = SECRET.match(/.{4}/g)?.join(' ') ?? '';
      expect(screen.getByText(grouped)).toBeInTheDocument();
      expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(2);
    });

    it('shows the confirm group, the sessions note and the confirm button', () => {
      renderPanel(setupProps());

      expect(screen.getByRole('group', { name: 'Код із застосунку' })).toBeInTheDocument();
      expect(
        screen.getByText('Після підтвердження всі інші ваші сеанси буде завершено.')
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Підтвердити' })).toBeEnabled();
    });

    it('sends the six typed digits to confirm once', async () => {
      const props = setupProps();
      renderPanel(props);

      await userEvent.click(screen.getByLabelText('Цифра 1 з 6'));
      await userEvent.keyboard('123456');
      await userEvent.click(screen.getByRole('button', { name: 'Підтвердити' }));

      expect(props.callbacks.confirm).toHaveBeenCalledTimes(1);
      expect(jest.mocked(props.callbacks.confirm).mock.calls[0]?.[0]).toEqual({
        twoFactorCode: '123456',
      });
    });

    it.each([
      ['incomplete', 'Введіть усі 6 цифр коду'],
      ['invalid_code', 'Невірний код. Спробуйте ще раз.'],
    ] as const)(
      'shows the %s field error, marks it invalid and moves focus into it',
      async (error, text) => {
        renderPanel(setupProps({ view: viewState('setup', { fieldError: error }) }));

        expect(screen.getByText(text)).toBeInTheDocument();
        const cell = screen.getByLabelText('Цифра 1 з 6');
        expect(cell).toHaveAttribute('aria-invalid', 'true');
        await waitFor(() => expect(cell).toHaveFocus());
      }
    );

    it('keeps the QR image and key when a wrong code settles', () => {
      renderPanel(setupProps({ view: viewState('setup', { fieldError: 'invalid_code' }) }));

      expect(
        screen.getByRole('img', { name: 'QR-код для застосунку автентифікації' })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Скопіювати ключ' })).toBeInTheDocument();
    });

    it('omits the QR image and the key controls when the entity holds neither', () => {
      renderPanel(setupProps({ settings: EMPTY_SETTINGS }));

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Скопіювати ключ' })).not.toBeInTheDocument();
    });

    it('disables the pin cells while submitting', () => {
      renderPanel(setupProps({ isSubmitting: true }));

      expect(screen.getByLabelText('Цифра 1 з 6')).toHaveAttribute('aria-disabled', 'true');
    });

    it('shows the rate-limited banner without Retry', () => {
      renderPanel(setupProps({ view: viewState('setup', { banner: 'rate_limited' }) }));

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Забагато спроб. Зачекайте хвилину і спробуйте знову.'
      );
      expect(screen.queryByRole('button', { name: /спробувати/i })).not.toBeInTheDocument();
    });

    it('shows the transient banner with a Retry that confirms the typed code once', async () => {
      const props = setupProps({ view: viewState('setup', { banner: 'transient' }) });
      renderPanel(props);
      await userEvent.type(screen.getByLabelText('Цифра 1 з 6'), '654321');

      await userEvent.click(screen.getByRole('button', { name: /спробувати/i }));

      await waitFor(() => expect(props.callbacks.confirm).toHaveBeenCalledTimes(1));
      expect(props.callbacks.confirm).toHaveBeenCalledWith({ twoFactorCode: '654321' });
    });

    it.each([
      ['at rest', setupProps()],
      [
        'with an incomplete code',
        setupProps({ view: viewState('setup', { fieldError: 'incomplete' }) }),
      ],
      [
        'with a wrong code',
        setupProps({ view: viewState('setup', { fieldError: 'invalid_code' }) }),
      ],
      ['rate limited', setupProps({ view: viewState('setup', { banner: 'rate_limited' }) })],
      [
        'with a transient banner',
        setupProps({ view: viewState('setup', { banner: 'transient' }) }),
      ],
      ['while submitting', setupProps({ isSubmitting: true })],
    ])('has no accessibility violation %s', async (_name, props) => {
      const utils = renderPanel(props);

      await expectNoA11yViolations(utils.container);
    });
  });

  describe('copying the key', () => {
    const installClipboard = (writeText: jest.Mock | undefined): void => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: writeText === undefined ? undefined : { writeText },
      });
    };

    afterEach(() => {
      window.getSelection()?.removeAllRanges();
      Reflect.deleteProperty(navigator, 'clipboard');
    });

    it('copies the secret without spaces, announces it and keeps focus on the button', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      installClipboard(writeText);
      renderPanel(setupProps());
      const button = screen.getByRole('button', { name: 'Скопіювати ключ' });

      await userEvent.click(button);

      expect(writeText).toHaveBeenCalledWith(SECRET);
      expect(screen.getAllByRole('status').map((region) => region.textContent)).toContain(
        'Ключ скопійовано'
      );
      expect(button).toHaveFocus();
    });

    it('selects the key and announces the manual fallback without a clipboard', async () => {
      installClipboard(undefined);
      renderPanel(setupProps());
      const button = screen.getByRole('button', { name: 'Скопіювати ключ' });

      await userEvent.click(button);

      expect(screen.getAllByRole('status').map((region) => region.textContent)).toContain(
        'Не вдалося скопіювати. Виділіть ключ і скопіюйте вручну.'
      );
      expect(window.getSelection()?.toString()).toBe(SECRET.match(/.{4}/g)?.join(' '));
      expect(button).toHaveFocus();
    });

    it('announces a second copy again by alternating the mark', async () => {
      installClipboard(jest.fn().mockResolvedValue(undefined));
      renderPanel(setupProps());
      const button = screen.getByRole('button', { name: 'Скопіювати ключ' });
      const message = (): string | null | undefined =>
        screen.getAllByRole('status').find((region) => region.textContent?.startsWith('Ключ'))
          ?.textContent;

      await userEvent.click(button);
      const first = message();
      await userEvent.click(button);
      const second = message();

      expect(first).toBe('Ключ скопійовано');
      expect(second).toBe('Ключ скопійовано​');
    });
  });
});
