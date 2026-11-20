import '@testing-library/jest-dom';
import { render, renderHook, type RenderHookResult, screen } from '@testing-library/react';
import { type JSX, useCallback } from 'react';

import type {
  NoticeCloseRegistry,
  NoticeFocus,
  NoticeTargetRef,
} from '@/components/types/ui-bell-notice';
import useNoticeFocus from '@/components/ui-bell-notice/use-notice-focus';
import type { NotificationViewSet } from '@/lib/notifications/types/notification-view';

const views: NotificationViewSet = {
  items: ['one', 'two', 'three'].map((id) => ({
    id,
    kind: 'success',
    message: `Рядок ${id}`,
  })),
};

interface RowProps {
  readonly id: string;
  readonly registry: NoticeCloseRegistry;
  readonly dismiss: (id: string) => void;
}

function Row({ id, registry, dismiss }: RowProps): JSX.Element {
  const ref = useCallback(
    (node: HTMLButtonElement): void => {
      registry.current.set(id, node);
    },
    [id, registry]
  );
  const onClick = useCallback((): void => dismiss(id), [id, dismiss]);

  return (
    <button type="button" ref={ref} onClick={onClick}>
      {`Закрити ${id}`}
    </button>
  );
}

interface HarnessProps {
  readonly set: NotificationViewSet;
  readonly save: NoticeTargetRef;
  readonly heading?: NoticeTargetRef;
  readonly onDismiss: (id: string) => void;
}

function Harness({ set, save, heading, onDismiss }: HarnessProps): JSX.Element {
  const { registry, dismiss } = useNoticeFocus({
    views: set,
    returnFocusRef: save,
    fallbackFocusRef: heading,
    onDismiss,
  });

  return (
    <div>
      {set.items.map(({ id }) => (
        <Row key={id} id={id} registry={registry} dismiss={dismiss} />
      ))}
    </div>
  );
}

const targets = (): { save: HTMLButtonElement; heading: HTMLHeadingElement } => {
  const save = document.createElement('button');
  const heading = document.createElement('h1');
  heading.tabIndex = -1;
  document.body.append(save, heading);
  return { save, heading };
};

