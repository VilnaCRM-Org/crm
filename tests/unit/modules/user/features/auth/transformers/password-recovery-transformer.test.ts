import 'reflect-metadata';

import type { UserServiceFailure } from '@/modules/user/types/user-service/user-service-failure';
import type PasswordRecoveryTransformer from '@auth/transformers/password-recovery-transformer';
import type { RecoveryFailure, RecoveryStep } from '@auth/types/password-recovery/outcome';
import loadIsolated from '@tests/unit/utils/isolated-module';

const loadTransformer = async (): Promise<PasswordRecoveryTransformer> => {
  const { default: Transformer } = await loadIsolated(
    async () => import('@auth/transformers/password-recovery-transformer')
  );
  return new Transformer();
};

const failure = (
  reason: UserServiceFailure['reason'],
  paths: readonly string[] = []
): UserServiceFailure => ({
  reason,
  status: null,
  violations: { items: paths.map((path) => ({ path, reason: 'other' as const })) },
});

describe('PasswordRecoveryTransformer', () => {
  let transformer: PasswordRecoveryTransformer;

  beforeEach(async () => {
    transformer = await loadTransformer();
  });

  it.each<[RecoveryStep, string, UserServiceFailure, RecoveryFailure]>([
    [
      'request',
      'an email violation',
      failure('violation', ['email']),
      { reason: 'invalid_email', retryable: false },
    ],
    [
      'request',
      'a violation without a field',
      failure('violation'),
      { reason: 'invalid_email', retryable: false },
    ],
    ['request', 'refused', failure('refused'), { reason: 'rate_limited', retryable: false }],
    ['confirm', 'refused', failure('refused'), { reason: 'invalid_link', retryable: false }],
    [
      'confirm',
      'a token violation',
      failure('violation', ['token']),
      { reason: 'invalid_link', retryable: false },
    ],
    [
      'request',
      'a token violation',
      failure('violation', ['token']),
      { reason: 'invalid_link', retryable: false },
    ],
    [
      'confirm',
      'server error carrying a token path',
      failure('server', ['token']),
      { reason: 'server', retryable: true },
    ],
    [
      'confirm',
      'a newPassword violation',
      failure('violation', ['newPassword']),
      { reason: 'policy_rejected', retryable: false },
    ],
    [
      'confirm',
      'a violation without a field',
      failure('violation'),
      { reason: 'policy_rejected', retryable: false },
    ],
    [
      'request',
      'rate_limited',
      failure('rate_limited'),
      { reason: 'rate_limited', retryable: false },
    ],
    [
      'confirm',
      'rate_limited',
      failure('rate_limited'),
      { reason: 'rate_limited', retryable: false },
    ],
    ['request', 'network', failure('network'), { reason: 'network', retryable: true }],
    ['confirm', 'network', failure('network'), { reason: 'network', retryable: true }],
    ['request', 'aborted', failure('aborted'), { reason: 'network', retryable: true }],
    ['confirm', 'aborted', failure('aborted'), { reason: 'network', retryable: true }],
    ['request', 'server', failure('server'), { reason: 'server', retryable: true }],
    ['confirm', 'server', failure('server'), { reason: 'server', retryable: true }],
    ['request', 'unknown', failure('unknown'), { reason: 'server', retryable: true }],
    ['confirm', 'unknown', failure('unknown'), { reason: 'server', retryable: true }],
  ])('maps a %s-step %s to its outcome', (step, _name, input, expected) => {
    expect(transformer.fromFailure(step, input)).toEqual({ kind: 'failed', failure: expected });
  });

  it.each([
    ['eirene@gmail.com', 'eir*****@gmail.com'],
    ['jo@x.io', 'j*****@x.io'],
    ['abcdef@d.com', 'abc*****@d.com'],
    ['abcde@d.com', 'a*****@d.com'],
    ['Ab.Cd@ef@Example.COM', 'Ab.*****@Example.COM'],
    ['no-at-sign', '*****'],
    ['@x.io', '*****@x.io'],
  ])('masks %s as %s', (email, maskedEmail) => {
    expect(transformer.toSentOutcome({ email })).toEqual({ kind: 'sent', maskedEmail });
  });

  it('gives the same sent outcome to two addresses sharing the visible prefix and domain', () => {
    const first = transformer.toSentOutcome({ email: 'eirene@gmail.com' });
    const second = transformer.toSentOutcome({ email: 'eirxyz@gmail.com' });

    expect(first).toEqual({ kind: 'sent', maskedEmail: 'eir*****@gmail.com' });
    expect(second).toEqual(first);
  });

  it('returns the same confirmed outcome every time', () => {
    expect(transformer.toConfirmedOutcome()).toEqual({ kind: 'confirmed' });
    expect(transformer.toConfirmedOutcome()).toBe(transformer.toConfirmedOutcome());
  });
});
