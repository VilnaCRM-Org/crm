import '@testing-library/jest-dom';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TwoFactorPanel } from '@/modules/user/features/settings/components/two-factor-settings';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

import { EMPTY_SETTINGS, panelProps, renderPanel, viewState } from './render-panel';

const ENABLED = { ...EMPTY_SETTINGS, status: 'enabled' as const };

const withView = (
  view: ReturnType<typeof viewState>,
  isSubmitting = false
): ReturnType<typeof panelProps> => panelProps({ settings: ENABLED, view, isSubmitting });

const settle = (): Promise<void> =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

const transition = async (
  utils: ReturnType<typeof renderPanel>,
  props: ReturnType<typeof panelProps>,
  view: ReturnType<typeof viewState>
): Promise<void> => {
  utils.rerender(
    <TwoFactorPanel
      settings={ENABLED}
      view={view}
      callbacks={props.callbacks}
      isSubmitting={false}
    />
  );
  await settle();
};

const disableButton = (): HTMLElement => screen.getByRole('button', { name: 'Вимкнути' });
const regenerateButton = (): HTMLElement =>
  screen.getByRole('button', { name: 'Створити нові резервні коди' });

describe('the on view actions', () => {
  it('offers the two outlined buttons by name, in that order', async () => {
    renderPanel(withView(viewState('on')));

    expect(disableButton()).toHaveClass('MuiButton-outlined');
    expect(regenerateButton()).toHaveClass('MuiButton-outlined');
    await userEvent.tab();
    expect(disableButton()).toHaveFocus();
    await userEvent.tab();
    expect(regenerateButton()).toHaveFocus();
  });

  it('opens the confirmations through the callbacks', async () => {
    const props = withView(viewState('on'));
    renderPanel(props);

    await userEvent.click(disableButton());
    await userEvent.click(regenerateButton());

    expect(props.callbacks.openDisable).toHaveBeenCalledTimes(1);
    expect(props.callbacks.openRegenerate).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['disable', disableButton],
    ['regenerate', regenerateButton],
  ] as const)(
    'returns focus to the button that opened %s when it is cancelled',
    async (view, button) => {
      const props = withView(viewState('on'));
      const utils = renderPanel(props);
      await transition(utils, props, viewState(view));

      await transition(utils, props, viewState('on'));

      expect(button()).toHaveFocus();
      expect(
        screen.getByRole('heading', { level: 3, name: 'Двофакторну автентифікацію ввімкнено' })
      ).not.toHaveFocus();
    }
  );

  it('keeps focus where it is on an unrelated re-render of the on view', async () => {
    const props = withView(viewState('on'));
    const utils = renderPanel(props);
    await transition(utils, props, viewState('disable'));
    await transition(utils, props, viewState('on'));
    const field = disableButton();
    expect(field).toHaveFocus();
    act(() => field.blur());

    await transition(utils, props, viewState('on', { banner: 'transient' }));

    expect(field).not.toHaveFocus();
  });

  it('has no accessibility violation', async () => {
    const utils = renderPanel(withView(viewState('on')));

    await expectNoA11yViolations(utils.container);
  });
});

