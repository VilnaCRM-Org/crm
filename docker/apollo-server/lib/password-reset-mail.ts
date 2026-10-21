import { randomBytes } from 'node:crypto';

import { GraphQLError } from 'graphql';

import { IssuedResetToken, ResetMailConfig } from './types';

const TOKEN_TTL_MS = 60 * 60 * 1000;
const DEFAULT_LINK_BASE_URL = 'http://localhost:3000';
const SENDER = { Email: 'noreply@vilnacrm.com', Name: 'VilnaCRM' };

const tokens = new Map<string, IssuedResetToken>();

const rejectToken = (reason: string): never => {
  throw new GraphQLError(`token: ${reason}`, {
    extensions: { code: 'BAD_USER_INPUT', status: 422 },
  });
};

export function resetMailConfig(env: NodeJS.ProcessEnv = process.env): ResetMailConfig | null {
  const mailpitUrl = env.MAILPIT_API_URL?.trim();
  if (!mailpitUrl) return null;
  const linkBase = env.PASSWORD_RESET_LINK_BASE_URL?.trim() || DEFAULT_LINK_BASE_URL;
  return {
    mailpitUrl: mailpitUrl.replace(/\/+$/, ''),
    linkBaseUrl: linkBase.replace(/\/+$/, ''),
  };
}

const forgetExpiredTokens = (now: number): void => {
  for (const [token, issued] of tokens) {
    if (issued.expiresAt <= now) tokens.delete(token);
  }
};

export function issueResetToken(email: string, now: number = Date.now()): string {
  forgetExpiredTokens(now);
  const token = randomBytes(32).toString('hex');
  tokens.set(token, { email, expiresAt: now + TOKEN_TTL_MS, used: false });
  return token;
}

export function redeemResetToken(token: string, now: number = Date.now()): void {
  const issued = tokens.get(token);
  if (!issued) return rejectToken('Password reset token not found');
  if (issued.used) return rejectToken('Password reset token has already been used');
  if (issued.expiresAt <= now) return rejectToken('Password reset token has expired');
  issued.used = true;
}

export function clearResetTokens(): void {
  tokens.clear();
}

export function resetMailHtml(resetUrl: string, token: string): string {
  return [
    '<h1>Запит на відновлення пароля</h1>',
    '<p>Ви запросили відновлення пароля. Натисніть кнопку нижче, щоб скинути пароль.</p>',
    `<p><a href="${resetUrl}">Скинути пароль</a></p>`,
    `<p><small>Токен: ${token}</small></p>`,
    '<p><small>Це посилання діє протягом 1 години.</small></p>',
  ].join('\n');
}

export async function sendResetMail(
  config: ResetMailConfig,
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${config.linkBaseUrl}/password-reset?token=${encodeURIComponent(token)}`;
  const response = await fetch(`${config.mailpitUrl}/api/v1/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      From: SENDER,
      To: [{ Email: email }],
      Subject: 'Відновлення пароля VilnaCRM',
      Text: `Токен відновлення пароля - ${token}`,
      HTML: resetMailHtml(resetUrl, token),
    }),
  });
  if (!response.ok) throw new Error(`Mailpit refused the reset e-mail: HTTP ${response.status}`);
}
