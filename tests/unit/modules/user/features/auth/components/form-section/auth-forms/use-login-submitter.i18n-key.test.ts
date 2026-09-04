import { renderHook } from '@testing-library/react';
import type { TFunction } from 'i18next';

import { AuthStateVar } from '@auth/stores';

/**
 * The sibling suite's `t` returns the key it was handed, which makes a translated i18n key and an
 * untranslated raw message render identically — every decision inside `isI18nKey` is invisible to
 * it. This one marks translated output so the branch is observable.
 */
const t: TFunction = ((key: string, options?: Record<string, unknown>): string => {
  if (options?.reason !== undefined) return `login:${String(options.reason)}`;
  return `T(${key})`;
}) as unknown as TFunction;

/**
 * The segment pattern is a module-level literal, so it is evaluated on import. Loading the hook
 * inside the test body is what puts it under the assertions below.
 */
const errorFor = async (displayMessage: string): Promise<string> => {
  const { default: useLoginSubmitter } =
    await import('@auth/components/form-section/auth-forms/use-login-submitter');

  AuthStateVar.set({
    loginError: { kind: 'authentication', displayMessage, retryable: false },
  });

  const { result, unmount } = renderHook(() => useLoginSubmitter(t));
  const { error } = result.current;
  // Unmount before the next probe: the hook clears the store error on cleanup, so a mounted
  // instance would re-render on the next `set` outside `act`.
  unmount();

  return error;
};

describe('useLoginSubmitter i18n key detection', () => {
  beforeEach(() => {
    AuthStateVar.reset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Both probes share one test on purpose: they discriminate different halves of the segment
  // pattern, and the module is only evaluated once per test file.
  it('requires every dotted segment to match the pattern end to end', async () => {
    expect(await errorFor('a-b.cd')).toBe('login:a-b.cd');
    expect(await errorFor('ab.cd')).toBe('login:T(ab.cd)');
  });

  it('treats a single unpunctuated word as prose rather than a key', async () => {
    expect(await errorFor('unauthorized')).toBe('login:unauthorized');
  });

  it('treats a message containing spaces as prose', async () => {
    expect(await errorFor('Bad credentials')).toBe('login:Bad credentials');
  });

  it('translates a deep dotted key', async () => {
    expect(await errorFor('sign_in.errors.invalid_credentials')).toBe(
      'login:T(sign_in.errors.invalid_credentials)'
    );
  });

  it('rejects a key whose last segment carries punctuation', async () => {
    expect(await errorFor('sign_in.oops!')).toBe('login:sign_in.oops!');
  });

  it('rejects a value that is only a separator run', async () => {
    expect(await errorFor('...')).toBe('login:...');
  });
});
