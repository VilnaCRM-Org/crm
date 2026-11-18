import type { Decorator } from '@storybook/react-webpack5';
import { type JSX, useLayoutEffect } from 'react';

const refusingClipboard = {
  writeText: async (): Promise<void> => {
    throw new DOMException('Clipboard write refused', 'NotAllowedError');
  },
};

const acceptingClipboard = {
  writeText: async (): Promise<void> => undefined,
};

function useStubClipboard(stub: typeof refusingClipboard): void {
  useLayoutEffect(() => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: stub,
    });

    return (): void => {
      if (original === undefined) Reflect.deleteProperty(navigator, 'clipboard');
      else Object.defineProperty(navigator, 'clipboard', original);
    };
  }, [stub]);
}

export function useRefusingClipboard(): void {
  useStubClipboard(refusingClipboard);
}

export function withRefusingClipboard(): Decorator {
  return function RefusingClipboardDecorator(Story): JSX.Element {
    useRefusingClipboard();
    return <Story />;
  };
}

export function useAcceptingClipboard(): void {
  useStubClipboard(acceptingClipboard);
}

export function withAcceptingClipboard(): Decorator {
  return function AcceptingClipboardDecorator(Story): JSX.Element {
    useAcceptingClipboard();
    return <Story />;
  };
}
