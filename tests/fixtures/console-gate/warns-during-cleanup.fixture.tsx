import { render } from '@testing-library/react';
import { useEffect } from 'react';

function WarnOnUnmount(): JSX.Element {
  useEffect((): (() => void) => {
    return (): void => {
      console.warn('seeded console-gate defect: warn emitted during testing-library cleanup');
    };
  }, []);

  return <div>mounted</div>;
}

describe('console gate fixture', () => {
  it('emits a warn from the unmount path that runs after the test body', () => {
    render(<WarnOnUnmount />);

    expect(true).toBe(true);
  });
});
