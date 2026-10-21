import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createRef,
  type JSX,
  type ReactNode,
  type RefObject,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { I18nextProvider } from 'react-i18next';

import type { ToastDraft, ToastDraftSet } from '@/components/types/ui-toast';
import UIToastStack from '@/components/ui-toast';
import useToastQueue from '@/hooks/use-toast-queue';
import createToastLocaleI18n from '@tests/unit/utils/create-toast-locale-i18n';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createToastLocaleI18n('uk')}>{children}</I18nextProvider>
);

const success = (message: string): ToastDraft => ({ tone: 'success', message });

const failure = (message: string): ToastDraft => ({ tone: 'error', message });

const set = (...items: ToastDraft[]): ToastDraftSet => ({ items });

type ReturnTarget = 'enabled' | 'disabled' | 'detached' | 'none';

type ShowDrafts = (drafts: ToastDraftSet) => void;

interface PageOptions {
  readonly returnTarget?: ReturnTarget | undefined;
  readonly withFallback?: boolean | undefined;
  readonly strict?: boolean | undefined;
}

interface PageProps extends PageOptions {
  readonly showRef: RefObject<ShowDrafts | null>;
  readonly rerenderRef: RefObject<(() => void) | null>;
}

const detached = document.createElement('button');

function Page({
  showRef,
  rerenderRef,
  returnTarget = 'enabled',
  withFallback = false,
}: PageProps): JSX.Element {
  const queue = useToastQueue();
  const [, setRenders] = useState(0);
  const saveRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const returnFocusRef: RefObject<HTMLElement | null> =
    returnTarget === 'detached' ? { current: detached } : saveRef;
  useImperativeHandle(showRef, () => queue.show);
  useImperativeHandle(rerenderRef, () => (): void => setRenders((count) => count + 1));

  return (
    <main>
      <h1 ref={headingRef} tabIndex={-1}>
        Налаштування
      </h1>
      {returnTarget === 'none' ? null : (
        <button ref={saveRef} type="button" disabled={returnTarget === 'disabled'}>
          Зберегти зміни
        </button>
      )}
      <UIToastStack
        toasts={queue.toasts}
        announcement={queue.announcement}
        alert={queue.alert}
        onDismiss={queue.dismiss}
        returnFocusRef={returnFocusRef}
        fallbackFocusRef={withFallback ? headingRef : undefined}
      />
    </main>
  );
}

type Show = ShowDrafts & {
  readonly settled: (drafts: ToastDraftSet) => Promise<void>;
  readonly rerender: () => void;
  readonly unmount: () => void;
};

const mountPage = (options: PageOptions = {}): Show => {
  const showRef = createRef<ShowDrafts>();
  const rerenderRef = createRef<() => void>();
  const { unmount } = render(
    <Page
      showRef={showRef}
      rerenderRef={rerenderRef}
      returnTarget={options.returnTarget}
      withFallback={options.withFallback}
    />,
    { wrapper, reactStrictMode: options.strict === true }
  );
  return Object.assign((drafts: ToastDraftSet) => act(() => showRef.current?.(drafts)), {
    settled: async (drafts: ToastDraftSet): Promise<void> => {
      await act(async () => showRef.current?.(drafts));
    },
    rerender: (): void => act(() => rerenderRef.current?.()),
    unmount,
  });
};

const closeButtons = (): HTMLElement[] =>
  screen.queryAllByRole('button', { name: 'Закрити сповіщення' });

const saveButton = (): HTMLElement => screen.getByRole('button', { name: 'Зберегти зміни' });

const focusOn = async (element: HTMLElement | undefined): Promise<void> => {
  await act(async () => element?.focus());
};

const heading = (): HTMLElement => screen.getByRole('heading', { level: 1 });

