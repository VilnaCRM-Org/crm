interface ResizeObserverStub {
  readonly observed: Element[];
  readonly instances: () => number;
  readonly disconnect: jest.Mock;
  readonly fire: () => void;
}

const stubResizeObserver = (): ResizeObserverStub => {
  const observed: Element[] = [];
  const callbacks: ResizeObserverCallback[] = [];
  const disconnect = jest.fn();

  class FakeResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      callbacks.push(callback);
    }

    public observe(target: Element): void {
      observed.push(target);
    }

    public unobserve(): void {
      return undefined;
    }

    public disconnect(): void {
      disconnect();
    }
  }

  window.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;

  return {
    observed,
    instances: (): number => callbacks.length,
    disconnect,
    fire: (): void =>
      callbacks.forEach((callback) => callback([], {} as unknown as ResizeObserver)),
  };
};

export const removeResizeObserver = (): void => {
  Reflect.deleteProperty(window, 'ResizeObserver');
};

export default stubResizeObserver;
