import { act, renderHook, type RenderHookResult, waitFor } from '@testing-library/react';
import * as React from 'react';
import { StrictMode, type JSX, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useProfileSave from '@/modules/user/features/settings/hooks/use-profile-save';
import type { ProfileSave } from '@/modules/user/features/settings/types/hooks/use-profile-save';
import type {
  ProfileFailureReason,
  ProfileFormValues,
  ProfileUpdateOutcome,
} from '@/modules/user/features/settings/types/user-profile';
import ProfileChangeDetector from '@/modules/user/features/settings/utils/profile-change-detector';
import {
  buildEmail,
  buildFullName,
  buildPassword,
  buildProfileFormValues,
  buildUserEntity,
} from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import loadIsolated from '@tests/unit/utils/isolated-module';

const NEW_FULL_NAME = buildFullName();
const NEW_EMAIL = buildEmail();
const NEW_PASSWORD = buildPassword();

const mockUpdate = jest.fn();
const mockProvider = { update: mockUpdate };
const mockSubmitRuns: unknown[] = [];

jest.mock('@/providers/di', () => ({
  __esModule: true,
  useService: (): object => mockProvider,
}));

jest.mock('@/hooks/use-abortable-submit', () => {
  const actual = jest.requireActual('@/hooks/use-abortable-submit');
  return {
    __esModule: true,
    default: (run: unknown): unknown => {
      mockSubmitRuns.push(run);
      return actual.default(run);
    },
  };
});

const user = buildUserEntity({ fullName: 'Олена Петренко', email: 'olena@example.com' });

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>{children}</I18nextProvider>
);

type ProfileFormProps = Parameters<typeof useProfileSave>[0];
type ProfileSection = Parameters<typeof useProfileSave>[1];

interface Harness {
  readonly props: ProfileFormProps;
  readonly adopt: jest.Mock;
  readonly show: jest.Mock;
  readonly button: HTMLButtonElement;
  readonly input: HTMLInputElement;
  readonly click: jest.SpyInstance;
  readonly focus: jest.SpyInstance;
}

const harness = (): Harness => {
  const adopt = jest.fn();
  const show = jest.fn();
  const form = document.createElement('form');
  const input = document.createElement('input');
  input.id = 'fullName';
  const button = document.createElement('button');
  button.type = 'button';
  form.append(input, button);
  document.body.append(form);
  const props: ProfileFormProps = {
    user,
    adoption: {
      adopt,
      confirm: jest.fn(),
      isCurrent: (): boolean => true,
      revision: (): number => 0,
    },
    toasts: { toasts: { items: [] }, announcement: '', alert: '', show, dismiss: jest.fn() },
    saveRef: { current: null },
    headingRef: { current: null },
  };
  return {
    props,
    adopt,
    show,
    button,
    input,
    click: jest.spyOn(button, 'click'),
    focus: jest.spyOn(button, 'focus'),
  };
};

const mountSave = (
  { props, button }: Pick<Harness, 'props' | 'button'>,
  section: ProfileSection = 'fullName'
): RenderHookResult<ProfileSave, unknown> => {
  const view = renderHook(() => useProfileSave(props, section), { wrapper });
  view.result.current.buttonRef.current = button;
  return view;
};

const nameChange = (): ProfileFormValues =>
  buildProfileFormValues({ fullName: NEW_FULL_NAME, email: user.email, newPassword: '' });

const unchangedValues = (): ProfileFormValues =>
  buildProfileFormValues({ fullName: user.fullName, email: user.email, newPassword: '' });

const okOutcome = (): ProfileUpdateOutcome => ({ kind: 'ok', user: buildUserEntity() });

const failedOutcome = (reason: ProfileFailureReason): ProfileUpdateOutcome => ({
  kind: 'failed',
  reason,
});