describe('useNoticeFocus', () => {
  afterEach(() => document.body.replaceChildren());

  it('runs the caller dismiss for the id and moves focus to the next close button', () => {
    const { save } = targets();
    const onDismiss = jest.fn();
    render(<Harness set={views} save={{ current: save }} onDismiss={onDismiss} />);

    screen.getByRole('button', { name: 'Закрити two' }).click();

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith('two');
    expect(screen.getByRole('button', { name: 'Закрити three' })).toHaveFocus();
  });

  it('moves focus to the previous close button when the last row closes', () => {
    const { save } = targets();
    render(<Harness set={views} save={{ current: save }} onDismiss={jest.fn()} />);

    screen.getByRole('button', { name: 'Закрити three' }).click();

    expect(screen.getByRole('button', { name: 'Закрити two' })).toHaveFocus();
  });

  it('moves focus to the caller Save target when the only row closes', () => {
    const { save, heading } = targets();
    const single = { items: [views.items[0]] } as NotificationViewSet;
    render(
      <Harness
        set={single}
        save={{ current: save }}
        heading={{ current: heading }}
        onDismiss={jest.fn()}
      />
    );

    screen.getByRole('button', { name: 'Закрити one' }).click();

    expect(save).toHaveFocus();
  });

  it('moves focus to the h1 when the Save target is disabled', () => {
    const { save, heading } = targets();
    save.disabled = true;
    const single = { items: [views.items[0]] } as NotificationViewSet;
    render(
      <Harness
        set={single}
        save={{ current: save }}
        heading={{ current: heading }}
        onDismiss={jest.fn()}
      />
    );

    screen.getByRole('button', { name: 'Закрити one' }).click();

    expect(heading).toHaveFocus();
  });

  it('moves focus to the h1 when the Save target is no longer in the document', () => {
    const { save, heading } = targets();
    save.remove();
    const single = { items: [views.items[0]] } as NotificationViewSet;
    render(
      <Harness
        set={single}
        save={{ current: save }}
        heading={{ current: heading }}
        onDismiss={jest.fn()}
      />
    );

    screen.getByRole('button', { name: 'Закрити one' }).click();

    expect(heading).toHaveFocus();
  });

  it('only runs the caller dismiss when nothing is left to focus', () => {
    const onDismiss = jest.fn();
    const single = { items: [views.items[0]] } as NotificationViewSet;
    render(<Harness set={single} save={{ current: null }} onDismiss={onDismiss} />);

    screen.getByRole('button', { name: 'Закрити one' }).click();

    expect(onDismiss).toHaveBeenCalledWith('one');
  });

  it('hands every render the same registry and a dismiss that follows the latest rows', () => {
    const onDismiss = jest.fn();
    const { result, rerender } = renderHook(
      ({ set }) => useNoticeFocus({ views: set, returnFocusRef: { current: null }, onDismiss }),
      { initialProps: { set: views } }
    );
    const first = result.current;

    rerender({ set: { items: [views.items[0]] } as NotificationViewSet });

    expect(result.current.registry).toBe(first.registry);
    result.current.dismiss('one');
    expect(onDismiss).toHaveBeenCalledWith('one');
  });

  it('does nothing for an id that is not shown, apart from the caller dismiss', () => {
    const { save } = targets();
    const onDismiss = jest.fn();
    const { result } = renderHook(() =>
      useNoticeFocus({ views, returnFocusRef: { current: save }, onDismiss })
    );

    result.current.dismiss('ghost');

    expect(save).not.toHaveFocus();
    expect(onDismiss).toHaveBeenCalledWith('ghost');
  });
});

type Mounted = RenderHookResult<NoticeFocus, { set: NotificationViewSet }>;

describe('useNoticeFocus release', () => {
  afterEach(() => document.body.replaceChildren());

  const closeButton = (id: string): HTMLButtonElement => {
    const button = document.createElement('button');
    button.textContent = `Закрити ${id}`;
    document.body.append(button);
    return button;
  };

  const mount = (save: HTMLElement | null): Mounted => {
    const returnFocusRef = { current: save };
    const onDismiss = jest.fn();
    return renderHook(({ set }) => useNoticeFocus({ views: set, returnFocusRef, onDismiss }), {
      initialProps: { set: views },
    });
  };

  it('keeps the same release across renders with new rows', () => {
    const { result, rerender } = mount(null);
    const first = result.current.release;

    rerender({ set: { items: [views.items[2]] } as NotificationViewSet });

    expect(result.current.release).toBe(first);
  });

  it('only unregisters a button that does not hold focus', () => {
    const { save } = targets();
    const { result } = mount(save);
    const one = closeButton('one');
    const two = closeButton('two');
    result.current.registry.current.set('one', one);
    result.current.registry.current.set('two', two);

    result.current.release('one', one);

    expect(document.body).toHaveFocus();
    expect([...result.current.registry.current.keys()]).toEqual(['two']);
  });

  it('hands a focused button over to the next shown row, then unregisters it', () => {
    const { save } = targets();
    const { result } = mount(save);
    const one = closeButton('one');
    const two = closeButton('two');
    result.current.registry.current.set('one', one);
    result.current.registry.current.set('two', two);
    one.focus();

    result.current.release('one', one);

    expect(two).toHaveFocus();
    expect(result.current.registry.current.has('one')).toBe(false);
  });

  it('hands a focused button over to the Save target when no other row is registered', () => {
    const { save } = targets();
    const { result } = mount(save);
    const three = closeButton('three');
    result.current.registry.current.set('three', three);
    three.focus();

    result.current.release('three', three);

    expect(save).toHaveFocus();
  });
});
