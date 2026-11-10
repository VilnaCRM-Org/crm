import { act } from '@testing-library/react';

const settleTransitions = (): Promise<void> =>
  act(async () => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
  });

export default settleTransitions;
