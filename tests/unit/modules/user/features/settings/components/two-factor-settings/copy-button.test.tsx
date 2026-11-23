import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type JSX, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import Copy from '@/modules/user/features/settings/components/two-factor-settings/copy-button';
import { buildTotpSecret } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

const LABEL = 'Скопіювати коди';
const COPIED = 'Коди скопійовано';
const FAILED = 'Не вдалося. Виділіть коди вручну.';

function Wrapper({ children }: { children: ReactNode }): JSX.Element {
  return (
    <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>{children}</I18nextProvider>
  );
}

const installClipboard = (writeText: jest.Mock): void => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
};

const mount = (): ReturnType<typeof render> => {
  const text = buildTotpSecret();
  const targetRef = createRef<HTMLElement>();
  return render(
    <>
      <code ref={targetRef}>{text}</code>
      <Copy
        text={text}
        targetRef={targetRef}
        label={LABEL}
        copiedText={COPIED}
        failedText={FAILED}
      />
    </>,
    { wrapper: Wrapper }
  );
};

const user = (): ReturnType<typeof userEvent.setup> =>
  userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

const press = async (
  actor: ReturnType<typeof userEvent.setup>,
  button: HTMLElement
): Promise<void> => {
  await actor.click(button);
  await act(() => jest.advanceTimersByTimeAsync(0));
};

const copyOf = (name: string): HTMLElement => screen.getByRole('button', { name });

const textOf = (text: string): HTMLElement =>
  screen.getByText(text, { selector: 'span[aria-hidden]' });

const lineOf = (text: string): HTMLElement | null => screen.queryByText(text, { selector: 'p' });

const elapse = (ms: number): void => {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
};

describe('CopyButton visible copy feedback', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    window.getSelection()?.removeAllRanges();
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('offers the copy and shows no line before a copy', () => {
    mount();

    expect(copyOf(LABEL)).toBeInTheDocument();
    expect(lineOf(FAILED)).not.toBeInTheDocument();
  });

  it('turns the text of the same button into the copied text, with no separate line', async () => {
    const actor = user();
    installClipboard(jest.fn().mockResolvedValue(undefined));
    mount();
    const button = copyOf(LABEL);

    await press(actor, button);

    expect(copyOf(COPIED)).toBe(button);
    expect(button).toHaveFocus();
    expect(button).toHaveClass('MuiButton-outlinedPill');
    expect(lineOf(COPIED)).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(COPIED);
  });

  it('holds both texts in one cell and hides the one not shown', async () => {
    const actor = user();
    installClipboard(jest.fn().mockResolvedValue(undefined));
    mount();
    const shown = { visibility: 'visible', gridArea: '1/1' };
    const hidden = { visibility: 'hidden', gridArea: '1/1' };

    expect(textOf(LABEL)).toHaveAttribute('aria-hidden', 'false');
    expect(textOf(LABEL)).toHaveStyle(shown);
    expect(textOf(COPIED)).toHaveAttribute('aria-hidden', 'true');
    expect(textOf(COPIED)).toHaveStyle(hidden);

    await press(actor, copyOf(LABEL));

    expect(textOf(LABEL)).toHaveAttribute('aria-hidden', 'true');
    expect(textOf(LABEL)).toHaveStyle(hidden);
    expect(textOf(COPIED)).toHaveAttribute('aria-hidden', 'false');
    expect(textOf(COPIED)).toHaveStyle(shown);
  });

  it('returns to the copy text after 3 s', async () => {
    const actor = user();
    installClipboard(jest.fn().mockResolvedValue(undefined));
    mount();

    await press(actor, copyOf(LABEL));
    elapse(2999);
    expect(copyOf(COPIED)).toBeInTheDocument();
    elapse(1);

    expect(copyOf(LABEL)).toBeInTheDocument();
  });

  it('restarts the 3 s hold on a new copy', async () => {
    const actor = user();
    installClipboard(jest.fn().mockResolvedValue(undefined));
    mount();
    const button = copyOf(LABEL);

    await press(actor, button);
    elapse(2000);
    await press(actor, button);
    elapse(2999);
    expect(copyOf(COPIED)).toBe(button);
    elapse(1);

    expect(copyOf(LABEL)).toBe(button);
  });

  it('keeps the copied text for at most 3 s while a repeat copy never settles', async () => {
    const actor = user();
    installClipboard(
      jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockReturnValueOnce(new Promise<void>(() => undefined))
    );
    mount();
    const button = copyOf(LABEL);

    await press(actor, button);
    elapse(2900);
    await press(actor, button);
    elapse(2999);
    expect(copyOf(COPIED)).toBe(button);
    elapse(1);

    expect(copyOf(LABEL)).toBe(button);
  });

  it('shows the copied text again after it returned', async () => {
    const actor = user();
    installClipboard(jest.fn().mockResolvedValue(undefined));
    mount();
    const button = copyOf(LABEL);

    await press(actor, button);
    elapse(3000);
    await press(actor, button);

    expect(copyOf(COPIED)).toBe(button);
  });

  it('drops the copied text at once when a repeat copy fails', async () => {
    const actor = user();
    installClipboard(
      jest.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('refused'))
    );
    mount();
    const button = copyOf(LABEL);

    await press(actor, button);
    await press(actor, button);

    expect(copyOf(LABEL)).toBe(button);
    expect(lineOf(FAILED)).toBeInTheDocument();
  });

  it('shows the failure line above the button and keeps it until the next copy', async () => {
    const actor = user();
    installClipboard(
      jest.fn().mockRejectedValueOnce(new Error('refused')).mockResolvedValueOnce(undefined)
    );
    mount();
    const button = copyOf(LABEL);

    await press(actor, button);
    const line = lineOf(FAILED);
    expect(line).toHaveAttribute('aria-hidden', 'true');
    expect(line?.compareDocumentPosition(button)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    elapse(60_000);
    expect(lineOf(FAILED)).toBeInTheDocument();

    await press(actor, button);

    expect(lineOf(FAILED)).not.toBeInTheDocument();
    expect(copyOf(COPIED)).toBe(button);
  });

  it('clears the hold timer on unmount', async () => {
    const actor = user();
    installClipboard(jest.fn().mockResolvedValue(undefined));
    const { unmount } = mount();
    await press(actor, copyOf(LABEL));
    elapse(1000);
    expect(jest.getTimerCount()).toBe(1);

    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });
});
