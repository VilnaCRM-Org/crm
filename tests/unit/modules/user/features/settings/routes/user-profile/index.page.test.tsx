import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse } from 'msw';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import useConnectivityStore from '@/lib/connectivity/use-connectivity-store';
import UserProfile from '@/modules/user/features/settings/routes/user-profile';
import useAuthStore, { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import {
  buildEmail,
  buildFullName,
  buildPassword,
  buildToken,
  buildUserIri,
  buildUserNode,
} from '@tests/builders';
import { answerProfileOperation } from '@tests/integration/mocks/profile-operations';
import server from '@tests/integration/mocks/server';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import SessionOutlet from '@tests/unit/utils/session-outlet';

const NAME = 'Ваше ПІБ';
const EMAIL = 'E-mail';
const NAME_PASSWORD = 'Пароль для зміни імені';
const EMAIL_PASSWORD = 'Пароль для зміни пошти';
const CURRENT = 'Поточний пароль';
const NEW = 'Новий пароль';
const SAVE_NAME = 'Зберегти ім’я';
const SAVE_EMAIL = 'Зберегти пошту';
const SAVE_PASSWORD = 'Зберегти зміни';
const SAVED = 'Зміни збережено';
const EMAIL_SENT = 'Ми надіслали посилання для підтвердження на нову адресу';
const PASSWORD_CHANGED = 'Ви успішно змінили пароль';
const GENERIC = 'Не вдалося зберегти зміни. Спробуйте пізніше.';
const TRANSIENT = 'Не вдалося зберегти зміни. Перевірте з’єднання та спробуйте ще раз.';
const RETRY = 'Спробувати ще раз';

const NEW_EMAIL = buildEmail();
const NEW_NAME = buildFullName();
const NEW_PASSWORD = buildPassword();
const TAKEN_EMAIL = buildEmail();

const loaded = buildUserNode({
  id: buildUserIri(),
  initials: buildFullName(),
  email: buildEmail(),
  confirmed: true,
});

const graphQLError = (error: object): Response =>
  HttpResponse.json({ data: null, errors: [error] });

const saved = (overrides = {}): Response =>
  HttpResponse.json({ data: { updateUser: { user: { ...loaded, ...overrides } } } });

const mount = async (): Promise<void> => {
  answerProfileOperation('CurrentUser', {
    respond: () => HttpResponse.json({ data: { users: { edges: [{ node: loaded }] } } }),
  });
  render(
    <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>
      <main>
        <MemoryRouter>
          <SessionOutlet>
            <UserProfile />
          </SessionOutlet>
        </MemoryRouter>
      </main>
    </I18nextProvider>
  );
  await screen.findByRole('heading', { level: 2, name: 'Особисті дані' });
};

const field = (label: string): HTMLInputElement => screen.getByLabelText(label) as HTMLInputElement;

const saveButton = (name = SAVE_NAME): HTMLElement => screen.getByRole('button', { name });

const typeInto = async (label: string, text: string): Promise<void> => {
  await userEvent.type(field(label), text);
};

const editName = async (): Promise<void> => {
  await userEvent.clear(field(NAME));
  await typeInto(NAME, NEW_NAME);
};

const editEmail = async (email = NEW_EMAIL): Promise<void> => {
  await userEvent.clear(field(EMAIL));
  await typeInto(EMAIL, email);
};

const submitWith = async (
  answer: () => Response,
  password = NAME_PASSWORD,
  save = SAVE_NAME
): Promise<ReturnType<typeof answerProfileOperation>> => {
  const answered = answerProfileOperation('UpdateUser', { respond: answer });
  await typeInto(password, 'abc');
  await userEvent.click(saveButton(save));
  return answered;
};

const submitEmailWith = (
  answer: () => Response
): Promise<ReturnType<typeof answerProfileOperation>> =>
  submitWith(answer, EMAIL_PASSWORD, SAVE_EMAIL);

const submitPasswordWith = async (
  answer: () => Response
): Promise<ReturnType<typeof answerProfileOperation>> => {
  await typeInto(NEW, NEW_PASSWORD);
  return submitWith(answer, CURRENT, SAVE_PASSWORD);
};

const TOAST_TEXT = /Зміни збережено|Ми надіслали|Ви успішно|Не вдалося зберегти|Забагато/;

const toastTexts = (): string[] =>
  screen
    .queryAllByText(TOAST_TEXT)
    .filter((node) => node.getAttribute('role') === null)
    .map((node) => node.textContent ?? '');

describe('settings page save outcomes (page)', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  beforeEach(() => {
    useAuthStore.setState({ ...CLEARED_AUTH_STATE, token: buildToken() });
    useConnectivityStore.setState({ online: true });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
    useAuthStore.setState(CLEARED_AUTH_STATE);
    useConnectivityStore.setState({ online: true });
  });

  it('saves a name: one toast announced once, focus on the input, payload shown', async () => {
    await mount();
    await editName();
    answerProfileOperation('UpdateUser', { respond: () => saved({ initials: NEW_NAME }) });
    await typeInto(NAME_PASSWORD, 'abc');

    await userEvent.click(saveButton());

    await screen.findByRole('button', { name: 'Закрити сповіщення' });
    expect(toastTexts()).toEqual([expect.stringContaining(SAVED)]);
    const regions = screen
      .getAllByRole('status')
      .filter((node) => node.textContent?.includes(SAVED));
    expect(regions).toHaveLength(1);
    await waitFor(() => expect(field(NAME)).toHaveFocus());
    expect(screen.getByText(NEW_NAME)).toBeVisible();
    expect(field(NAME)).toHaveValue(NEW_NAME);
    expect(screen.queryByLabelText(NAME_PASSWORD)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: SAVE_NAME })).not.toBeInTheDocument();
  });

  it('saves an e-mail and shows the confirmation-link toast', async () => {
    await mount();
    await editEmail();

    await submitEmailWith(() => saved({ email: NEW_EMAIL, confirmed: false }));

    expect(await screen.findByText(EMAIL_SENT)).toBeVisible();
    expect(field(EMAIL)).toHaveValue(NEW_EMAIL);
    await waitFor(() => expect(field(EMAIL)).toHaveFocus());
  });

  it('saves a password, empties the form and keeps focus on its Save', async () => {
    await mount();

    await submitPasswordWith(() => saved());

    expect(await screen.findByText(PASSWORD_CHANGED)).toBeVisible();
    await waitFor(() => expect(saveButton(SAVE_PASSWORD)).toHaveFocus());
    expect(field(CURRENT)).toHaveValue('');
    expect(field(NEW)).toHaveValue('');
  });

  it('sends one request when Save is activated twice before the answer', async () => {
    await mount();
    await editName();
    const answered = answerProfileOperation('UpdateUser', {
      delayMs: 30,
      respond: () => saved({ initials: NEW_NAME }),
    });
    await typeInto(NAME_PASSWORD, 'abc');

    await userEvent.click(saveButton());
    fireEvent.click(saveButton());

    await waitFor(() => expect(toastTexts()).toHaveLength(1));
    expect(answered).toHaveLength(1);
  });

  it('stacks one toast per save in order and keeps the drafts of the other forms', async () => {
    await mount();
    await editEmail();
    await typeInto(NEW, NEW_PASSWORD);
    await typeInto(CURRENT, 'kept');
    await editName();

    const name = await submitWith(() => saved({ initials: NEW_NAME }));
    await waitFor(() => expect(toastTexts()).toHaveLength(1));
    expect(field(EMAIL)).toHaveValue(NEW_EMAIL);
    expect(field(NEW)).toHaveValue(NEW_PASSWORD);
    expect(field(CURRENT)).toHaveValue('kept');
    await submitEmailWith(() => saved({ initials: NEW_NAME, email: NEW_EMAIL }));
    await waitFor(() => expect(toastTexts()).toHaveLength(2));
    await userEvent.click(saveButton(SAVE_PASSWORD));

    await waitFor(() => expect(toastTexts()).toHaveLength(3));
    expect(toastTexts().map((text) => text.replace(/\s+/g, ' '))).toEqual([
      expect.stringContaining(SAVED),
      expect.stringContaining(EMAIL_SENT),
      expect.stringContaining(PASSWORD_CHANGED),
    ]);
    expect(name).toHaveLength(1);
  });

  it.each([
    [
      'a 422 with the uniqueness message',
      { message: 'email: This email address is already registered', extensions: { status: 422 } },
    ],
    ['the message alone', { message: 'email: This email address is already registered' }],
    ['the Ukrainian message', { message: 'email: Ця email-адреса вже зареєстрована' }],
  ])('shows the e-mail taken error on the e-mail field for %s', async (_name, error) => {
    await mount();
    await editEmail(TAKEN_EMAIL);

    await submitEmailWith(() => graphQLError(error));

    expect(await screen.findByText('Електронна адреса вже використовується')).toBeVisible();
    await waitFor(() => expect(field(EMAIL)).toHaveFocus());
    expect(field(EMAIL)).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows the name error on the name and focuses it', async () => {
    await mount();
    await editName();

    await submitWith(() =>
      graphQLError({ message: 'initials: Bad name', extensions: { status: 422 } })
    );

    expect(
      await screen.findByText('Будь ласка, введіть повне ім’я у правильному форматі')
    ).toBeVisible();
    await waitFor(() => expect(field(NAME)).toHaveFocus());
  });

  it('shows the new-password error on the new password and focuses it', async () => {
    await mount();

    await submitPasswordWith(() =>
      graphQLError({ message: 'newPassword: Too weak', extensions: { status: 422 } })
    );

    expect(
      await screen.findByText('Пароль не відповідає вимогам. Перевірте правила нижче')
    ).toBeVisible();
    await waitFor(() => expect(field(NEW)).toHaveFocus());
  });

  it('shows the generic toast and no field error for a list with an unknown path', async () => {
    await mount();
    await editName();

    await submitWith(() =>
      graphQLError({
        message: 'initials: Bad name\nclientMutationId: Bad',
        extensions: { status: 422 },
      })
    );

    expect(await screen.findByText(GENERIC)).toBeVisible();
    expect(field(NAME)).not.toHaveAttribute('aria-invalid', 'true');
  });

  it.each([
    ['its English text', 'Old password is invalid'],
    ['its Ukrainian text', 'Старий пароль невірний'],
  ])('shows the wrong-password error on the name password for %s', async (_name, message) => {
    await mount();
    await editName();

    await submitWith(() => graphQLError({ message }));

    expect(await screen.findByText('Неправильний поточний пароль')).toBeVisible();
    await waitFor(() => expect(field(NAME_PASSWORD)).toHaveFocus());
    expect(field(NAME)).toHaveValue(NEW_NAME);
  });

  it('shows the wrong-password error on the current password of the password form', async () => {
    await mount();

    await submitPasswordWith(() => graphQLError({ message: 'Old password is invalid' }));

    expect(await screen.findByText('Неправильний поточний пароль')).toBeVisible();
    await waitFor(() => expect(field(CURRENT)).toHaveFocus());
    expect(field(NEW)).toHaveValue(NEW_PASSWORD);
  });

  it('shows the generic toast for an unknown message that carries FORBIDDEN', async () => {
    await mount();
    await editName();

    await submitWith(() =>
      graphQLError({ message: 'Something odd', extensions: { code: 'FORBIDDEN' } })
    );

    expect(await screen.findByText(GENERIC)).toBeVisible();
  });

  it('shows the generic toast for "Access Denied." and keeps the session', async () => {
    await mount();
    await editName();
    const { token } = useAuthStore.getState();

    await submitWith(() =>
      graphQLError({ message: 'Access Denied.', extensions: { code: 'FORBIDDEN', status: 403 } })
    );

    expect(await screen.findByText(GENERIC)).toBeVisible();
    expect(screen.queryByRole('button', { name: RETRY })).not.toBeInTheDocument();
    await waitFor(() => expect(saveButton()).toHaveFocus());
    expect(field(NAME)).toHaveValue(NEW_NAME);
    expect(useAuthStore.getState().token).toBe(token);
  });

  it('shows the rate-limit toast without an action for an HTTP 429', async () => {
    await mount();
    await editName();

    await submitWith(() => new HttpResponse(null, { status: 429 }));

    expect(await screen.findByText('Забагато спроб. Спробуйте пізніше.')).toBeVisible();
    expect(screen.queryByRole('button', { name: RETRY })).not.toBeInTheDocument();
  });

  it.each([
    ['a 503', (): Response => new HttpResponse(null, { status: 503 })],
    ['no answer', (): Response => HttpResponse.error()],
  ])('offers a retry for %s that submits once more and ends on the input', async (_n, fail) => {
    await mount();
    await editName();
    let sent = 0;
    const answered = answerProfileOperation('UpdateUser', {
      respond: () => {
        sent += 1;
        return sent === 1 ? fail() : saved({ initials: NEW_NAME });
      },
    });
    await typeInto(NAME_PASSWORD, 'abc');
    await userEvent.click(saveButton());
    expect(await screen.findByText(TRANSIENT)).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: RETRY }));

    await waitFor(() => expect(answered).toHaveLength(2));
    await waitFor(() => expect(toastTexts()).toEqual([expect.stringContaining(SAVED)]));
    expect(screen.queryByText(TRANSIENT)).not.toBeInTheDocument();
    await waitFor(() => expect(field(NAME)).toHaveFocus());
  });

  it('sends nothing when the retry is activated while offline', async () => {
    await mount();
    await editName();
    const answered = await submitWith(() => new HttpResponse(null, { status: 503 }));
    await screen.findByText(TRANSIENT);
    act(() => useConnectivityStore.setState({ online: false }));

    await userEvent.click(await screen.findByRole('button', { name: RETRY }));

    expect(saveButton()).toBeDisabled();
    expect(answered).toHaveLength(1);
  });

  it('shows nothing for an ended session and keeps the form quiet', async () => {
    await mount();
    await editName();

    await submitWith(
      () =>
        new HttpResponse(JSON.stringify({ title: 'Unauthorized', status: 401 }), {
          status: 401,
          headers: { 'Content-Type': 'application/problem+json' },
        })
    );

    await waitFor(() => expect(useAuthStore.getState().token).toBeNull());
    expect(screen.queryByRole('button', { name: 'Закрити сповіщення' })).not.toBeInTheDocument();
    expect(screen.queryByText(GENERIC)).not.toBeInTheDocument();
    expect(screen.queryAllByRole('alert').filter((node) => node.textContent !== '')).toEqual([]);
  });

  it('clears a server field error when its field is edited next', async () => {
    await mount();
    await editEmail(TAKEN_EMAIL);
    await submitEmailWith(() =>
      graphQLError({ message: 'email: This email address is already registered' })
    );
    await screen.findByText('Електронна адреса вже використовується');

    await userEvent.type(field(EMAIL), 'x');

    await waitFor(() =>
      expect(screen.queryByText('Електронна адреса вже використовується')).not.toBeInTheDocument()
    );
  });

  it('keeps toasts through Clear and returns focus to the password Save on close', async () => {
    await mount();
    await submitPasswordWith(() => saved());
    await screen.findByRole('button', { name: 'Закрити сповіщення' });

    await userEvent.click(screen.getByRole('button', { name: 'Очистити' }));
    expect(toastTexts()).toHaveLength(1);
    expect(field(NAME)).toHaveValue(loaded.initials);

    await userEvent.click(screen.getByRole('button', { name: 'Закрити сповіщення' }));

    expect(toastTexts()).toHaveLength(0);
    expect(saveButton(SAVE_PASSWORD)).toHaveFocus();
  });

  it('returns focus to the name input on the last close, because its Save hid', async () => {
    await mount();
    await editName();
    await submitWith(() => saved({ initials: NEW_NAME }));
    await screen.findByRole('button', { name: 'Закрити сповіщення' });

    await userEvent.click(screen.getByRole('button', { name: 'Закрити сповіщення' }));

    expect(toastTexts()).toHaveLength(0);
    expect(field(NAME)).toHaveFocus();
  });
});
