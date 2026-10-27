import '@testing-library/jest-dom';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TwoFactorPanel } from '@/modules/user/features/settings/components/two-factor-settings';
import { buildRecoveryCodeSet } from '@tests/builders';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

import { EMPTY_SETTINGS, panelProps, renderPanel, viewState } from './render-panel';

const SET = buildRecoveryCodeSet();
const VALUES = SET.items.map((code) => code.value);
const BLOCKED = 'Спочатку підтвердьте, що зберегли коди';

const codesProps = (
  overrides: Parameters<typeof panelProps>[0] = {}
): ReturnType<typeof panelProps> =>
  panelProps({
    settings: { ...EMPTY_SETTINGS, status: 'enabled', recoveryCodes: SET },
    view: viewState('codes'),
    ...overrides,
  });

const done = (): HTMLElement => screen.getByRole('button', { name: 'Готово' });

describe('the codes view', () => {
  it('moves focus to the level-3 title Резервні коди', () => {
    renderPanel(codesProps());

    expect(screen.getByRole('heading', { level: 3, name: 'Резервні коди' })).toHaveFocus();
  });

  it('lists the eight codes in an ordered list, in response order', () => {
    renderPanel(codesProps());

    const items = within(screen.getByRole('list', { name: 'Резервні коди' })).getAllByRole(
      'listitem'
    );

    expect(items.map((item) => item.textContent)).toEqual(VALUES);
    expect(items).toHaveLength(8);
  });

  it('shows no list or copy button when the entity holds no codes', () => {
    renderPanel(codesProps({ settings: EMPTY_SETTINGS }));

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Скопіювати коди' })).not.toBeInTheDocument();
  });

  describe('copying', () => {
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

    it('copies the codes newline-separated and announces it, keeping focus', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      installClipboard(writeText);
      renderPanel(codesProps());
      const button = screen.getByRole('button', { name: 'Скопіювати коди' });

      await userEvent.click(button);

      expect(writeText).toHaveBeenCalledWith(VALUES.join('\n'));
      expect(screen.getAllByRole('status').map((region) => region.textContent)).toContain(
        'Коди скопійовано'
      );
      expect(button).toHaveFocus();
    });

    it('selects the list and announces the manual fallback without a clipboard', async () => {
      installClipboard(undefined);
      renderPanel(codesProps());

      await userEvent.click(screen.getByRole('button', { name: 'Скопіювати коди' }));

      expect(screen.getAllByRole('status').map((region) => region.textContent)).toContain(
        'Не вдалося скопіювати. Виділіть коди й скопіюйте вручну.'
      );
      expect(window.getSelection()?.toString()).toContain(VALUES[0]);
    });
  });

  describe('the acknowledgement', () => {
    it('blocks Готово with its reason while the box is unticked', () => {
      renderPanel(codesProps());

      expect(done()).toHaveAttribute('aria-disabled', 'true');
      expect(done()).toBeEnabled();
      expect(done()).toHaveAccessibleDescription(expect.stringContaining(BLOCKED));
      expect(screen.getByText(BLOCKED)).toBeInTheDocument();
    });

    it('sends nothing on click, Enter or Space while unticked', async () => {
      const props = codesProps();
      renderPanel(props);

      await userEvent.click(done());
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');

      expect(done()).toHaveFocus();
      expect(props.callbacks.done).not.toHaveBeenCalled();
    });

    it('ticks the box with Space and then lets Готово send done once', async () => {
      const props = codesProps();
      renderPanel(props);
      const box = screen.getByRole('checkbox', { name: 'Я зберіг(-ла) коди в надійному місці' });

      await userEvent.tab();
      await userEvent.tab();
      expect(box).toHaveFocus();
      await userEvent.keyboard(' ');

      expect(box).toBeChecked();
      expect(done()).not.toHaveAttribute('aria-disabled');
      expect(screen.queryByText(BLOCKED)).not.toBeInTheDocument();
      await userEvent.click(done());
      expect(props.callbacks.done).toHaveBeenCalledTimes(1);
    });

    it('blocks Готово again when the box is unticked', async () => {
      renderPanel(codesProps());
      const box = screen.getByRole('checkbox');

      await userEvent.click(box);
      await userEvent.click(box);

      expect(box).not.toBeChecked();
      expect(done()).toHaveAttribute('aria-disabled', 'true');
    });
  });

  it('leaves no code in the DOM once the on view replaces it', () => {
    const props = codesProps();
    const utils = renderPanel(props);
    expect(screen.getByText(VALUES[0] ?? '')).toBeInTheDocument();

    utils.rerender(
      <TwoFactorPanel
        settings={{ ...EMPTY_SETTINGS, status: 'enabled' }}
        view={viewState('on')}
        callbacks={props.callbacks}
        isSubmitting={false}
      />
    );

    for (const value of VALUES) expect(screen.queryByText(value)).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it.each([
    ['unticked', false],
    ['ticked', true],
  ])('has no accessibility violation %s', async (_name, tick) => {
    const utils = renderPanel(codesProps());
    if (tick) await userEvent.click(screen.getByRole('checkbox'));

    await expectNoA11yViolations(utils.container);
  });
});

describe('the on view and the status headings', () => {
  it('shows the on heading with a decorative icon, without stealing focus on first render', () => {
    renderPanel(
      panelProps({ view: viewState('on'), settings: { ...EMPTY_SETTINGS, status: 'enabled' } })
    );

    const heading = screen.getByRole('heading', {
      level: 3,
      name: 'Двофакторну автентифікацію ввімкнено',
    });
    expect(heading).not.toHaveFocus();
    expect(heading.innerHTML).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('moves focus to the on heading when the codes view hands over with Готово', () => {
    const props = codesProps();
    const utils = renderPanel(props);

    utils.rerender(
      <TwoFactorPanel
        settings={{ ...EMPTY_SETTINGS, status: 'enabled' }}
        view={viewState('on')}
        callbacks={props.callbacks}
        isSubmitting={false}
      />
    );

    expect(
      screen.getByRole('heading', { level: 3, name: 'Двофакторну автентифікацію ввімкнено' })
    ).toHaveFocus();
  });

  it('shows the already-on heading when 2FA turned out to be enabled', () => {
    renderPanel(panelProps({ view: viewState('on', { statusCode: 'already_on' }) }));

    expect(
      screen.getByRole('heading', { level: 3, name: 'Двофакторну автентифікацію вже ввімкнено.' })
    ).toHaveFocus();
  });

  it.each([
    ['stale', 'Налаштування застаріло. Почніть знову.'],
    ['disabled', 'Двофакторну автентифікацію вимкнено.'],
    ['already_off', 'Двофакторну автентифікацію вже вимкнено.'],
  ] as const)('shows the %s heading in the off view, focused, with no icon', (code, text) => {
    renderPanel(panelProps({ view: viewState('off', { statusCode: code }) }));

    const heading = screen.getByRole('heading', { level: 3, name: text });
    expect(heading).toHaveFocus();
    expect(heading.innerHTML).not.toContain('<svg');
    expect(screen.getByRole('button', { name: 'Почати налаштування' })).toBeInTheDocument();
  });

  it('shows no level-3 heading in the plain off view', () => {
    renderPanel(panelProps());

    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
  });

  it.each([
    ['on', panelProps({ view: viewState('on') })],
    ['already on', panelProps({ view: viewState('on', { statusCode: 'already_on' }) })],
    ['stale', panelProps({ view: viewState('off', { statusCode: 'stale' }) })],
  ])('has no accessibility violation in the %s state', async (_name, props) => {
    const utils = renderPanel(props);

    await expectNoA11yViolations(utils.container);
  });
});