describe('the disable view', () => {
  it('moves focus to the level-3 title and shows the description', () => {
    renderPanel(withView(viewState('disable')));

    expect(
      screen.getByRole('heading', { level: 3, name: 'Вимкнути двофакторну автентифікацію' })
    ).toHaveFocus();
    expect(screen.getByText('Введіть код із застосунку або резервний код.')).toBeInTheDocument();
  });

  it('has one labelled field without a placeholder, the submit and Скасувати after it', () => {
    renderPanel(withView(viewState('disable')));

    const field = screen.getByRole('textbox', { name: 'Код підтвердження' });
    const submit = screen.getAllByRole('button', { name: 'Вимкнути' })[0] as HTMLElement;
    const cancel = screen.getByRole('button', { name: 'Скасувати' });
    expect(field.getAttribute('placeholder') ?? '').toBe('');
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(cancel).toHaveClass('MuiButton-outlined');
    expect(submit.compareDocumentPosition(cancel)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it.each(['123456', 'abcd-2345'])('hands the typed value %s to disable once', async (typed) => {
    const props = withView(viewState('disable'));
    renderPanel(props);

    await userEvent.type(screen.getByRole('textbox', { name: 'Код підтвердження' }), typed);
    await userEvent.click(screen.getByRole('button', { name: 'Вимкнути' }));

    expect(props.callbacks.disable).toHaveBeenCalledTimes(1);
    expect(jest.mocked(props.callbacks.disable).mock.calls[0]?.[0]).toEqual({
      twoFactorCode: typed,
    });
  });

  it.each([
    ['format', 'Введіть 6 цифр або резервний код у форматі XXXX-XXXX'],
    ['invalid_code', 'Невірний код. Спробуйте ще раз.'],
  ] as const)(
    'shows the %s error with aria-invalid, described, and focus in the field',
    async (error, text) => {
      renderPanel(withView(viewState('disable', { fieldError: error })));

      const field = screen.getByRole('textbox', { name: 'Код підтвердження' });
      expect(await screen.findByText(text)).toBeInTheDocument();
      expect(field).toHaveAttribute('aria-invalid', 'true');
      expect(field).toHaveAccessibleDescription(text);
      await waitFor(() => expect(field).toHaveFocus());
    }
  );

  it('cancels with the button and with Escape', async () => {
    const props = withView(viewState('disable'));
    renderPanel(props);

    await userEvent.click(screen.getByRole('button', { name: 'Скасувати' }));
    await userEvent.keyboard('{Escape}');

    expect(props.callbacks.cancel).toHaveBeenCalledTimes(2);
  });

  it('ignores other keys', async () => {
    const props = withView(viewState('disable'));
    renderPanel(props);

    await userEvent.keyboard('{Enter}a');

    expect(props.callbacks.cancel).not.toHaveBeenCalled();
  });

  it.each([
    ['rate limited', viewState('disable', { banner: 'rate_limited' })],
    ['transient', viewState('disable', { banner: 'transient' })],
  ])('has the %s banner as an alert inside the section', (_name, view) => {
    renderPanel(withView(view));

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('retries from the transient banner once', async () => {
    const props = withView(viewState('disable', { banner: 'transient' }));
    renderPanel(props);

    await userEvent.click(screen.getByRole('button', { name: /спробувати/i }));

    expect(props.callbacks.retry).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['at rest', viewState('disable')],
    ['with a format error', viewState('disable', { fieldError: 'format' })],
    ['with a wrong code', viewState('disable', { fieldError: 'invalid_code' })],
    ['with a banner', viewState('disable', { banner: 'transient' })],
  ])('has no accessibility violation %s', async (_name, view) => {
    const utils = renderPanel(withView(view));
    await settle();

    await expectNoA11yViolations(utils.container);
  });
});

describe('the regenerate view', () => {
  it('moves focus to the title and shows the warning', () => {
    renderPanel(withView(viewState('regenerate')));

    expect(
      screen.getByRole('heading', { level: 3, name: 'Створити нові резервні коди' })
    ).toHaveFocus();
    expect(
      screen.getByText('Старі резервні коди перестануть діяти. Продовжити?')
    ).toBeInTheDocument();
  });

  it('confirms with Створити коди once and cancels with Скасувати or Escape', async () => {
    const props = withView(viewState('regenerate'));
    renderPanel(props);

    await userEvent.click(screen.getByRole('button', { name: 'Створити коди' }));
    await userEvent.click(screen.getByRole('button', { name: 'Скасувати' }));
    await userEvent.keyboard('{Escape}');

    expect(props.callbacks.regenerate).toHaveBeenCalledTimes(1);
    expect(props.callbacks.cancel).toHaveBeenCalledTimes(2);
  });

  it('shows the busy status and the banners', () => {
    renderPanel(withView(viewState('regenerate', { banner: 'rate_limited' }), true));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Створюємо…')).toBeInTheDocument();
  });

  it.each([
    ['at rest', viewState('regenerate')],
    ['with a banner', viewState('regenerate', { banner: 'transient' })],
  ])('has no accessibility violation %s', async (_name, view) => {
    const utils = renderPanel(withView(view));

    await expectNoA11yViolations(utils.container);
  });
});

describe('the reauth view', () => {
  const MESSAGE = /нові коди можна створити лише протягом 5 хвилин/;

  it('shows the message, focused, and an outlined sign-in button', () => {
    renderPanel(withView(viewState('reauth')));

    expect(screen.getByText(MESSAGE)).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Увійти знову' })).toHaveClass('MuiButton-outlined');
  });

  it('signs in again through the callback, once', async () => {
    const props = withView(viewState('reauth'));
    renderPanel(props);

    await userEvent.click(screen.getByRole('button', { name: 'Увійти знову' }));

    expect(props.callbacks.signInAgain).toHaveBeenCalledTimes(1);
  });

  it('has no accessibility violation', async () => {
    const utils = renderPanel(withView(viewState('reauth')));

    await expectNoA11yViolations(utils.container);
  });
});
