import '@testing-library/jest-dom';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createRef,
  type JSX,
  type ReactNode,
  type RefObject,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { I18nextProvider } from 'react-i18next';

import UIToastStack from '@/components/ui-toast';
import useNotifications from '@/hooks/use-notifications';
import type {
  NotificationDraft,
  NotificationDraftSet,
} from '@/lib/notifications/types/notification-draft';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import createToastLocaleI18n from '@tests/unit/utils/create-toast-locale-i18n';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const i18n = createToastLocaleI18n('uk');

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

const success = (messageKey: string): NotificationDraft => ({ kind: 'success', messageKey });

const failure = (messageKey: string): NotificationDraft => ({ kind: 'error', messageKey });

const set = (...items: NotificationDraft[]): NotificationDraftSet => ({ items });

type ReturnTarget = 'enabled' | 'disabled' | 'detached' | 'hidden' | 'none';

interface PageOptions {
  readonly returnTarget?: ReturnTarget | undefined;
  readonly withFallback?: boolean | undefined;
  readonly strict?: boolean | undefined;
}

interface PageProps extends PageOptions {
  readonly rerenderRef: RefObject<(() => void) | null>;
}

const detached = document.createElement('button');

function Page({
  rerenderRef,
  returnTarget = 'enabled',
  withFallback = false,
}: PageProps): JSX.Element {
  const { publishFocus } = useNotifications();
  const [, setRenders] = useState(0);
  const saveRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const detachedRef = useRef<HTMLElement | null>(detached);
  const primary = returnTarget === 'detached' ? detachedRef : saveRef;
  useImperativeHandle(rerenderRef, () => (): void => setRenders((count) => count + 1));
  useLayoutEffect(() => {
    publishFocus({ primary, fallback: withFallback ? headingRef : undefined });
  }, [publishFocus, primary, withFallback]);

  return (
    <main>
      <h1 ref={headingRef} tabIndex={-1}>
        Налаштування
      </h1>
      {returnTarget === 'none' ? null : (
        <button
          ref={saveRef}
          type="button"
          disabled={returnTarget === 'disabled'}
          style={returnTarget === 'hidden' ? { display: 'none' } : {}}
        >
          Зберегти зміни
        </button>
      )}
      <UIToastStack />
    </main>
  );
}

type Show = ((drafts: NotificationDraftSet) => void) & {
  readonly settled: (drafts: NotificationDraftSet) => Promise<void>;
  readonly rerender: () => void;
  readonly unmount: () => void;
};

const mountPage = (options: PageOptions = {}): Show => {
  const port = renderHook(() => useNotifications(), { wrapper }).result.current;
  const rerenderRef = createRef<() => void>();
  const { unmount } = render(
    <Page
      rerenderRef={rerenderRef}
      returnTarget={options.returnTarget}
      withFallback={options.withFallback}
    />,
    { wrapper, reactStrictMode: options.strict === true }
  );
  return Object.assign((drafts: NotificationDraftSet) => act(() => port.raise(drafts)), {
    settled: async (drafts: NotificationDraftSet): Promise<void> => {
      await act(async () => port.raise(drafts));
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
  beforeEach(() => resetClientStores());

  afterEach(() => {
    document.documentElement.style.removeProperty('scroll-padding-bottom');
  });

  describe('rendering', () => {
    it('renders nothing while no notification is shown', () => {
      const { container } = render(<UIToastStack />, { wrapper });

      expect(container).toBeEmptyDOMElement();
      expect(closeButtons()).toHaveLength(0);
    });

    it('shows the shown notifications in order, translated', () => {
      const show = mountPage();

      show(set(success('Перше'), success('Друге'), success('Третє')));

      expect(closeButtons()).toHaveLength(3);
      expect(screen.getAllByText(/^(Перше|Друге|Третє)$/).map((node) => node.textContent)).toEqual([
        'Перше',
        'Друге',
        'Третє',
      ]);
    });

    it('shows at most the three newest notifications', () => {
      const show = mountPage();

      show(set(success('Перше'), success('Друге'), success('Третє')));
      show(set(success('Четверте')));

      expect(screen.queryByText('Перше')).not.toBeInTheDocument();
      expect(screen.getAllByText(/^(Друге|Третє|Четверте)$/)).toHaveLength(3);
    });

    it('renders no live region and gives no toast a role of its own', () => {
      const show = mountPage();

      show(set(failure('Не вдалося'), success('Збережено')));

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.getAllByText(/^(Не вдалося|Збережено)$/)).toHaveLength(2);
    });

    it('dismisses a closed toast through the port, leaving the others shown', async () => {
      const show = mountPage();
      show(set(success('Перше'), success('Друге')));

      await userEvent.click(closeButtons()[0] as HTMLElement);

      expect(
        useNotificationOutletStore.getState().shown.items.map((item) => item.messageKey)
      ).toEqual(['Друге']);
      expect(screen.queryByText('Перше')).not.toBeInTheDocument();
    });

    it('dismisses the toast before running its action', async () => {
      const seen: number[] = [];
      const onActivate = jest.fn((): void => {
        seen.push(useNotificationOutletStore.getState().shown.items.length);
      });
      const show = mountPage();
      show(set({ ...failure('Не вдалося'), action: { labelKey: 'Повторити', onActivate } }));

      await userEvent.click(screen.getByRole('button', { name: 'Повторити' }));

      expect(onActivate).toHaveBeenCalledTimes(1);
      expect(seen).toEqual([0]);
      expect(closeButtons()).toHaveLength(0);
    });
  });

  describe('with fake timers', () => {
    beforeEach(() => jest.useFakeTimers());

    afterEach(() => jest.useRealTimers());

    it('keeps every toast after ten minutes, since no timer exists', () => {
      const show = mountPage();
      show(set(success('Перше'), failure('Друге')));

      act(() => {
        jest.advanceTimersByTime(600_000);
      });

      expect(closeButtons()).toHaveLength(2);
      expect(jest.getTimerCount()).toBe(0);
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

    it('moves focus to the fallback when the return target is display none', async () => {
      const show = mountPage({ returnTarget: 'hidden', withFallback: true });
      show(set(success('Перше')));

      await userEvent.click(closeButtons()[0] as HTMLElement);

      expect(heading()).toHaveFocus();
      expect(closeButtons()).toHaveLength(0);
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
        set({
          ...failure('Не вдалося'),
          action: { labelKey: 'Повторити', onActivate: jest.fn() },
        })
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
