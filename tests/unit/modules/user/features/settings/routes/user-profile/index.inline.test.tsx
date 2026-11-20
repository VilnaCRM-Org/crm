import '@testing-library/jest-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
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
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const NAME = 'Ваше ПІБ';
const EMAIL = 'E-mail';
const NAME_PASSWORD = 'Пароль для зміни імені';
const EMAIL_PASSWORD = 'Пароль для зміни пошти';
const CURRENT = 'Поточний пароль';
const NEW = 'Новий пароль';
const SAVE_NAME = 'Зберегти ім’я';
const SAVE_EMAIL = 'Зберегти пошту';
const SAVE_PASSWORD = 'Зберегти зміни';
const CLEAR = 'Очистити';
const SAVED = 'Зміни збережено';
const EMAIL_SENT = 'Ми надіслали посилання для підтвердження на нову адресу';
const PASSWORD_CHANGED = 'Ви успішно змінили пароль';
const GENERIC = 'Не вдалося зберегти зміни. Спробуйте пізніше.';
const TRANSIENT = 'Не вдалося зберегти зміни. Перевірте з’єднання та спробуйте ще раз.';
const RATE_LIMITED = 'Забагато спроб. Спробуйте пізніше.';
const RESENT = 'Посилання для підтвердження надіслано повторно';
const RETRY = 'Спробувати ще раз';
const RESEND = 'Надіслати повторно';

const NEW_EMAIL = buildEmail();
const NEW_NAME = buildFullName();
const NEW_PASSWORD = buildPassword();
const ENTERED_PASSWORD = buildPassword();

const loaded = buildUserNode({
  id: buildUserIri(),
  initials: buildFullName(),
  email: buildEmail(),
  confirmed: true,
});

type Section = 'fullName' | 'email' | 'password';

const SAVE_LABEL: Record<Section, string> = {
  fullName: SAVE_NAME,
  email: SAVE_EMAIL,
  password: SAVE_PASSWORD,
};

const PASSWORD_LABEL: Record<Section, string> = {
  fullName: NAME_PASSWORD,
  email: EMAIL_PASSWORD,
  password: CURRENT,
};

const OWN_FIELD: Record<Section, string> = { fullName: NAME, email: EMAIL, password: NEW };

const graphQLError = (error: object): Response =>
  HttpResponse.json({ data: null, errors: [error] });

const saved = (overrides = {}): Response =>
  HttpResponse.json({ data: { updateUser: { user: { ...loaded, ...overrides } } } });

const resendPayload = (confirmed: boolean): Response =>
  HttpResponse.json({ data: { resendEmailToUser: { user: { id: loaded.id, confirmed } } } });

const SAVED_ANSWER: Record<Section, () => Response> = {
  fullName: () => saved({ initials: NEW_NAME }),
  email: () => saved({ email: NEW_EMAIL, confirmed: false }),
  password: () => saved(),
};

const SAVED_TEXT: Record<Section, string> = {
  fullName: SAVED,
  email: EMAIL_SENT,
  password: PASSWORD_CHANGED,
};

const FAILURES = [
  ['save_failed_transient', TRANSIENT, (): Response => new HttpResponse(null, { status: 503 })],
  [
    'save_failed',
    GENERIC,
    (): Response => graphQLError({ message: 'Something odd', extensions: { code: 'FORBIDDEN' } }),
  ],
  ['rate_limited', RATE_LIMITED, (): Response => new HttpResponse(null, { status: 429 })],
] as const;

type FailureCase = readonly [Section, string, string, () => Response];

const SECTIONS: readonly Section[] = ['fullName', 'email', 'password'];

const useStyle = (style: string): void => {
  writeConfigBlock(JSON.stringify({ notificationStyle: style }));
};

