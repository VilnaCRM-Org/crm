import { act, renderHook } from '@testing-library/react';

import useChallengeView, { fieldErrorOf } from '@auth/hooks/use-challenge-view';
import type { ChallengeFailureReason, ChallengeResult } from '@auth/types/two-factor/challenge';
import type { ChallengeAction } from '@auth/types/two-factor/challenge-view';

const failed = (reason: ChallengeFailureReason): ChallengeResult => ({ kind: 'failed', reason });

const setUp = (): ReturnType<typeof renderHook<ReturnType<typeof useChallengeView>, unknown>> =>
  renderHook(() => useChallengeView());

const dispatchAll = (
  result: ReturnType<typeof setUp>['result'],
  ...actions: ChallengeAction[]
): void => {
  for (const action of actions) act(() => result.current.dispatch(action));
};

describe('useChallengeView', () => {
  it('starts in authenticator mode with an empty, error-free view', () => {
    expect(setUp().result.current.view).toEqual({
      mode: 'totp',
      value: '',
      fieldError: null,
      banner: null,
      bannerOccurrence: 0,
      focusRequest: 0,
    });
  });

  it('records the submitted value and clears the field error, keeping the banner raised', () => {
    const { result } = setUp();
    dispatchAll(
      result,
      { type: 'rejected', value: '12', fieldError: 'incomplete' },
      { type: 'settled', result: failed('network') },
      { type: 'submitted', value: '123456' }
    );

    expect(result.current.view).toEqual({
      mode: 'totp',
      value: '123456',
      fieldError: null,
      banner: 'transient',
      bannerOccurrence: 1,
      focusRequest: 1,
    });
  });

  it('raises the banner once more for each further banner failure', () => {
    const { result } = setUp();
    dispatchAll(
      result,
      { type: 'submitted', value: '123456' },
      { type: 'settled', result: failed('network') },
      { type: 'submitted', value: '123456' },
      { type: 'settled', result: failed('rate_limited') }
    );

    expect(result.current.view).toMatchObject({ banner: 'rate_limited', bannerOccurrence: 2 });
  });

  it('keeps the rejected value, sets the field error, clears the banner and asks for focus', () => {
    const { result } = setUp();
    dispatchAll(
      result,
      { type: 'settled', result: failed('server') },
      { type: 'rejected', value: 'abc', fieldError: 'format' }
    );

    expect(result.current.view).toMatchObject({
      value: 'abc',
      fieldError: 'format',
      banner: null,
      focusRequest: 1,
    });
  });

  it('clears the value and the banner on invalid_code, flags it and asks for focus', () => {
    const { result } = setUp();
    dispatchAll(
      result,
      { type: 'switched' },
      { type: 'submitted', value: 'ABCD-2345' },
      { type: 'settled', result: failed('server') },
      { type: 'submitted', value: 'ABCD-2345' },
      { type: 'settled', result: failed('invalid_code') }
    );

    expect(result.current.view).toEqual({
      mode: 'recovery',
      value: '',
      fieldError: 'invalid_code',
      banner: null,
      bannerOccurrence: 1,
      focusRequest: 2,
    });
  });

  it.each([
    ['rate_limited', 'rate_limited'],
    ['network', 'transient'],
    ['server', 'transient'],
  ] as const)('maps %s to the %s banner without touching the rest', (reason, banner) => {
    const { result } = setUp();
    dispatchAll(
      result,
      { type: 'submitted', value: '123456' },
      { type: 'settled', result: failed(reason) }
    );

    expect(result.current.view).toEqual({
      mode: 'totp',
      value: '123456',
      fieldError: null,
      banner,
      bannerOccurrence: 1,
      focusRequest: 0,
    });
  });

  it.each<ChallengeResult | null>([
    failed('expired_session'),
    failed('locked'),
    { kind: 'completed', token: 't', recoveryCodesRemaining: 1 },
    null,
  ])('ignores the settled result %j', (settled) => {
    const { result } = setUp();
    dispatchAll(result, { type: 'submitted', value: '123456' });
    const before = result.current.view;

    dispatchAll(result, { type: 'settled', result: settled });

    expect(result.current.view).toBe(before);
  });

  it('switches mode back and forth, clearing everything and asking for focus each time', () => {
    const { result } = setUp();
    dispatchAll(
      result,
      { type: 'submitted', value: '123456' },
      { type: 'settled', result: failed('network') },
      { type: 'rejected', value: '1', fieldError: 'incomplete' }
    );

    dispatchAll(result, { type: 'switched' });
    expect(result.current.view).toEqual({
      mode: 'recovery',
      value: '',
      fieldError: null,
      banner: null,
      bannerOccurrence: 0,
      focusRequest: 2,
    });

    dispatchAll(result, { type: 'switched' });
    expect(result.current.view).toMatchObject({ mode: 'totp', focusRequest: 3 });
  });
});

describe('fieldErrorOf', () => {
  it.each(['', '1', '12345', ' 1 2 3 4 5 ', '\t99'])(
    'calls %j incomplete in authenticator mode',
    (raw) => {
      expect(fieldErrorOf(raw, 'totp')).toBe('incomplete');
    }
  );

  it.each(['123456', '1234567', '12a45', 'abcde', '12-34'])(
    'calls %j a format error in authenticator mode',
    (raw) => {
      expect(fieldErrorOf(raw, 'totp')).toBe('format');
    }
  );

  it.each(['', '12', 'abc', 'abcd-123'])('calls %j a format error in recovery mode', (raw) => {
    expect(fieldErrorOf(raw, 'recovery')).toBe('format');
  });
});
