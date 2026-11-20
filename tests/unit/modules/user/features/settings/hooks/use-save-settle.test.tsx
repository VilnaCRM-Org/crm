import { renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useSaveSettle from '@/modules/user/features/settings/hooks/use-save-settle';
import { buildFullName, buildPassword, buildUserEntity } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

type SaveSettleOptions = Parameters<typeof useSaveSettle>[0];

interface Parts {
  readonly options: SaveSettleOptions;
  readonly show: jest.Mock;
  readonly adopt: jest.Mock;
  readonly dispatch: jest.Mock;
  readonly button: HTMLButtonElement;
  readonly shared: HTMLButtonElement;
  readonly target: HTMLElement;
}

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>{children}</I18nextProvider>
);

const NAME_CHANGE = {
  id: buildUserEntity().id,
  currentPassword: buildPassword(),
  fullName: buildFullName(),
};

const partsOf = (): Parts => {
  const show = jest.fn();
  const adopt = jest.fn();
  const dispatch = jest.fn();
  const button = document.createElement('button');
  const shared = document.createElement('button');
  const target = document.createElement('input');
  const options: SaveSettleOptions = {
    props: {
      user: buildUserEntity(),
      adoption: {
        adopt,
        confirm: jest.fn(),
        isCurrent: (): boolean => true,
        revision: (): number => 0,
      },
      toasts: { toasts: { items: [] }, announcement: '', alert: '', show, dismiss: jest.fn() },
      saveRef: { current: shared },
      headingRef: { current: null },
    },
    targets: { buttonRef: { current: button }, focusRef: { current: target } },
    dispatch,
  };
  return { options, show, adopt, dispatch, button, shared, target };
};

describe('useSaveSettle', () => {
  it('adopts a saved user and shows its toast owned by the section target', () => {
    const { options, show, adopt, dispatch, target } = partsOf();
    const user = buildUserEntity();
    const { result } = renderHook(() => useSaveSettle(options), { wrapper });

    result.current({ kind: 'ok', user }, NAME_CHANGE);

    expect(adopt).toHaveBeenCalledWith(user);
    expect(show).toHaveBeenCalledWith({
      items: [{ tone: 'success', message: 'Зміни збережено', returnFocusRef: { current: target } }],
    });
    expect(dispatch).toHaveBeenCalledWith({ type: 'settled', saved: true });
  });

  it('retries through the section button, not the shared save ref', () => {
    const { options, show, button, shared, target } = partsOf();
    const click = jest.spyOn(button, 'click');
    const sharedClick = jest.spyOn(shared, 'click');
    const { result } = renderHook(() => useSaveSettle(options), { wrapper });

    result.current({ kind: 'failed', reason: 'transient' }, NAME_CHANGE);
    const [drafts] = show.mock.calls[0] as [
      { items: Array<{ returnFocusRef?: unknown; action?: { onActivate: () => void } }> },
    ];
    drafts.items[0]?.action?.onActivate();

    expect(drafts.items[0]?.returnFocusRef).toEqual({ current: target });
    expect(click).toHaveBeenCalledTimes(1);
    expect(sharedClick).not.toHaveBeenCalled();
  });

  it('lets the retry do nothing once the section button is gone', () => {
    const { options, show, shared } = partsOf();
    const sharedClick = jest.spyOn(shared, 'click');
    const gone = { ...options, targets: { ...options.targets, buttonRef: { current: null } } };
    const { result } = renderHook(() => useSaveSettle(gone), { wrapper });

    result.current({ kind: 'failed', reason: 'transient' }, NAME_CHANGE);
    const [drafts] = show.mock.calls[0] as [
      { items: Array<{ action?: { onActivate: () => void } }> },
    ];

    expect(() => drafts.items[0]?.action?.onActivate()).not.toThrow();
    expect(sharedClick).not.toHaveBeenCalled();
  });

  it('shows a rejected failure with no retry action, still owned by the section', () => {
    const { options, show, dispatch, target } = partsOf();
    const { result } = renderHook(() => useSaveSettle(options), { wrapper });

    result.current({ kind: 'failed', reason: 'rejected' }, NAME_CHANGE);

    expect(show).toHaveBeenCalledWith({
      items: [
        {
          tone: 'error',
          message: 'Не вдалося зберегти зміни. Спробуйте пізніше.',
          action: undefined,
          returnFocusRef: { current: target },
        },
      ],
    });
    expect(dispatch).toHaveBeenCalledWith({ type: 'settled', saved: false });
  });

  it('dispatches field errors without a toast', () => {
    const { options, show, dispatch } = partsOf();
    const errors = { items: [{ field: 'fullName', reason: 'name_rejected' }] } as const;
    const { result } = renderHook(() => useSaveSettle(options), { wrapper });

    result.current({ kind: 'invalid', errors }, NAME_CHANGE);

    expect(dispatch).toHaveBeenCalledWith({ type: 'invalid', errors });
    expect(show).not.toHaveBeenCalled();
  });

  it('shows and dispatches nothing when the session ended', () => {
    const { options, show, dispatch } = partsOf();
    const { result } = renderHook(() => useSaveSettle(options), { wrapper });

    result.current({ kind: 'failed', reason: 'session_ended' }, NAME_CHANGE);

    expect(show).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });
});
