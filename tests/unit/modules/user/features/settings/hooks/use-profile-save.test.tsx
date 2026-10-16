import { act, renderHook, waitFor } from '@testing-library/react';
import { StrictMode, type JSX, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useProfileSave from '@/modules/user/features/settings/hooks/use-profile-save';
import type {
  ProfileFailureReason,
  ProfileUpdateOutcome,
} from '@/modules/user/features/settings/types/user-profile';
import ProfileChangeDetector from '@/modules/user/features/settings/utils/profile-change-detector';
import { buildProfileFormValues, buildUserEntity } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

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

interface Harness {
  readonly props: ProfileFormProps;
  readonly adopt: jest.Mock;
  readonly show: jest.Mock;
  readonly click: jest.Mock;
  readonly focus: jest.Mock;
}

const harness = (): Harness => {
  const adopt = jest.fn();
  const show = jest.fn();
  const click = jest.fn();
  const focus = jest.fn();
  const props: ProfileFormProps = {
    user,
    adoption: { adopt, confirm: jest.fn() },
    version: 0,
    refocus: false,
    toasts: { toasts: { items: [] }, announcement: '', alert: '', show, dismiss: jest.fn() },
    saveRef: { current: { click, focus } as unknown as HTMLButtonElement },
  };
  return { props, adopt, show, click, focus };
};

const nameChange = (): ReturnType<typeof buildProfileFormValues> =>
  buildProfileFormValues({ fullName: 'Нове Імʼя', email: user.email, newPassword: '' });

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

  it('exposes one detector for the whole mount and an empty initial state', () => {
    const { props } = harness();

    const { result, rerender } = renderHook(() => useProfileSave(props), { wrapper });
    const { changes } = result.current;
    rerender();

    expect(changes).toBeInstanceOf(ProfileChangeDetector);
    expect(result.current.changes).toBe(changes);
    expect(result.current.state).toEqual({
      fieldErrors: { items: [] },
      noChanges: false,
      settled: 0,
    });
    expect(result.current.isSubmitting).toBe(false);
  });

  it('sends nothing and shows the no-change state when nothing changed', async () => {
    const { props, show } = harness();
    const { result } = renderHook(() => useProfileSave(props), { wrapper });

    await act(async () => {
      result.current.save(
        buildProfileFormValues({ fullName: user.fullName, email: user.email, newPassword: '' })
      );
    });

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(show).not.toHaveBeenCalled();
    expect(result.current.state).toEqual({
      fieldErrors: { items: [] },
      noChanges: true,
      settled: 0,
    });
  });

  it('sends one update for two saves before the first settles and flags isSubmitting', async () => {
    const { props } = harness();
    let settle: (outcome: ProfileUpdateOutcome) => void = () => undefined;
    mockUpdate.mockReturnValue(new Promise((resolve) => (settle = resolve)));
    const { result } = renderHook(() => useProfileSave(props), { wrapper });

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
    const { props } = harness();
    const { rerender } = renderHook(() => useProfileSave(props), { wrapper });

    rerender();
    rerender();

    expect(new Set(mockSubmitRuns).size).toBe(1);
  });

  it('adopts the entity, shows a draft per changed aspect and bumps settled', async () => {
    const { props, adopt, show } = harness();
    const entity = buildUserEntity();
    mockUpdate.mockResolvedValue({ kind: 'ok', user: entity });
    const { result } = renderHook(() => useProfileSave(props), { wrapper });

    await act(async () => {
      result.current.save(
        buildProfileFormValues({
          fullName: 'Нове Імʼя',
          email: 'new@example.com',
          newPassword: 'Next12345',
        })
      );
    });

    expect(adopt).toHaveBeenCalledWith(entity);
    expect(show).toHaveBeenCalledTimes(1);
    expect(show).toHaveBeenCalledWith({
      items: [
        { tone: 'success', message: 'Зміни збережено' },
        { tone: 'success', message: 'Ми надіслали посилання для підтвердження на нову адресу' },
        { tone: 'success', message: 'Ви успішно змінили пароль' },
      ],
    });
    expect(result.current.state.settled).toBe(1);
  });

  it.each([
    [{ email: 'new@example.com' }, ['Ми надіслали посилання для підтвердження на нову адресу']],
    [{ newPassword: 'Next12345' }, ['Ви успішно змінили пароль']],
    [{ fullName: 'Нове Імʼя' }, ['Зміни збережено']],
  ])('shows only the drafts of the changed aspects for %j', async (overrides, messages) => {
    const { props, show } = harness();
    mockUpdate.mockResolvedValue(okOutcome());
    const { result } = renderHook(() => useProfileSave(props), { wrapper });

    await act(async () => {
      result.current.save(
        buildProfileFormValues({
          fullName: user.fullName,
          email: user.email,
          newPassword: '',
          ...overrides,
        })
      );
    });

    const [drafts] = show.mock.calls[0] as [{ items: Array<{ message: string }> }];
    expect(drafts.items.map((item) => item.message)).toEqual(messages);
  });

  it('publishes the field errors in DOM order without a toast or a settled bump', async () => {
    const { props, show } = harness();
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
    const { result } = renderHook(() => useProfileSave(props), { wrapper });

    await act(async () => {
      result.current.save(nameChange());
    });

    expect(result.current.state.fieldErrors.items.map((error) => error.field)).toEqual([
      'fullName',
      'email',
      'currentPassword',
      'newPassword',
    ]);
    expect(result.current.state.settled).toBe(0);
    expect(result.current.state.noChanges).toBe(false);
    expect(show).not.toHaveBeenCalled();
  });

  it('shows the transient failure with a retry that clicks the save button', async () => {
    const { props, show, adopt, click } = harness();
    mockUpdate.mockResolvedValue(failedOutcome('transient'));
    const { result } = renderHook(() => useProfileSave(props), { wrapper });

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

  it.each([
    ['rejected', 'Не вдалося зберегти зміни. Спробуйте пізніше.'],
    ['rate_limited', 'Забагато спроб. Спробуйте пізніше.'],
  ] as const)('shows the %s failure without an action', async (reason, message) => {
    const { props, show } = harness();
    mockUpdate.mockResolvedValue(failedOutcome(reason));
    const { result } = renderHook(() => useProfileSave(props), { wrapper });

    await act(async () => {
      result.current.save(nameChange());
    });

    expect(show).toHaveBeenCalledWith({
      items: [{ tone: 'error', message, action: undefined }],
    });
    expect(result.current.state.settled).toBe(1);
  });

  it('does nothing when the session ended', async () => {
    const { props, show, adopt } = harness();
    mockUpdate.mockResolvedValue(failedOutcome('session_ended'));
    const { result } = renderHook(() => useProfileSave(props), { wrapper });

    await act(async () => {
      result.current.save(nameChange());
    });

    expect(show).not.toHaveBeenCalled();
    expect(adopt).not.toHaveBeenCalled();
    expect(result.current.state).toEqual({
      fieldErrors: { items: [] },
      noChanges: false,
      settled: 0,
    });
  });

  it('publishes nothing when the component unmounts while the request is in flight', async () => {
    const { props, show, adopt } = harness();
    let settle: (outcome: ProfileUpdateOutcome) => void = () => undefined;
    mockUpdate.mockReturnValue(new Promise((resolve) => (settle = resolve)));
    const { result, unmount } = renderHook(() => useProfileSave(props), { wrapper });
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
    const { result } = renderHook(() => useProfileSave(props), { wrapper: strict });

    await act(async () => {
      result.current.save(nameChange());
    });

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
  });

  it('clears the field errors and the no-change status', async () => {
    const { props } = harness();
    mockUpdate.mockResolvedValue({
      kind: 'invalid',
      errors: { items: [{ field: 'currentPassword', reason: 'password_wrong' }] },
    });
    const { result } = renderHook(() => useProfileSave(props), { wrapper });
    await act(async () => {
      result.current.save(nameChange());
    });

    act(() => result.current.clear());

    expect(result.current.state).toEqual({
      fieldErrors: { items: [] },
      noChanges: false,
      settled: 0,
    });
  });

  it('drops field errors on the next settled save and no-change on an invalid one', async () => {
    const { props } = harness();
    const { result } = renderHook(() => useProfileSave(props), { wrapper });
    await act(async () => {
      result.current.save(
        buildProfileFormValues({ fullName: user.fullName, email: user.email, newPassword: '' })
      );
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
});
