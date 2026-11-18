import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type JSX, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import Copy from '@/modules/user/features/settings/components/two-factor-settings/copy-button';
import { buildTotpSecret } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import stubMotionPreference from '@tests/unit/utils/stub-motion-preference';

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
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('shows no line before a copy', () => {
    mount();

    expect(lineOf(COPIED)).not.toBeInTheDocument();
    expect(lineOf(FAILED)).not.toBeInTheDocument();
  });

  it('shows the copied line above an unchanged button, hidden from assistive tech', async () => {
    const actor = user();
    installClipboard(jest.fn().mockResolvedValue(undefined));
    mount();
    const button = screen.getByRole('button', { name: LABEL });

    await press(actor, button);

    const line = lineOf(COPIED);
    expect(line).toHaveAttribute('aria-hidden', 'true');
    expect(line?.compareDocumentPosition(button)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByRole('button', { name: LABEL })).toBe(button);
    expect(button).toHaveTextContent(LABEL);
    expect(button).toHaveTextContent(new RegExp(`^${LABEL}$`, 'u'));
    expect(button).toHaveClass('MuiButton-outlinedPill');
    expect(screen.getByRole('status')).toHaveTextContent(COPIED);
  });

  it('keeps the copied line for 3 s plus the 0.4 s fade, then removes it', async () => {
    const actor = user();
    installClipboard(jest.fn().mockResolvedValue(undefined));
    mount();

    await press(actor, screen.getByRole('button', { name: LABEL }));
    elapse(3399);
    expect(lineOf(COPIED)).toBeInTheDocument();
    elapse(1);

    expect(lineOf(COPIED)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: LABEL })).toHaveTextContent(LABEL);
  });

  it('removes the copied line at 3 s with no fade under reduced motion', async () => {
    stubMotionPreference(true);
    const actor = user();
    installClipboard(jest.fn().mockResolvedValue(undefined));
    mount();

    await press(actor, screen.getByRole('button', { name: LABEL }));
    elapse(2999);
    expect(lineOf(COPIED)).toBeInTheDocument();
    elapse(1);

    expect(lineOf(COPIED)).not.toBeInTheDocument();
  });

  it('keeps the fade when motion is not reduced', async () => {
    stubMotionPreference(false);
    const actor = user();
    installClipboard(jest.fn().mockResolvedValue(undefined));
    mount();

    await press(actor, screen.getByRole('button', { name: LABEL }));
    elapse(3000);

    expect(lineOf(COPIED)).toBeInTheDocument();
  });

  it('restarts the 3 s hold on a new copy', async () => {
    const actor = user();
    installClipboard(jest.fn().mockResolvedValue(undefined));
    mount();
    const button = screen.getByRole('button', { name: LABEL });

    await press(actor, button);
    elapse(2000);
    await press(actor, button);
    elapse(3000);
    expect(lineOf(COPIED)).toBeInTheDocument();
    elapse(400);

    expect(lineOf(COPIED)).not.toBeInTheDocument();
  });

  it('shows the copied line again after it expired', async () => {
    const actor = user();
    installClipboard(jest.fn().mockResolvedValue(undefined));
    mount();
    const button = screen.getByRole('button', { name: LABEL });

    await press(actor, button);
    elapse(3400);
    await press(actor, button);

    expect(lineOf(COPIED)).toBeInTheDocument();
  });

  it('shows the failure line in the same place and keeps it until the next copy', async () => {
    const actor = user();
    installClipboard(
      jest.fn().mockRejectedValueOnce(new Error('refused')).mockResolvedValueOnce(undefined)
    );
    mount();
    const button = screen.getByRole('button', { name: LABEL });

    await press(actor, button);
    const line = lineOf(FAILED);
    expect(line).toHaveAttribute('aria-hidden', 'true');
    expect(line?.compareDocumentPosition(button)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(lineOf(COPIED)).not.toBeInTheDocument();
    elapse(60_000);
    expect(lineOf(FAILED)).toBeInTheDocument();

    await press(actor, button);

    expect(lineOf(FAILED)).not.toBeInTheDocument();
    expect(lineOf(COPIED)?.compareDocumentPosition(button)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('clears the hold timer on unmount', async () => {
    const actor = user();
    installClipboard(jest.fn().mockResolvedValue(undefined));
    const { unmount } = mount();
    await press(actor, screen.getByRole('button', { name: LABEL }));
    elapse(1000);
    expect(jest.getTimerCount()).toBe(1);

    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });
});
