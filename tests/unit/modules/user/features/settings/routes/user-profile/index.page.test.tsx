import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse } from 'msw';
import { I18nextProvider } from 'react-i18next';

import useConnectivityStore from '@/lib/connectivity/use-connectivity-store';
import UserProfile from '@/modules/user/features/settings/routes/user-profile';
import useAuthStore, { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import { buildToken, buildUserNode } from '@tests/builders';
import { answerProfileOperation } from '@tests/integration/mocks/profile-operations';
import server from '@tests/integration/mocks/server';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

const NAME = 'Ваше ім’я та прізвище';
const CURRENT = 'Поточний пароль';
const NEW = 'Новий пароль';
const SAVED = 'Зміни збережено';
const EMAIL_SENT = 'Ми надіслали посилання для підтвердження на нову адресу';
const PASSWORD_CHANGED = 'Ви успішно змінили пароль';
const GENERIC = 'Не вдалося зберегти зміни. Спробуйте пізніше.';
const TRANSIENT = 'Не вдалося зберегти зміни. Перевірте з’єднання та спробуйте ще раз.';
const RETRY = 'Спробувати ще раз';

const loaded = buildUserNode({
  id: '/api/users/1',
  initials: 'Олена Петренко',
  email: 'olena@example.com',
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
        <UserProfile />
      </main>
    </I18nextProvider>
  );
  await screen.findByRole('heading', { level: 2, name: 'Особисті дані' });
};

const field = (label: string): HTMLInputElement => screen.getByLabelText(label) as HTMLInputElement;

const saveButton = (): HTMLElement => screen.getByRole('button', { name: 'Зберегти зміни' });

const typeInto = async (label: string, text: string): Promise<void> => {
  await userEvent.type(field(label), text);
};

const editName = async (): Promise<void> => {
  await userEvent.clear(field(NAME));
  await typeInto(NAME, 'Іван Коваль');
};

const submitWith = async (
  answer: () => Response
): Promise<ReturnType<typeof answerProfileOperation>> => {
  const answered = answerProfileOperation('UpdateUser', { respond: answer });
  await typeInto(CURRENT, 'abc');
  await userEvent.click(saveButton());
  return answered;
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

  it('saves a name: one toast announced once, focus on Save, payload shown', async () => {
    await mount();
    await editName();
    answerProfileOperation('UpdateUser', { respond: () => saved({ initials: 'Іван Коваль' }) });
    await typeInto(CURRENT, 'abc');

    await userEvent.click(saveButton());

    await screen.findByRole('button', { name: 'Закрити сповіщення' });
    expect(toastTexts()).toEqual([expect.stringContaining(SAVED)]);
    const regions = screen
      .getAllByRole('status')
      .filter((node) => node.textContent?.includes(SAVED));
    expect(regions).toHaveLength(1);
    await waitFor(() => expect(saveButton()).toHaveFocus());
    expect(screen.getByText('Іван Коваль')).toBeVisible();
    expect(field(NAME)).toHaveValue('Іван Коваль');
    expect(field(CURRENT)).toHaveValue('');
    expect(field(NEW)).toHaveValue('');
  });

  it('saves an e-mail and shows the confirmation-link toast', async () => {
    await mount();
    await userEvent.clear(field('E-mail'));
    await typeInto('E-mail', 'new@example.com');

    await submitWith(() => saved({ email: 'new@example.com', confirmed: false }));

    expect(await screen.findByText(EMAIL_SENT)).toBeVisible();
    expect(field('E-mail')).toHaveValue('new@example.com');
  });

  it('shows three toasts in order as one utterance and sends one request', async () => {
    await mount();
    await editName();
    await userEvent.clear(field('E-mail'));
    await typeInto('E-mail', 'new@example.com');
    await typeInto(NEW, 'Next12345');
    const answered = answerProfileOperation('UpdateUser', {
      delayMs: 30,
      respond: () => saved({ initials: 'Іван Коваль', email: 'new@example.com' }),
    });
    await typeInto(CURRENT, 'abc');

    await userEvent.click(saveButton());
    fireEvent.click(saveButton());

    await waitFor(() => expect(toastTexts()).toHaveLength(3));
    expect(toastTexts().map((text) => text.replace(/\s+/g, ' '))).toEqual([
      expect.stringContaining(SAVED),
      expect.stringContaining(EMAIL_SENT),
      expect.stringContaining(PASSWORD_CHANGED),
    ]);
    const utterance = screen
      .getAllByRole('status')
      .map((node) => node.textContent ?? '')
      .find((text) => text.includes(PASSWORD_CHANGED));
    expect(utterance?.replace('​', '')).toBe(`${SAVED} ${EMAIL_SENT} ${PASSWORD_CHANGED}`);
    expect(answered).toHaveLength(1);
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
    await userEvent.clear(field('E-mail'));
    await typeInto('E-mail', 'taken@example.com');

    await submitWith(() => graphQLError(error));

    expect(await screen.findByText('Електронна адреса вже використовується')).toBeVisible();
    await waitFor(() => expect(field('E-mail')).toHaveFocus());
    expect(field('E-mail')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows the name and new-password errors and focuses the name first', async () => {
    await mount();
    await editName();
    await typeInto(NEW, 'Next12345');

    await submitWith(() =>
      graphQLError({
        message: 'newPassword: Too weak\ninitials: Bad name',
        extensions: { status: 422 },
      })
    );

    expect(
      await screen.findByText('Будь ласка, введіть повне ім’я у правильному форматі')
    ).toBeVisible();
    expect(screen.getByText('Пароль не відповідає вимогам. Перевірте правила нижче')).toBeVisible();
    await waitFor(() => expect(field(NAME)).toHaveFocus());
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
  ])('shows the wrong-password error on the current password for %s', async (_name, message) => {
    await mount();
    await editName();
    await typeInto(NEW, 'Next12345');

    await submitWith(() => graphQLError({ message }));

    expect(await screen.findByText('Неправильний поточний пароль')).toBeVisible();
    await waitFor(() => expect(field(CURRENT)).toHaveFocus());
    expect(field(NAME)).toHaveValue('Іван Коваль');
    expect(field(NEW)).toHaveValue('Next12345');
  });

  it('shows the generic toast for an unknown message that carries FORBIDDEN', async () => {
    await mount();
    await editName();

    await submitWith(() =>
      graphQLError({ message: 'Something odd', extensions: { code: 'FORBIDDEN' } })
    );

    expect(await screen.findByText(GENERIC)).toBeVisible();
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
  ])('offers a retry for %s that submits once more and leaves focus on Save', async (_n, fail) => {
    await mount();
    await editName();
    let sent = 0;
    const answered = answerProfileOperation('UpdateUser', {
      respond: () => {
        sent += 1;
        return sent === 1 ? fail() : saved({ initials: 'Іван Коваль' });
      },
    });
    await typeInto(CURRENT, 'abc');
    await userEvent.click(saveButton());
    expect(await screen.findByText(TRANSIENT)).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: RETRY }));

    await waitFor(() => expect(answered).toHaveLength(2));
    await waitFor(() => expect(toastTexts()).toEqual([expect.stringContaining(SAVED)]));
    expect(screen.queryByText(TRANSIENT)).not.toBeInTheDocument();
    await waitFor(() => expect(saveButton()).toHaveFocus());
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
    await userEvent.clear(field('E-mail'));
    await typeInto('E-mail', 'taken@example.com');
    await submitWith(() =>
      graphQLError({ message: 'email: This email address is already registered' })
    );
    await screen.findByText('Електронна адреса вже використовується');

    await userEvent.type(field('E-mail'), 'x');

    await waitFor(() =>
      expect(screen.queryByText('Електронна адреса вже використовується')).not.toBeInTheDocument()
    );
  });

  it('keeps toasts through Clear and returns focus to Save on the last close', async () => {
    await mount();
    await editName();
    await submitWith(() => saved({ initials: 'Іван Коваль' }));
    await screen.findByRole('button', { name: 'Закрити сповіщення' });

    await userEvent.click(screen.getByRole('button', { name: 'Очистити' }));
    expect(toastTexts()).toHaveLength(1);

    await userEvent.click(screen.getByRole('button', { name: 'Закрити сповіщення' }));

    expect(toastTexts()).toHaveLength(0);
    expect(saveButton()).toHaveFocus();
  });
});
