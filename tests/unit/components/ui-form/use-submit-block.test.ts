import { renderHook } from '@testing-library/react';
import type { FormEvent } from 'react';

import type { SubmitBlock } from '@/components/types/ui-form';
import useSubmitBlock from '@/components/ui-form/use-submit-block';

const REASON = 'Спочатку підтвердьте, що зберегли коди';
const NOTICE_ID = 'offline-notice';

const run = (
  reason: string | undefined,
  nativelyDisabled: boolean,
  onSubmit = jest.fn()
): SubmitBlock =>
  renderHook(() => useSubmitBlock({ reason, nativelyDisabled, noticeId: NOTICE_ID, onSubmit }))
    .result.current;

const submitEvent = (): FormEvent<HTMLFormElement> =>
  ({ preventDefault: jest.fn() }) as unknown as FormEvent<HTMLFormElement>;

describe('useSubmitBlock', () => {
  it('blocks with the reason when no native disabled state applies', () => {
    const block = run(REASON, false);

    expect(block.blocked).toBe(true);
    expect(block.reason).toBe(REASON);
    expect(block.describedBy).toBe(`${NOTICE_ID} ${block.reasonId}`);
    expect(block.reasonId).not.toBe('');
  });

  it('refuses the submit event instead of passing it on while blocked', () => {
    const onSubmit = jest.fn();
    const event = submitEvent();

    run(REASON, false, onSubmit).onSubmit(event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('passes the submit handler through when there is no reason', () => {
    const onSubmit = jest.fn();
    const block = run(undefined, false, onSubmit);

    expect(block.blocked).toBe(false);
    expect(block.reason).toBe('');
    expect(block.describedBy).toBe(NOTICE_ID);
    expect(block.onSubmit).toBe(onSubmit);
  });

  it('treats an empty reason as no reason', () => {
    const onSubmit = jest.fn();
    const block = run('', false, onSubmit);

    expect(block.blocked).toBe(false);
    expect(block.onSubmit).toBe(onSubmit);
  });

  it('lets a native disabled state win over the reason', () => {
    const onSubmit = jest.fn();
    const block = run(REASON, true, onSubmit);

    expect(block.blocked).toBe(false);
    expect(block.describedBy).toBe(NOTICE_ID);
    expect(block.onSubmit).toBe(onSubmit);
  });
});
