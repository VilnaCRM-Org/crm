import { act } from '@testing-library/react';

type MediaListener = () => void;

interface LiveViewport {
  readonly resize: (width: number) => void;
}

const stubLiveViewportWidth = (initial: number): LiveViewport => {
  let width = initial;
  const listeners = new Set<MediaListener>();

  window.matchMedia = ((query: string) => {
    const minWidth = Number(/min-width:\s*(\d+)px/u.exec(query)?.[1]);

    return {
      get matches(): boolean {
        return width >= minWidth;
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: MediaListener): void => {
        listeners.add(listener);
      },
      removeEventListener: (_type: string, listener: MediaListener): void => {
        listeners.delete(listener);
      },
      addListener: (listener: MediaListener): void => {
        listeners.add(listener);
      },
      removeListener: (listener: MediaListener): void => {
        listeners.delete(listener);
      },
      dispatchEvent: (): boolean => true,
    };
  }) as unknown as typeof window.matchMedia;

  return {
    resize: (next: number): void => {
      width = next;
      act(() => listeners.forEach((listener) => listener()));
    },
  };
};

export default stubLiveViewportWidth;
