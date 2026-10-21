import { GraphQLError } from 'graphql';

import { buildClientMutationId, buildEmail, buildPassword } from '@tests/builders';

import {
  clearResetTokens,
  issueResetToken,
  redeemResetToken,
  resetMailConfig,
  resetMailHtml,
  sendResetMail,
} from '../../docker/apollo-server/lib/password-reset-mail';
import { clearUsers, resolvers } from '../../docker/apollo-server/lib/resolvers';

const MAILPIT = 'http://mailpit:8025';
const LINK_BASE = 'http://localhost:3000';
const HOUR = 60 * 60 * 1000;

interface SentMail {
  From: { Email: string; Name: string };
  To: { Email: string }[];
  Subject: string;
  Text: string;
  HTML: string;
}

const okResponse = (): Response => new Response('{}', { status: 200 });

const sentMail = (fetchSpy: jest.SpyInstance): SentMail => {
  const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
  return JSON.parse(String(init.body)) as SentMail;
};

const tokenFrom = (mail: SentMail): string => /Токен: ([0-9a-f]+)/.exec(mail.HTML)?.[1] ?? '';

const expectTokenRejection = (run: () => void, message: string): void => {
  let caught: unknown;
  try {
    run();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(GraphQLError);
  expect((caught as GraphQLError).message).toBe(`token: ${message}`);
  expect((caught as GraphQLError).extensions).toEqual({ code: 'BAD_USER_INPUT', status: 422 });
};

describe('resetMailConfig', () => {
  it('turns the mail flow off when MAILPIT_API_URL is unset or blank', () => {
    expect(resetMailConfig({})).toBeNull();
    expect(resetMailConfig({ MAILPIT_API_URL: '  ' })).toBeNull();
  });

  it('defaults the reset link to the dev server and trims both URLs', () => {
    expect(resetMailConfig({ MAILPIT_API_URL: ` ${MAILPIT} ` })).toEqual({
      mailpitUrl: MAILPIT,
      linkBaseUrl: LINK_BASE,
    });
    expect(
      resetMailConfig({
        MAILPIT_API_URL: MAILPIT,
        PASSWORD_RESET_LINK_BASE_URL: ' https://crm.example ',
      })
    ).toEqual({ mailpitUrl: MAILPIT, linkBaseUrl: 'https://crm.example' });
  });

  it('drops trailing slashes so the link never reads //password-reset', () => {
    expect(
      resetMailConfig({
        MAILPIT_API_URL: `${MAILPIT}/`,
        PASSWORD_RESET_LINK_BASE_URL: 'https://crm.example//',
      })
    ).toEqual({ mailpitUrl: MAILPIT, linkBaseUrl: 'https://crm.example' });
  });

  it('reads process.env by default', () => {
    const previous = process.env.MAILPIT_API_URL;
    delete process.env.MAILPIT_API_URL;

    expect(resetMailConfig()).toBeNull();

    process.env.MAILPIT_API_URL = previous;
  });
});

describe('reset tokens', () => {
  afterEach(() => clearResetTokens());

  it('issues a random 64-character hex token that redeems once', () => {
    const token = issueResetToken(buildEmail());

    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(issueResetToken(buildEmail())).not.toBe(token);
    expect(() => redeemResetToken(token)).not.toThrow();
    expectTokenRejection(
      () => redeemResetToken(token),
      'Password reset token has already been used'
    );
  });

  it('rejects a token it never issued', () => {
    expectTokenRejection(() => redeemResetToken('unknown'), 'Password reset token not found');
  });

  it('accepts a token until its hour is up and rejects it from then on', () => {
    const issuedAt = 1_000_000;
    const fresh = issueResetToken(buildEmail(), issuedAt);
    const stale = issueResetToken(buildEmail(), issuedAt);

    expect(() => redeemResetToken(fresh, issuedAt + HOUR - 1)).not.toThrow();
    expectTokenRejection(
      () => redeemResetToken(stale, issuedAt + HOUR),
      'Password reset token has expired'
    );
  });

  it('forgets expired tokens when it issues a new one, keeping the live ones', () => {
    const issuedAt = 1_000_000;
    const expired = issueResetToken(buildEmail(), issuedAt);
    const live = issueResetToken(buildEmail(), issuedAt + HOUR - 1);

    issueResetToken(buildEmail(), issuedAt + HOUR);

    expectTokenRejection(
      () => redeemResetToken(expired, issuedAt + HOUR),
      'Password reset token not found'
    );
    expect(() => redeemResetToken(live, issuedAt + HOUR)).not.toThrow();
  });

  it('forgets every token on clear', () => {
    const token = issueResetToken(buildEmail());

    clearResetTokens();

    expectTokenRejection(() => redeemResetToken(token), 'Password reset token not found');
  });
});

describe('sendResetMail', () => {
  afterEach(() => jest.restoreAllMocks());

  it('posts the user-service reset e-mail to Mailpit with a frontend reset link', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(okResponse());
    const email = buildEmail();

    await sendResetMail({ mailpitUrl: MAILPIT, linkBaseUrl: LINK_BASE }, email, 'a+b');

    expect(fetchSpy).toHaveBeenCalledWith(`${MAILPIT}/api/v1/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    });
    expect(sentMail(fetchSpy)).toEqual({
      From: { Email: 'noreply@vilnacrm.com', Name: 'VilnaCRM' },
      To: [{ Email: email }],
      Subject: 'Відновлення пароля VilnaCRM',
      Text: 'Токен відновлення пароля - a+b',
      HTML: resetMailHtml(`${LINK_BASE}/password-reset?token=a%2Bb`, 'a+b'),
    });
  });

  it('throws when Mailpit refuses the message', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('no', { status: 500 }));

    await expect(
      sendResetMail({ mailpitUrl: MAILPIT, linkBaseUrl: LINK_BASE }, buildEmail(), 'token')
    ).rejects.toThrow('Mailpit refused the reset e-mail: HTTP 500');
  });

  it('renders the user-service template copy around the link and token', () => {
    expect(resetMailHtml('https://link', 'abc')).toBe(
      [
        '<h1>Запит на відновлення пароля</h1>',
        '<p>Ви запросили відновлення пароля. Натисніть кнопку нижче, щоб скинути пароль.</p>',
        '<p><a href="https://link">Скинути пароль</a></p>',
        '<p><small>Токен: abc</small></p>',
        '<p><small>Це посилання діє протягом 1 години.</small></p>',
      ].join('\n')
    );
  });
});

describe('password reset resolvers in mail mode', () => {
  const { requestPasswordResetUser, confirmPasswordResetUser, createUser } = resolvers.Mutation;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env.MAILPIT_API_URL = MAILPIT;
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(okResponse());
  });

  afterEach(() => {
    delete process.env.MAILPIT_API_URL;
    jest.restoreAllMocks();
    clearResetTokens();
    clearUsers();
  });

  it('mails the demo account a token that confirms exactly once', async () => {
    await requestPasswordResetUser(undefined, { input: { email: 'demo@vilnacrm.com' } });
    const token = tokenFrom(sentMail(fetchSpy));
    const confirm = (): ReturnType<typeof confirmPasswordResetUser> =>
      confirmPasswordResetUser(undefined, { input: { token, newPassword: buildPassword() } });

    await expect(confirm()).resolves.toEqual({ user: null, clientMutationId: null });
    await expect(confirm()).rejects.toThrow('token: Password reset token has already been used');
  });

  it('mails a user who signed up in this session', async () => {
    const email = buildEmail();
    await createUser(undefined, {
      input: { email, initials: 'Ab', clientMutationId: buildClientMutationId() },
    });

    await requestPasswordResetUser(undefined, { input: { email } });

    expect(sentMail(fetchSpy).To).toEqual([{ Email: email }]);
  });

  it('answers an unknown address the same way without sending anything', async () => {
    const info = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    const email = buildEmail();

    await expect(requestPasswordResetUser(undefined, { input: { email } })).resolves.toEqual({
      user: null,
      clientMutationId: null,
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(
      'No user for the requested address; no password reset e-mail sent.'
    );
    expect(info.mock.calls.flat().join(' ')).not.toContain(email);
  });

  it('still answers the request when Mailpit is down, and logs the failure', async () => {
    const failure = new Error('connect ECONNREFUSED');
    fetchSpy.mockRejectedValue(failure);
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(
      requestPasswordResetUser(undefined, { input: { email: 'demo@vilnacrm.com' } })
    ).resolves.toEqual({ user: null, clientMutationId: null });

    expect(consoleError).toHaveBeenCalledWith('Failed to send the password reset e-mail:', failure);
  });

  it('rejects a confirm with a token it never mailed', async () => {
    await expect(
      confirmPasswordResetUser(undefined, {
        input: { token: 'made-up', newPassword: buildPassword() },
      })
    ).rejects.toThrow('token: Password reset token not found');
  });
});
