import type { Decorator } from '@storybook/react-webpack5';
import { type JSX, useLayoutEffect } from 'react';

const refusingClipboard = {
  writeText: async (): Promise<void> => {
    throw new DOMException('Clipboard write refused', 'NotAllowedError');
  },
};

export function useRefusingClipboard(): void {
  useLayoutEffect(() => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: refusingClipboard,
    });

    return (): void => {
      if (original === undefined) Reflect.deleteProperty(navigator, 'clipboard');
      else Object.defineProperty(navigator, 'clipboard', original);
    };
  }, []);
}

export function withRefusingClipboard(): Decorator {
  return function RefusingClipboardDecorator(Story): JSX.Element {
    useRefusingClipboard();
    return <Story />;
  };
}
