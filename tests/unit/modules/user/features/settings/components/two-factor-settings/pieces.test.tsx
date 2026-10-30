import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type JSX, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import Copy from '@/modules/user/features/settings/components/two-factor-settings/copy-button';
import KeyChip from '@/modules/user/features/settings/components/two-factor-settings/key-chip';
import StepItem from '@/modules/user/features/settings/components/two-factor-settings/step-item';
import { buildTotpSecret } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

import { panelProps, renderPanel, viewState } from './render-panel';

function Wrapper({ children }: { children: ReactNode }): JSX.Element {
  return (
    <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>{children}</I18nextProvider>
  );
}

describe('StepItem', () => {
  it('shows the position in a decorative badge and the text beside it', () => {
    render(
      <ol>
        <StepItem position={2} text="Відскануйте QR-код" />
      </ol>
    );

    expect(screen.getByRole('listitem')).toHaveTextContent('2Відскануйте QR-код');
    expect(screen.getByText('Відскануйте QR-код')).toBeInTheDocument();
    expect(screen.getByText('2')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('the step guides', () => {
  it.each([
    ['setup', 'setup', 2],
    ['off', 'off', 3],
  ] as const)('keeps the list role on the unstyled %s step list', async (_name, view, steps) => {
    const { container } = renderPanel(panelProps({ view: viewState(view) }));

    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(list).toHaveAttribute('role', 'list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(steps);
    await expectNoA11yViolations(container);
  });
});

describe('KeyChip', () => {
  it.each([
    ['ABCDEFGHIJKLMNOP', 'ABCD EFGH IJKL MNOP'],
    ['ABCDEFGHIJ', 'ABCD EFGH IJ'],
    ['ABC', 'ABC'],
    ['', ''],
  ])('groups %s in fours as "%s"', (secret, expected) => {
    render(<KeyChip secret={secret} chipRef={createRef<HTMLElement>()} />);

    expect(screen.getByText((_, node) => node?.tagName === 'CODE')).toHaveTextContent(expected, {
      normalizeWhitespace: false,
    });
  });

  it('hands the code element to the ref', () => {
    const chipRef = createRef<HTMLElement>();
    render(<KeyChip secret={buildTotpSecret()} chipRef={chipRef} />);

    expect(chipRef.current?.tagName).toBe('CODE');
  });
});

describe('CopyButton', () => {
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

  const mount = (): { text: string; target: HTMLElement } => {
    const text = buildTotpSecret();
    const targetRef = createRef<HTMLElement>();
    render(
      <>
        <code ref={targetRef}>{text}</code>
        <Copy
          text={text}
          targetRef={targetRef}
          label="Copy"
          copiedText="Done"
          failedText="Failed"
        />
      </>,
      { wrapper: Wrapper }
    );
    return { text, target: screen.getByText(text) };
  };

  it('is an outlined button with no status until pressed', () => {
    mount();

    expect(screen.getByRole('button', { name: 'Copy' })).toHaveClass('MuiButton-outlined');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('writes the text and says it was copied', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    installClipboard(writeText);
    const { text } = mount();

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(writeText).toHaveBeenCalledWith(text);
    expect(screen.getByRole('status')).toHaveTextContent('Done');
  });

  it('selects the target and says it failed when the write is refused', async () => {
    installClipboard(jest.fn().mockRejectedValue(new Error('no')));
    const { text } = mount();

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(screen.getByRole('status')).toHaveTextContent('Failed');
    expect(window.getSelection()?.toString()).toBe(text);
  });

  it('alternates the mark so a repeat copy is announced again', async () => {
    installClipboard(jest.fn().mockResolvedValue(undefined));
    mount();
    const button = screen.getByRole('button', { name: 'Copy' });

    await userEvent.click(button);
    expect(screen.getByRole('status')).toHaveTextContent(/^Done$/);
    await userEvent.click(button);
    expect(screen.getByRole('status')).toHaveTextContent(/^Done\u200b$/);
    await userEvent.click(button);
    expect(screen.getByRole('status')).toHaveTextContent(/^Done$/);
  });
});
