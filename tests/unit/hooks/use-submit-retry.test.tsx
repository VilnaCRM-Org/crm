import { render, renderHook, screen } from '@testing-library/react';
import type { JSX } from 'react';

import useSubmitRetry from '@/hooks/use-submit-retry';

interface ProbeProps {
  readonly onSubmit: () => void;
}

function Probe({ onSubmit }: ProbeProps): JSX.Element {
  const { submitRef, retry } = useSubmitRetry();
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <button ref={submitRef} type="submit">
        Submit
      </button>
      <button type="button" onClick={retry}>
        Retry
      </button>
    </form>
  );
}

describe('useSubmitRetry', () => {
  it('retries by clicking the submit button the ref is attached to', () => {
    const onSubmit = jest.fn();
    render(<Probe onSubmit={onSubmit} />);

    screen.getByRole('button', { name: 'Retry' }).click();

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('does nothing while no submit button is attached', () => {
    const { result } = renderHook(() => useSubmitRetry());

    expect(result.current.submitRef.current).toBeNull();
    expect(() => result.current.retry()).not.toThrow();
  });

  it('keeps one ref across renders', () => {
    const { result, rerender } = renderHook(() => useSubmitRetry());
    const first = result.current.submitRef;

    rerender();

    expect(result.current.submitRef).toBe(first);
  });
});
