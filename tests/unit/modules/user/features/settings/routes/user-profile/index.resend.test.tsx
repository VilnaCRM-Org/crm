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
  buildToken,
  buildUserIri,
  buildUserNode,
} from '@tests/builders';
import { answerProfileOperation } from '@tests/integration/mocks/profile-operations';
import server, { userServiceGraphql } from '@tests/integration/mocks/server';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import SessionOutlet from '@tests/unit/utils/session-outlet';

const RESENT = 'Посилання для підтвердження надіслано повторно';
const FAILED = 'Не вдалося надіслати посилання. Спробуйте ще раз.';
const STATUS = 'E-mail не підтверджено';

const NEW_EMAIL = buildEmail();

const unconfirmed = buildUserNode({
  id: buildUserIri(),
  initials: buildFullName(),
  email: buildEmail(),
  confirmed: false,
});

const graphQLError = (error: object): Response =>
  HttpResponse.json({ data: null, errors: [error] });

const resendPayload = (confirmed: boolean): Response =>
  HttpResponse.json({
    data: { resendEmailToUser: { user: { id: unconfirmed.id, confirmed } } },
  });

const mount = async (node = unconfirmed): Promise<void> => {
  answerProfileOperation('CurrentUser', {
    respond: () => HttpResponse.json({ data: { users: { edges: [{ node }] } } }),
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

const resendLink = (): HTMLElement => screen.getByRole('button', { name: 'Надіслати повторно' });

const email = (): HTMLInputElement => screen.getByLabelText('E-mail') as HTMLInputElement;

const answerResend = (respond: () => Response): ReturnType<typeof answerProfileOperation> =>
  answerProfileOperation('ResendEmailToUser', { respond });

describe('settings page e-mail resend (page)', () => {
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

  it('shows the row and describes the e-mail field by it only while unconfirmed', async () => {
    await mount();

    expect(screen.getByText(STATUS)).toBeVisible();
    expect(email()).toHaveAttribute('aria-describedby', expect.stringContaining('email-status'));
  });

  it('shows no row for a confirmed address', async () => {
    await mount({ ...unconfirmed, confirmed: true });

    expect(screen.queryByText(STATUS)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Надіслати повторно' })).not.toBeInTheDocument();
    expect(email()).not.toHaveAttribute(
      'aria-describedby',
      expect.stringContaining('email-status')
    );
  });

  it('sends one resend with only the id and a clientMutationId for two activations', async () => {
    await mount();
    const answered = answerProfileOperation('ResendEmailToUser', {
      delayMs: 40,
      respond: () => resendPayload(false),
    });
    resendLink().focus();

    await userEvent.click(resendLink());
    fireEvent.click(resendLink());

    expect(await screen.findByText(RESENT)).toBeVisible();
    expect(answered).toHaveLength(1);
    expect(Object.keys(answered[0]?.variables['input'] as object).sort()).toEqual([
      'clientMutationId',
      'id',
    ]);
    expect((answered[0]?.variables['input'] as { id: string }).id).toBe(unconfirmed.id);
    expect(resendLink()).toHaveFocus();
  });

  it('flags the control aria-disabled while the request is in flight, keeping focus', async () => {
    await mount();
    answerProfileOperation('ResendEmailToUser', {
      delayMs: 40,
      respond: () => resendPayload(false),
    });

    await userEvent.click(resendLink());

    expect(resendLink()).toHaveAttribute('aria-disabled', 'true');
    expect(resendLink()).toHaveFocus();
    await screen.findByText(RESENT);
    await waitFor(() => expect(resendLink()).not.toHaveAttribute('aria-disabled'));
  });

  it('removes the row and focuses the e-mail field when the payload says confirmed', async () => {
    await mount();
    answerResend(() => resendPayload(true));

    await userEvent.click(resendLink());

    expect(await screen.findByText(RESENT)).toBeVisible();
    expect(screen.queryByText(STATUS)).not.toBeInTheDocument();
    expect(email()).toHaveFocus();
  });

  it('keeps unsaved edits and typed passwords because the form is not remounted', async () => {
    await mount();
    await userEvent.type(screen.getByLabelText('Ваше ПІБ'), ' Іванівна');
    await userEvent.type(screen.getByLabelText('Пароль для зміни імені'), 'abc');
    await userEvent.type(screen.getByLabelText('Поточний пароль'), 'def');
    answerResend(() => resendPayload(false));

    await userEvent.click(resendLink());

    await screen.findByText(RESENT);
    expect(screen.getByLabelText('Ваше ПІБ')).toHaveValue(`${unconfirmed.initials} Іванівна`);
    expect(screen.getByLabelText('Пароль для зміни імені')).toHaveValue('abc');
    expect(screen.getByLabelText('Поточний пароль')).toHaveValue('def');
    expect(resendLink()).toHaveFocus();
  });

  it('shows the rate-limit toast without an action for a 429', async () => {
    await mount();
    answerResend(() => new HttpResponse(null, { status: 429 }));

    await userEvent.click(resendLink());

    expect(await screen.findByText('Забагато спроб. Спробуйте пізніше.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Спробувати ще раз' })).not.toBeInTheDocument();
  });

  it.each([
    [
      'the resend time-out',
      (): Response =>
        graphQLError({ message: 'Cannot send new email till 2026-10-08T10:00:00+00:00' }),
    ],
    ['a 503', (): Response => new HttpResponse(null, { status: 503 })],
  ])('shows the resend failure without an action for %s', async (_name, fail) => {
    await mount();
    answerResend(fail);

    await userEvent.click(resendLink());

    expect(await screen.findByText(FAILED)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Спробувати ще раз' })).not.toBeInTheDocument();
  });

  it('shows nothing for an ended session', async () => {
    await mount();
    answerResend(
      () =>
        new HttpResponse(JSON.stringify({ title: 'Unauthorized', status: 401 }), {
          status: 401,
          headers: { 'Content-Type': 'application/problem+json' },
        })
    );

    await userEvent.click(resendLink());

    await waitFor(() => expect(useAuthStore.getState().token).toBeNull());
    expect(screen.queryByText(FAILED)).not.toBeInTheDocument();
    expect(screen.queryAllByRole('alert').filter((node) => node.textContent !== '')).toEqual([]);
  });

  it('sends nothing and is aria-disabled while offline', async () => {
    await mount();
    const answered = answerResend(() => resendPayload(false));
    act(() => useConnectivityStore.setState({ online: false }));

    await userEvent.click(resendLink());

    expect(resendLink()).toHaveAttribute('aria-disabled', 'true');
    expect(answered).toHaveLength(0);
  });

  it('saves during a resend, and the late resend result changes nothing', async () => {
    await mount();
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      userServiceGraphql.mutation('ResendEmailToUser', async () => {
        await gate;
        return resendPayload(false);
      })
    );
    const updates = answerProfileOperation('UpdateUser', {
      respond: () =>
        HttpResponse.json({
          data: { updateUser: { user: { ...unconfirmed, email: NEW_EMAIL } } },
        }),
    });
    await userEvent.click(resendLink());
    await userEvent.clear(email());
    await userEvent.type(email(), NEW_EMAIL);
    await userEvent.type(screen.getByLabelText('Пароль для зміни пошти'), 'abc');
    const save = screen.getByRole('button', { name: 'Зберегти пошту' });

    expect(save).toBeEnabled();
    await userEvent.click(save);
    expect(
      await screen.findAllByText('Ми надіслали посилання для підтвердження на нову адресу')
    ).not.toEqual([]);
    await act(async () => release());

    expect(screen.queryByText(RESENT)).not.toBeInTheDocument();
    expect(updates).toHaveLength(1);
    expect(screen.getByText(STATUS)).toBeVisible();
    expect(email()).toHaveValue(NEW_EMAIL);
  });

  it('is aria-disabled and sends nothing while an e-mail save is in flight', async () => {
    await mount();
    await userEvent.type(email(), 'x');
    await userEvent.type(screen.getByLabelText('Пароль для зміни пошти'), 'abc');
    answerProfileOperation('UpdateUser', {
      delayMs: 60,
      respond: () => HttpResponse.json({ data: { updateUser: { user: unconfirmed } } }),
    });
    const answered = answerResend(() => resendPayload(false));

    await userEvent.click(screen.getByRole('button', { name: 'Зберегти пошту' }));
    fireEvent.click(resendLink());

    expect(resendLink()).toHaveAttribute('aria-disabled', 'true');
    expect(answered).toHaveLength(0);
    await screen.findByText('Ми надіслали посилання для підтвердження на нову адресу');
  });

  it('stays usable while a name save is in flight, because that save owns no e-mail', async () => {
    await mount();
    await userEvent.type(screen.getByLabelText('Ваше ПІБ'), ' Іванівна');
    await userEvent.type(screen.getByLabelText('Пароль для зміни імені'), 'abc');
    answerProfileOperation('UpdateUser', {
      delayMs: 60,
      respond: () => HttpResponse.json({ data: { updateUser: { user: unconfirmed } } }),
    });
    answerResend(() => resendPayload(false));

    await userEvent.click(screen.getByRole('button', { name: 'Зберегти ім’я' }));

    expect(resendLink()).not.toHaveAttribute('aria-disabled');
    await screen.findByText('Зміни збережено');
  });
});
