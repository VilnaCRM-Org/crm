import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type JSX, type ReactNode, useRef } from 'react';
import { I18nextProvider } from 'react-i18next';

import type { ToastDraft, ToastDraftSet } from '@/components/types/ui-toast';
import UIToastStack from '@/components/ui-toast';
import useToastQueue from '@/hooks/use-toast-queue';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createLocaleI18n('uk')}>{children}</I18nextProvider>
);

const success = (message: string): ToastDraft => ({ tone: 'success', message });

const failure = (message: string): ToastDraft => ({ tone: 'error', message });

const set = (...items: ToastDraft[]): ToastDraftSet => ({ items });

interface PageProps {
  readonly onReady: (show: (drafts: ToastDraftSet) => void) => void;
}

function Page({ onReady }: PageProps): JSX.Element {
  const queue = useToastQueue();
  const returnFocusRef = useRef<HTMLButtonElement>(null);
  onReady(queue.show);

  return (
    <main>
      <button ref={returnFocusRef} type="button">
        Зберегти зміни
      </button>
      <UIToastStack
        toasts={queue.toasts}
        announcement={queue.announcement}
        onDismiss={queue.dismiss}
        returnFocusRef={returnFocusRef}
      />
    </main>
  );
}

const mountPage = (): ((drafts: ToastDraftSet) => void) => {
  let show: (drafts: ToastDraftSet) => void = () => undefined;
  render(<Page onReady={(next) => (show = next)} />, { wrapper });
  return (drafts) => act(() => show(drafts));
};

const closeButtons = (): HTMLElement[] =>
  screen.queryAllByRole('button', { name: 'Закрити сповіщення' });

describe('UIToastStack', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('scroll-padding-bottom');
  });

  it('mounts one polite status region before any toast exists', () => {
    mountPage();

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('');
    expect(closeButtons()).toHaveLength(0);
  });

  it('shows the toasts in order and announces three successes as one text update', () => {
    const show = mountPage();

    show(set(success('Перше'), success('Друге'), success('Третє')));

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Перше Друге Третє');
    expect(closeButtons()).toHaveLength(3);
    expect(screen.getAllByText(/^(Перше|Друге|Третє)$/).map((node) => node.textContent)).toEqual([
      'Перше',
      'Друге',
      'Третє',
    ]);
  });

  it('changes the status text for an identical repeat', () => {
    const show = mountPage();

    show(set(success('Зміни збережено')));
    expect(screen.getByRole('status')).toHaveTextContent(/^Зміни збережено\u200B$/);

    show(set(success('Зміни збережено')));
    expect(screen.getByRole('status')).toHaveTextContent(/^Зміни збережено$/);
  });

  it('keeps an error text out of the status region and announces it as an alert', () => {
    const show = mountPage();

    show(set(failure('Не вдалося зберегти')));

    expect(screen.getByRole('status')).toHaveTextContent('');
    expect(screen.getByRole('alert')).toHaveTextContent('Не вдалося зберегти');
  });

  it('keeps every toast after a minute, since no timer exists', () => {
    jest.useFakeTimers();
    const show = mountPage();
    show(set(success('Перше'), failure('Друге')));

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(closeButtons()).toHaveLength(2);
    jest.useRealTimers();
  });

  it('moves no focus when a toast mounts', () => {
    const show = mountPage();
    screen.getByRole('button', { name: 'Зберегти зміни' }).focus();

    show(set(success('Перше')));

    expect(screen.getByRole('button', { name: 'Зберегти зміни' })).toHaveFocus();
  });

  it('moves focus to the next toast close button when a toast closes', async () => {
    const show = mountPage();
    show(set(success('Перше'), success('Друге'), success('Третє')));
    const [first, second] = closeButtons();

    await userEvent.click(first as HTMLElement);

    expect(closeButtons()).toHaveLength(2);
    expect(second).toHaveFocus();
  });

  it('moves focus to the return target when the last toast closes', async () => {
    const show = mountPage();
    show(set(success('Перше'), success('Друге')));

    await userEvent.click(closeButtons()[1] as HTMLElement);

    expect(screen.getByRole('button', { name: 'Зберегти зміни' })).toHaveFocus();
    expect(closeButtons()).toHaveLength(1);
  });

  it('moves focus to the return target when the only toast closes', async () => {
    const show = mountPage();
    show(set(failure('Не вдалося')));

    await userEvent.click(closeButtons()[0] as HTMLElement);

    expect(screen.getByRole('button', { name: 'Зберегти зміни' })).toHaveFocus();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  describe('scroll padding', () => {
    const stubHeight = (height: number): jest.SpyInstance =>
      jest
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockReturnValue({ height } as DOMRect);

    afterEach(() => jest.restoreAllMocks());

    it('is not set while no toast shows', () => {
      mountPage();

      expect(document.documentElement.style.getPropertyValue('scroll-padding-bottom')).toBe('');
    });

    it('equals the measured stack height and is cleared when the stack empties', async () => {
      stubHeight(132);
      const show = mountPage();

      show(set(success('Перше')));

      expect(document.documentElement.style.getPropertyValue('scroll-padding-bottom')).toBe(
        '132px'
      );

      await userEvent.click(closeButtons()[0] as HTMLElement);

      expect(document.documentElement.style.getPropertyValue('scroll-padding-bottom')).toBe('');
    });

    it('is measured again when the toast count changes', () => {
      const measure = stubHeight(61);
      const show = mountPage();
      show(set(success('Перше')));

      measure.mockReturnValue({ height: 130 } as DOMRect);
      show(set(success('Друге')));

      expect(document.documentElement.style.getPropertyValue('scroll-padding-bottom')).toBe(
        '130px'
      );
    });

    it('is cleared when the stack unmounts', () => {
      stubHeight(61);
      let show: (drafts: ToastDraftSet) => void = () => undefined;
      const { unmount } = render(<Page onReady={(next) => (show = next)} />, { wrapper });
      act(() => show(set(success('Перше'))));

      unmount();

      expect(document.documentElement.style.getPropertyValue('scroll-padding-bottom')).toBe('');
    });
  });
});