describe('UIToastStack', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('scroll-padding-bottom');
  });

  describe('live regions', () => {
    it('mounts one empty status region and one empty alert region before any toast', () => {
      mountPage();

      expect(screen.getAllByRole('status')).toHaveLength(1);
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
      expect(screen.getAllByRole('alert')).toHaveLength(1);
      expect(screen.getByRole('alert')).toBeEmptyDOMElement();
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

    it('announces an error through the one always-mounted alert region, never the status', () => {
      const show = mountPage();
      const region = screen.getByRole('alert');

      show(set(failure('Не вдалося зберегти')));

      expect(screen.getAllByRole('alert')).toHaveLength(1);
      expect(screen.getByRole('alert')).toBe(region);
      expect(region).toHaveTextContent(/^Не вдалося зберегти\u200B$/);
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    });

    it('changes the alert text for an identical repeated error', () => {
      const show = mountPage();

      show(set(failure('Не вдалося зберегти')));
      expect(screen.getByRole('alert')).toHaveTextContent(/^Не вдалося зберегти\u200B$/);

      show(set(failure('Не вдалося зберегти')));

      expect(screen.getByRole('alert')).toHaveTextContent(/^Не вдалося зберегти$/);
      expect(screen.getAllByRole('alert')).toHaveLength(1);
    });

    it('gives no toast a role of its own', () => {
      const show = mountPage();

      show(set(failure('Не вдалося'), success('Збережено')));

      expect(screen.getAllByRole('alert')).toHaveLength(1);
      expect(screen.getAllByRole('status')).toHaveLength(1);
      expect(screen.getAllByText(/^(Не вдалося|Збережено)$/)).toHaveLength(2);
    });
  });

  describe('with fake timers', () => {
    beforeEach(() => jest.useFakeTimers());

    afterEach(() => jest.useRealTimers());

    it('keeps every toast after a minute, since no timer exists', () => {
      const show = mountPage();
      show(set(success('Перше'), failure('Друге')));

      act(() => {
        jest.advanceTimersByTime(60_000);
      });

      expect(closeButtons()).toHaveLength(2);
    });
  });

  describe('focus on close', () => {
    it('moves no focus when a toast mounts', () => {
      const show = mountPage();
      saveButton().focus();

      show(set(success('Перше')));

      expect(saveButton()).toHaveFocus();
    });

    it('moves focus to the next toast close button when a toast closes', async () => {
      const show = mountPage();
      show(set(success('Перше'), success('Друге'), success('Третє')));
      const [first, second] = closeButtons();

      await userEvent.click(first as HTMLElement);

      expect(closeButtons()).toHaveLength(2);
      expect(second).toHaveFocus();
    });

    it('prefers the next toast over the previous one when a middle toast closes', async () => {
      const show = mountPage();
      show(set(success('Перше'), success('Друге'), success('Третє')));
      const [, second, third] = closeButtons();

      await userEvent.click(second as HTMLElement);

      expect(third).toHaveFocus();
    });

    it('moves focus to the previous close button when the last of several closes', async () => {
      const show = mountPage();
      show(set(success('Перше'), success('Друге')));
      const [first, second] = closeButtons();

      await userEvent.click(second as HTMLElement);

      expect(closeButtons()).toEqual([first]);
      expect(first).toHaveFocus();
    });

    it('moves focus to the return target when the only toast closes', async () => {
      const show = mountPage({ withFallback: true });
      show(set(failure('Не вдалося')));

      await userEvent.click(closeButtons()[0] as HTMLElement);

      expect(saveButton()).toHaveFocus();
      expect(closeButtons()).toHaveLength(0);
    });

    it('moves focus to the fallback when the return target is disabled', async () => {
      const show = mountPage({ returnTarget: 'disabled', withFallback: true });
      show(set(success('Перше')));

      await userEvent.click(closeButtons()[0] as HTMLElement);

      expect(heading()).toHaveFocus();
      expect(document.body).not.toHaveFocus();
    });

    it('moves focus to the fallback when the return target is not in the document', async () => {
      const show = mountPage({ returnTarget: 'detached', withFallback: true });
      show(set(success('Перше')));

      await userEvent.click(closeButtons()[0] as HTMLElement);

      expect(heading()).toHaveFocus();
    });

    it('moves focus to the fallback when the return target is not rendered', async () => {
      const show = mountPage({ returnTarget: 'none', withFallback: true });
      show(set(success('Перше')));

      await userEvent.click(closeButtons()[0] as HTMLElement);

      expect(heading()).toHaveFocus();
    });

    it('still closes the toast when neither target can take focus', async () => {
      const show = mountPage({ returnTarget: 'disabled' });
      show(set(success('Перше')));

      await userEvent.click(closeButtons()[0] as HTMLElement);

      expect(closeButtons()).toHaveLength(0);
      expect(heading()).not.toHaveFocus();
    });
  });

  describe('focus on eviction', () => {
    it('moves focus to the newest close button when the focused toast is pushed out', async () => {
      const show = mountPage();
      show(set(success('Перше')));
      await focusOn(closeButtons()[0]);

      await show.settled(set(success('Друге'), success('Третє'), success('Четверте')));

      expect(closeButtons()).toHaveLength(3);
      expect(document.body).not.toHaveFocus();
      expect(closeButtons()[2]).toHaveFocus();
    });

    it('moves focus to the newest close button when the pushed-out action had focus', async () => {
      const show = mountPage();
      show(
        set({ ...failure('Не вдалося'), action: { label: 'Повторити', onActivate: jest.fn() } })
      );
      await focusOn(screen.getByRole('button', { name: 'Повторити' }));

      await show.settled(set(success('Друге'), success('Третє'), success('Четверте')));

      expect(screen.queryByRole('button', { name: 'Повторити' })).not.toBeInTheDocument();
      expect(closeButtons()[2]).toHaveFocus();
    });

    it('keeps focus on a toast that stays when another toast arrives', async () => {
      const show = mountPage();
      show(set(success('Перше')));
      const first = closeButtons()[0] as HTMLElement;
      await focusOn(first);

      await show.settled(set(success('Друге')));

      expect(first).toHaveFocus();
    });

    it('does not count a parent re-render as a lost focus', async () => {
      const show = mountPage();
      show(set(success('Перше')));
      const first = closeButtons()[0] as HTMLElement;
      await focusOn(first);

      show.rerender();
      act(() => first.blur());
      await show.settled(set(success('Друге')));

      expect(document.body).toHaveFocus();
      expect(closeButtons()).toHaveLength(2);
    });

    it('does not count a parent re-render as a lost focus under StrictMode', async () => {
      const show = mountPage({ strict: true });
      show(set(success('Перше')));
      const first = closeButtons()[0] as HTMLElement;
      await focusOn(first);

      show.rerender();
      act(() => first.blur());
      await show.settled(set(success('Друге')));

      expect(document.body).toHaveFocus();
      expect(closeButtons()).toHaveLength(2);
    });

    it('moves no focus when a toast that did not hold focus is pushed out', () => {
      const show = mountPage();
      show(set(success('Перше'), success('Друге'), success('Третє')));

      show(set(success('Четверте')));

      expect(document.body).toHaveFocus();
    });

    it('forgets a recovered loss, so a later push-out moves no focus', async () => {
      const show = mountPage();
      show(set(success('Перше')));
      await focusOn(closeButtons()[0]);
      await show.settled(set(success('Друге'), success('Третє'), success('Четверте')));
      act(() => closeButtons()[2]?.blur());

      await show.settled(set(success('П’яте')));

      expect(document.body).toHaveFocus();
    });
  });

  describe('scroll padding', () => {
    const VIEWPORT_HEIGHT = 800;
    let innerHeight: number;

    const stubTop = (top: number): jest.SpyInstance =>
      jest
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockReturnValue({ top } as DOMRect);

    beforeEach(() => {
      innerHeight = window.innerHeight;
      window.innerHeight = VIEWPORT_HEIGHT;
    });

    afterEach(() => {
      window.innerHeight = innerHeight;
      jest.restoreAllMocks();
    });

    it('is not set while no toast shows', () => {
      mountPage();

      expect(document.documentElement.style.getPropertyValue('scroll-padding-bottom')).toBe('');
    });

    it('covers the stack and its bottom inset, and is cleared when the stack empties', async () => {
      stubTop(668);
      const show = mountPage();

      show(set(success('Перше')));

      expect(document.documentElement.style.getPropertyValue('scroll-padding-bottom')).toBe(
        '132px'
      );

      await userEvent.click(closeButtons()[0] as HTMLElement);

      expect(document.documentElement.style.getPropertyValue('scroll-padding-bottom')).toBe('');
    });

    it('is measured again when the toast count changes', () => {
      const measure = stubTop(739);
      const show = mountPage();
      show(set(success('Перше')));

      measure.mockReturnValue({ top: 670 } as DOMRect);
      show(set(success('Друге')));

      expect(document.documentElement.style.getPropertyValue('scroll-padding-bottom')).toBe(
        '130px'
      );
    });

    it('is cleared when the stack unmounts', () => {
      stubTop(739);
      const show = mountPage();
      show(set(success('Перше')));

      show.unmount();

      expect(document.documentElement.style.getPropertyValue('scroll-padding-bottom')).toBe('');
    });
  });
});