describe('useProfileSave', () => {
  beforeEach(() => {
    mockUpdate.mockReset();
    mockSubmitRuns.length = 0;
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('exposes one detector for the whole mount and an empty initial state', () => {
    const { result, rerender } = mountSave(harness());
    const { changes } = result.current;
    rerender();

    expect(changes).toBeInstanceOf(ProfileChangeDetector);
    expect(result.current.changes).toBe(changes);
    expect(result.current.state).toEqual({
      fieldErrors: { items: [] },
      noChanges: false,
      noChangesMarked: false,
      settled: 0,
      saved: 0,
      lastSettleSaved: false,
      cleared: 0,
      attempts: 0,
    });
    expect(result.current.isSubmitting).toBe(false);
  });

  it('sends nothing and shows the no-change state when nothing changed', async () => {
    const parts = harness();
    const { show } = parts;
    const { result } = mountSave(parts);

    await act(async () => {
      result.current.save(unchangedValues());
    });

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(show).not.toHaveBeenCalled();
    expect(result.current.state).toEqual({
      fieldErrors: { items: [] },
      noChanges: true,
      noChangesMarked: false,
      settled: 0,
      saved: 0,
      lastSettleSaved: false,
      cleared: 0,
      attempts: 0,
    });
  });

  it('clears the no-change state when a later Save is blocked by client validation', async () => {
    const parts = harness();
    const { show } = parts;
    const { result } = mountSave(parts);
    await act(async () => {
      result.current.save(unchangedValues());
    });

    act(() => result.current.block());

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(show).not.toHaveBeenCalled();
    expect(result.current.state).toEqual({
      fieldErrors: { items: [] },
      noChanges: false,
      noChangesMarked: true,
      settled: 0,
      saved: 0,
      lastSettleSaved: false,
      cleared: 0,
      attempts: 0,
    });
  });

  it('flips the no-change mark on every repeated no-change save', async () => {
    const parts = harness();
    const { result } = mountSave(parts);
    const unchanged = unchangedValues();
    const press = (): boolean => {
      act(() => {
        result.current.save(unchanged);
      });
      return result.current.state.noChangesMarked;
    };

    const marks = [press(), press(), press()];

    expect(marks).toEqual([false, true, false]);
    expect(result.current.state.noChanges).toBe(true);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('drops the no-change mark once a changed save follows', async () => {
    const parts = harness();
    mockUpdate.mockResolvedValue(okOutcome());
    const { result } = mountSave(parts);
    const unchanged = unchangedValues();
    act(() => {
      result.current.save(unchanged);
    });
    await act(async () => {
      result.current.save(nameChange());
    });

    act(() => {
      result.current.save(unchanged);
    });

    expect(result.current.state.noChanges).toBe(true);
    expect(result.current.state.noChangesMarked).toBe(false);
  });

  it('resets the field errors and the no-change status as soon as a request starts', async () => {
    const parts = harness();
    mockUpdate.mockResolvedValueOnce({
      kind: 'invalid',
      errors: { items: [{ field: 'email', reason: 'email_taken' }] },
    });
    const { result } = mountSave(parts);
    await act(async () => {
      result.current.save(nameChange());
    });
    expect(result.current.state.fieldErrors.items).toHaveLength(1);
    expect(result.current.state.attempts).toBe(1);
    let settle: (outcome: ProfileUpdateOutcome) => void = () => undefined;
    mockUpdate.mockReturnValueOnce(new Promise((resolve) => (settle = resolve)));

    act(() => {
      result.current.save(nameChange());
    });

    expect(result.current.state.fieldErrors).toEqual({ items: [] });
    expect(result.current.state.noChanges).toBe(false);
    expect(result.current.state.attempts).toBe(2);
    await act(async () =>
      settle({ kind: 'invalid', errors: { items: [{ field: 'email', reason: 'email_taken' }] } })
    );
    expect(result.current.state.fieldErrors).toEqual({
      items: [{ field: 'email', reason: 'email_taken' }],
    });
    expect(result.current.state.attempts).toBe(2);
  });

  it('sends one update for two saves before the first settles and flags isSubmitting', async () => {
    const parts = harness();
    let settle: (outcome: ProfileUpdateOutcome) => void = () => undefined;
    mockUpdate.mockReturnValue(new Promise((resolve) => (settle = resolve)));
    const { result } = mountSave(parts);

    act(() => {
      result.current.save(nameChange());
      result.current.save(nameChange());
    });

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(result.current.isSubmitting).toBe(true);
    await act(async () => settle(okOutcome()));
    expect(result.current.isSubmitting).toBe(false);
  });

  it('keeps the run handed to useAbortableSubmit stable across renders', () => {
    const parts = harness();
    const { rerender } = mountSave(parts);

    rerender();
    rerender();

    expect(new Set(mockSubmitRuns).size).toBe(1);
  });

  it.each([
    ['fullName', 'Зміни збережено'],
    ['email', 'Ми надіслали посилання для підтвердження на нову адресу'],
    ['password', 'Ви успішно змінили пароль'],
  ] as const)(
    'adopts the entity, shows the %s draft alone and counts the saved settle',
    async (section, message) => {
      const parts = harness();
      const { adopt, show } = parts;
      const entity = buildUserEntity();
      mockUpdate.mockResolvedValue({ kind: 'ok', user: entity });
      const { result } = mountSave(parts, section);

      await act(async () => {
        result.current.save(
          buildProfileFormValues({
            fullName: NEW_FULL_NAME,
            email: NEW_EMAIL,
            newPassword: NEW_PASSWORD,
          })
        );
      });

      expect(adopt).toHaveBeenCalledWith(entity);
      expect(show).toHaveBeenCalledTimes(1);
      expect(show).toHaveBeenCalledWith({ items: [{ tone: 'success', message }] });
      expect(result.current.state.settled).toBe(1);
      expect(result.current.state.saved).toBe(1);
      expect(result.current.state.lastSettleSaved).toBe(true);
    }
  );

  it.each([
    ['fullName', 'fullNamePassword', 'fullName'],
    ['email', 'emailPassword', 'email'],
    ['password', 'currentPassword', 'newPassword'],
  ] as const)(
    'sends only what the %s section owns, with its own password',
    async (section, passwordField, ownField) => {
      const parts = harness();
      mockUpdate.mockResolvedValue(okOutcome());
      const values = buildProfileFormValues({
        fullName: NEW_FULL_NAME,
        email: NEW_EMAIL,
        newPassword: NEW_PASSWORD,
      });
      const { result } = mountSave(parts, section);

      await act(async () => {
        result.current.save(values);
      });

      expect(mockUpdate.mock.calls[0]?.[0]).toEqual({
        id: user.id,
        currentPassword: values[passwordField],
        [ownField]: values[ownField],
      });
    }
  );

  it('hands the save ref to the section button as soon as a request starts', () => {
    const parts = harness();
    mockUpdate.mockReturnValue(new Promise(() => undefined));
    const { result } = mountSave(parts);

    expect(parts.props.saveRef.current).toBeNull();
    act(() => {
      result.current.save(nameChange());
    });

    expect(parts.props.saveRef.current).toBe(parts.button);
  });

  it('leaves the save ref alone when nothing changed', () => {
    const parts = harness();
    const { result } = mountSave(parts);

    act(() => {
      result.current.save(unchangedValues());
    });

    expect(parts.props.saveRef.current).toBeNull();
  });

  it('moves focus to the save button once per settled password save', async () => {
    const parts = harness();
    const { focus } = parts;
    mockUpdate.mockResolvedValueOnce(okOutcome()).mockResolvedValueOnce(failedOutcome('rejected'));
    const { result } = mountSave(parts, 'password');
    const values = buildProfileFormValues({ newPassword: NEW_PASSWORD });

    await act(async () => {
      result.current.save(values);
    });
    expect(focus).toHaveBeenCalledTimes(1);
    await act(async () => {
      result.current.save(values);
    });

    expect(result.current.state.settled).toBe(2);
    expect(focus).toHaveBeenCalledTimes(2);
  });

  it('moves focus to the input when a name save succeeded and to Save when it failed', async () => {
    const parts = harness();
    mockUpdate.mockResolvedValueOnce(okOutcome()).mockResolvedValueOnce(failedOutcome('rejected'));
    const { result } = mountSave(parts);

    await act(async () => {
      result.current.save(nameChange());
    });

    expect(parts.input).toHaveFocus();
    expect(parts.props.saveRef.current).toBe(parts.input);
    expect(result.current.state.saved).toBe(1);
    expect(result.current.state.lastSettleSaved).toBe(true);

    await act(async () => {
      result.current.save(nameChange());
    });

    expect(parts.button).toHaveFocus();
    expect(parts.props.saveRef.current).toBe(parts.button);
    expect(result.current.state.settled).toBe(2);
    expect(result.current.state.saved).toBe(1);
    expect(result.current.state.lastSettleSaved).toBe(false);
  });

  it('keeps the last settle flag through a later clear and a later pending save', async () => {
    const parts = harness();
    mockUpdate.mockResolvedValueOnce(okOutcome()).mockReturnValue(new Promise(() => undefined));
    const { result } = mountSave(parts);
    await act(async () => {
      result.current.save(nameChange());
    });

    act(() => result.current.clear());
    expect(result.current.state.lastSettleSaved).toBe(true);
    act(() => {
      result.current.save(nameChange());
    });

    expect(result.current.state.lastSettleSaved).toBe(true);
    expect(result.current.state.saved).toBe(1);
    expect(result.current.state.settled).toBe(1);
  });

  it('publishes the field errors as the outcome orders them, without a toast', async () => {
    const parts = harness();
    const { show, focus } = parts;
    mockUpdate.mockResolvedValue({
      kind: 'invalid',
      errors: {
        items: [
          { field: 'newPassword', reason: 'new_password_rejected' },
          { field: 'email', reason: 'email_taken' },
          { field: 'currentPassword', reason: 'password_wrong' },
          { field: 'fullName', reason: 'name_rejected' },
        ],
      },
    });
    const { result } = mountSave(parts);

    await act(async () => {
      result.current.save(nameChange());
    });

    expect(result.current.state.fieldErrors.items.map((error) => error.field)).toEqual([
      'newPassword',
      'email',
      'currentPassword',
      'fullName',
    ]);
    expect(result.current.state.settled).toBe(0);
    expect(result.current.state.noChanges).toBe(false);
    expect(show).not.toHaveBeenCalled();
    expect(focus).not.toHaveBeenCalled();
  });

  it('shows the transient failure with a retry that clicks the save button', async () => {
    const parts = harness();
    const { show, adopt, click } = parts;
    mockUpdate.mockResolvedValue(failedOutcome('transient'));
    const { result } = mountSave(parts);

    await act(async () => {
      result.current.save(nameChange());
    });

    const [drafts] = show.mock.calls[0] as [
      { items: Array<{ message: string; action?: { label: string; onActivate: () => void } }> },
    ];
    expect(drafts.items).toHaveLength(1);
    expect(drafts.items[0]?.message).toBe(
      'Не вдалося зберегти зміни. Перевірте з’єднання та спробуйте ще раз.'
    );
    expect(drafts.items[0]?.action?.label).toBe('Спробувати ще раз');
    drafts.items[0]?.action?.onActivate();
    expect(click).toHaveBeenCalledTimes(1);
    expect(adopt).not.toHaveBeenCalled();
    expect(result.current.state.settled).toBe(1);
  });

  it('lets the transient retry do nothing once the save button is gone', async () => {
    const { props, show } = harness();
    mockUpdate.mockResolvedValue(failedOutcome('transient'));
    const { result } = renderHook(() => useProfileSave(props, 'fullName'), { wrapper });

    await act(async () => {
      result.current.save(nameChange());
    });

    const [drafts] = show.mock.calls[0] as [
      { items: Array<{ action?: { onActivate: () => void } }> },
    ];
    expect(props.saveRef.current).toBeNull();
    expect(() => drafts.items[0]?.action?.onActivate()).not.toThrow();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(result.current.state.settled).toBe(1);
  });

  it.each([
    ['rejected', 'Не вдалося зберегти зміни. Спробуйте пізніше.'],
    ['rate_limited', 'Забагато спроб. Спробуйте пізніше.'],
  ] as const)('shows the %s failure without an action', async (reason, message) => {
    const parts = harness();
    const { show } = parts;
    mockUpdate.mockResolvedValue(failedOutcome(reason));
    const { result } = mountSave(parts);

    await act(async () => {
      result.current.save(nameChange());
    });

    expect(show).toHaveBeenCalledWith({
      items: [{ tone: 'error', message, action: undefined }],
    });
    expect(result.current.state.settled).toBe(1);
  });

  it('does nothing when the session ended', async () => {
    const parts = harness();
    const { show, adopt } = parts;
    mockUpdate.mockResolvedValue(failedOutcome('session_ended'));
    const { result } = mountSave(parts);

    await act(async () => {
      result.current.save(nameChange());
    });

    expect(show).not.toHaveBeenCalled();
    expect(adopt).not.toHaveBeenCalled();
    expect(result.current.state).toEqual({
      fieldErrors: { items: [] },
      noChanges: false,
      noChangesMarked: false,
      settled: 0,
      saved: 0,
      lastSettleSaved: false,
      cleared: 0,
      attempts: 1,
    });
  });

  it('publishes nothing when the component unmounts while the request is in flight', async () => {
    const parts = harness();
    const { show, adopt } = parts;
    let settle: (outcome: ProfileUpdateOutcome) => void = () => undefined;
    mockUpdate.mockReturnValue(new Promise((resolve) => (settle = resolve)));
    const { result, unmount } = mountSave(parts);
    act(() => {
      result.current.save(nameChange());
    });
    const signal = mockUpdate.mock.calls[0]?.[1] as AbortSignal;

    unmount();
    await act(async () => settle(okOutcome()));

    expect(signal.aborted).toBe(true);
    expect(show).not.toHaveBeenCalled();
    expect(adopt).not.toHaveBeenCalled();
  });

  it('sends one request for a save under StrictMode', async () => {
    const { props } = harness();
    mockUpdate.mockResolvedValue(okOutcome());
    const strict = ({ children }: { children: ReactNode }): JSX.Element => (
      <StrictMode>{wrapper({ children })}</StrictMode>
    );
    const { result } = renderHook(() => useProfileSave(props, 'fullName'), { wrapper: strict });

    await act(async () => {
      result.current.save(nameChange());
    });

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
  });

  it('clears the field errors and the no-change status', async () => {
    const parts = harness();
    mockUpdate.mockResolvedValue({
      kind: 'invalid',
      errors: { items: [{ field: 'currentPassword', reason: 'password_wrong' }] },
    });
    const { result } = mountSave(parts);
    await act(async () => {
      result.current.save(nameChange());
    });

    act(() => result.current.clear());

    expect(result.current.state).toEqual({
      fieldErrors: { items: [] },
      noChanges: false,
      noChangesMarked: false,
      settled: 0,
      saved: 0,
      lastSettleSaved: false,
      cleared: 1,
      attempts: 1,
    });
    act(() => result.current.clear());
    expect(result.current.state.cleared).toBe(2);
  });

  it('drops field errors on the next settled save and no-change on an invalid one', async () => {
    const parts = harness();
    const { result } = mountSave(parts);
    await act(async () => {
      result.current.save(unchangedValues());
    });
    expect(result.current.state.noChanges).toBe(true);
    mockUpdate.mockResolvedValueOnce({
      kind: 'invalid',
      errors: { items: [{ field: 'fullName', reason: 'name_rejected' }] },
    });
    await act(async () => {
      result.current.save(nameChange());
    });
    expect(result.current.state.noChanges).toBe(false);
    mockUpdate.mockResolvedValueOnce(okOutcome());

    await act(async () => {
      result.current.save(nameChange());
    });

    expect(result.current.state.fieldErrors).toEqual({ items: [] });
    expect(result.current.state.settled).toBe(1);
  });
  describe('module-level values evaluated inside the test', () => {
    const loadKeyed = (): Promise<typeof useProfileSave> =>
      loadIsolated(async () => {
        jest.doMock('react', () => React);
        jest.doMock('react-i18next', () => ({
          useTranslation: (): { t: (key: string) => string } => ({ t: (key) => key }),
        }));
        return (await import('@/modules/user/features/settings/hooks/use-profile-save')).default;
      });

    it('starts with no-change flags off', async () => {
      const fresh = await loadKeyed();
      const { props } = harness();

      const { result } = renderHook(() => fresh(props, 'fullName'));

      expect(result.current.state.noChanges).toBe(false);
      expect(result.current.state.noChangesMarked).toBe(false);
    });

    it('starts with the whole form state empty, including the last settle flag', async () => {
      const fresh = await loadKeyed();
      const { props } = harness();

      const { result } = renderHook(() => fresh(props, 'fullName'));

      expect(result.current.state).toEqual({
        fieldErrors: { items: [] },
        noChanges: false,
        noChangesMarked: false,
        settled: 0,
        saved: 0,
        lastSettleSaved: false,
        cleared: 0,
        attempts: 0,
      });
      expect(result.current.state.lastSettleSaved).toBe(false);
    });

    it.each([
      ['fullName', 'settings.toasts.saved'],
      ['email', 'settings.toasts.email_sent'],
      ['password', 'settings.toasts.password_changed'],
    ] as const)('shows the %s success toast with its exact key', async (section, key) => {
      const fresh = await loadKeyed();
      const { props, show } = harness();
      mockUpdate.mockResolvedValue(okOutcome());
      const { result } = renderHook(() => fresh(props, section));

      await act(async () => {
        result.current.save(
          buildProfileFormValues({
            fullName: NEW_FULL_NAME,
            email: NEW_EMAIL,
            newPassword: NEW_PASSWORD,
          })
        );
      });

      expect(show).toHaveBeenCalledTimes(1);
      expect(show.mock.calls[0]?.[0]).toEqual({ items: [{ tone: 'success', message: key }] });
    });

    it.each([
      ['transient', 'settings.toasts.save_failed_transient'],
      ['rejected', 'settings.toasts.save_failed'],
      ['rate_limited', 'settings.toasts.rate_limited'],
    ] as const)('shows the exact %s failure key', async (reason, key) => {
      const fresh = await loadKeyed();
      const { props, show } = harness();
      mockUpdate.mockResolvedValue(failedOutcome(reason));
      const { result } = renderHook(() => fresh(props, 'fullName'));

      await act(async () => {
        result.current.save(nameChange());
      });

      expect(show).toHaveBeenCalledTimes(1);
      const drafts = show.mock.calls[0]?.[0] as { items: { tone: string; message: string }[] };
      expect(drafts.items).toHaveLength(1);
      expect(drafts.items[0]).toMatchObject({ tone: 'error', message: key });
    });
  });
});