const mount = async (node = loaded): Promise<void> => {
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

const field = (label: string): HTMLInputElement => screen.getByLabelText(label) as HTMLInputElement;

const formOf = (label: string): HTMLFormElement => {
  const { form } = field(label);
  if (form === null) throw new Error(`${label} is outside a form`);
  return form;
};

const saveButton = (section: Section): HTMLElement =>
  screen.getByRole('button', { name: SAVE_LABEL[section] });

const clearIn = (section: Section): HTMLElement =>
  within(formOf(OWN_FIELD[section])).getByRole('button', { name: CLEAR });

const follows = (earlier: Node, later: Node): boolean =>
  (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

const inlineBlocks = (text: string): HTMLElement[] =>
  screen.queryAllByRole('list').filter((list) => within(list).queryByText(text) !== null);

const blockIn = (section: Section, text: string): HTMLElement => {
  const form = formOf(OWN_FIELD[section]);
  const [block, ...others] = within(form)
    .getAllByRole('list')
    .filter((list) => within(list).queryByText(text) !== null);
  if (block === undefined || others.length > 0) throw new Error(`no single block with ${text}`);
  return block;
};

const inlineBlock = async (section: Section, text: string): Promise<HTMLElement> => {
  await within(formOf(OWN_FIELD[section])).findByText(text);
  return blockIn(section, text);
};

const edit = async (section: Section): Promise<void> => {
  if (section === 'password') {
    await userEvent.type(field(NEW), NEW_PASSWORD);
    return;
  }
  const value = section === 'fullName' ? NEW_NAME : NEW_EMAIL;
  await userEvent.clear(field(OWN_FIELD[section]));
  await userEvent.type(field(OWN_FIELD[section]), value);
};

const submit = async (section: Section, respond: () => Response, delayMs = 0): Promise<void> => {
  answerProfileOperation('UpdateUser', { respond, delayMs });
  await userEvent.type(field(PASSWORD_LABEL[section]), ENTERED_PASSWORD);
  await userEvent.click(saveButton(section));
};

describe('settings page outcomes under the inline style', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  beforeEach(() => {
    resetClientStores();
    useStyle('inline');
    useAuthStore.setState({ ...CLEARED_AUTH_STATE, token: buildToken() });
    useConnectivityStore.setState({ online: true });
  });

  afterEach(() => {
    server.resetHandlers();
    clearConfigBlock();
  });

  afterAll(() => {
    server.close();
    useAuthStore.setState(CLEARED_AUTH_STATE);
    useConnectivityStore.setState({ online: true });
  });

  it.each(SECTIONS)(
    'shows the saved outcome of the %s section inside its form',
    async (section) => {
      await mount();
      await edit(section);

      await submit(section, SAVED_ANSWER[section]);

      const block = await inlineBlock(section, SAVED_TEXT[section]);
      expect(formOf(OWN_FIELD[section])).toContainElement(block);
      expect(follows(field(OWN_FIELD[section]), block)).toBe(true);
      expect(inlineBlocks(SAVED_TEXT[section])).toHaveLength(1);
      expect(screen.queryByRole('button', { name: 'Закрити сповіщення' })).not.toBeInTheDocument();
    }
  );

  it('keeps the password Save and shows the saved outcome after it', async () => {
    await mount();
    await edit('password');

    await submit('password', SAVED_ANSWER.password);

    const block = await inlineBlock('password', PASSWORD_CHANGED);
    expect(follows(saveButton('password'), block)).toBe(true);
  });

  it.each(
    SECTIONS.flatMap((section) =>
      FAILURES.map(([key, text, fail]): FailureCase => [section, key, text, fail])
    )
  )(
    'shows the %s %s outcome after Save and Clear in its form',
    async (section, _key, text, fail) => {
      await mount();
      await edit(section);
      const save = saveButton(section);

      await submit(section, fail);

      const block = await inlineBlock(section, text);
      await waitFor(() => expect(saveButton(section)).toBeEnabled());
      expect(saveButton(section)).toBe(save);
      expect(follows(save, block)).toBe(true);
      expect(follows(clearIn(section), block)).toBe(true);
      expect(inlineBlocks(text)).toHaveLength(1);
    }
  );

  it('offers Try again inside the transient block and leaves no action on the others', async () => {
    await mount();
    await edit('fullName');

    await submit('fullName', FAILURES[0][2]);

    const block = await inlineBlock('fullName', TRANSIENT);
    expect(within(block).getByRole('button', { name: RETRY })).toBeVisible();
    expect(screen.getAllByRole('button', { name: RETRY })).toHaveLength(1);
  });

  it('removes the shown block when Clear is activated', async () => {
    await mount();
    await edit('fullName');
    await submit('fullName', FAILURES[1][2]);
    await inlineBlock('fullName', GENERIC);

    await userEvent.click(clearIn('fullName'));

    expect(inlineBlocks(GENERIC)).toHaveLength(0);
  });

  it('removes the shown block on the next submit and replaces it on settle', async () => {
    await mount();
    await edit('email');
    await submit('email', FAILURES[2][2]);
    await inlineBlock('email', RATE_LIMITED);
    answerProfileOperation('UpdateUser', { respond: FAILURES[1][2], delayMs: 40 });

    await userEvent.click(saveButton('email'));

    expect(inlineBlocks(RATE_LIMITED)).toHaveLength(0);
    const block = await inlineBlock('email', GENERIC);
    expect(follows(saveButton('email'), block)).toBe(true);
    expect(inlineBlocks(RATE_LIMITED)).toHaveLength(0);
  });

  describe('resend', () => {
    const unconfirmed = { ...loaded, confirmed: false };

    it('shows the resend outcome in the e-mail field area, after the e-mail input', async () => {
      await mount(unconfirmed);
      answerProfileOperation('ResendEmailToUser', { respond: () => resendPayload(false) });

      await userEvent.click(screen.getByRole('button', { name: RESEND }));

      const block = await inlineBlock('email', RESENT);
      expect(follows(field(EMAIL), block)).toBe(true);
      expect(inlineBlocks(RESENT)).toHaveLength(1);
    });

    it('leaves a shown save block of the same form unchanged', async () => {
      await mount(unconfirmed);
      await edit('email');
      await submit('email', FAILURES[1][2]);
      const saveBlock = await inlineBlock('email', GENERIC);
      answerProfileOperation('ResendEmailToUser', { respond: () => resendPayload(false) });

      await userEvent.click(screen.getByRole('button', { name: RESEND }));

      const resendBlock = await inlineBlock('email', RESENT);
      expect(resendBlock).not.toBe(saveBlock);
      expect(blockIn('email', GENERIC)).toBe(saveBlock);
      expect(follows(resendBlock, saveBlock)).toBe(true);
    });

    it('still shows the outcome of a resend that turns the address confirmed', async () => {
      await mount(unconfirmed);
      answerProfileOperation('ResendEmailToUser', { respond: () => resendPayload(true) });

      await userEvent.click(screen.getByRole('button', { name: RESEND }));

      const block = await inlineBlock('email', RESENT);
      expect(screen.queryByRole('button', { name: RESEND })).not.toBeInTheDocument();
      expect(follows(field(EMAIL), block)).toBe(true);
    });
  });
});

describe.each(['toast', 'bell'])('settings page outcomes under the %s style', (style) => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  beforeEach(() => {
    resetClientStores();
    useStyle(style);
    useAuthStore.setState({ ...CLEARED_AUTH_STATE, token: buildToken() });
    useConnectivityStore.setState({ online: true });
  });

  afterEach(() => {
    server.resetHandlers();
    clearConfigBlock();
  });

  afterAll(() => {
    server.close();
    useAuthStore.setState(CLEARED_AUTH_STATE);
    useConnectivityStore.setState({ online: true });
  });

  it.each(SECTIONS)('leaves no inline block after a saved %s section', async (section) => {
    await mount();
    await edit(section);

    await submit(section, SAVED_ANSWER[section]);

    await waitFor(() =>
      expect(
        screen
          .getAllByRole('status')
          .some((node) => node.textContent?.includes(SAVED_TEXT[section]))
      ).toBe(true)
    );
    expect(inlineBlocks(SAVED_TEXT[section])).toHaveLength(0);
  });

  it.each(FAILURES)('leaves no inline block after %s', async (_key, text, fail) => {
    await mount();
    await edit('fullName');

    await submit('fullName', fail);

    await waitFor(() =>
      expect(screen.getAllByRole('alert').some((node) => node.textContent?.includes(text))).toBe(
        true
      )
    );
    expect(inlineBlocks(text)).toHaveLength(0);
  });

  it('leaves no inline block after a resend', async () => {
    await mount({ ...loaded, confirmed: false });
    answerProfileOperation('ResendEmailToUser', { respond: () => resendPayload(false) });

    await userEvent.click(screen.getByRole('button', { name: RESEND }));

    await waitFor(() =>
      expect(screen.getAllByRole('status').some((node) => node.textContent?.includes(RESENT))).toBe(
        true
      )
    );
    expect(inlineBlocks(RESENT)).toHaveLength(0);
  });
});
