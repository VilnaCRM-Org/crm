import type { Decorator } from '@storybook/react-webpack5';
import { type JSX, useLayoutEffect } from 'react';

const refusingClipboard = {
  writeText: async (): Promise<void> => {
    throw new DOMException('Clipboard write refused', 'NotAllowedError');
  },
};

export function withRefusingClipboard(): Decorator {
  return function RefusingClipboardDecorator(Story): JSX.Element {
    useLayoutEffect(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: refusingClipboard,
      });

      return (): void => {
        Reflect.deleteProperty(navigator, 'clipboard');
      };
    }, []);
    return <Story />;
  };
}
