export type PrefetchHostEvent = 'load' | 'online' | 'pointerdown' | 'keydown';

export interface PrefetchListenerOptions {
  once: true;
  passive?: true;
}

export interface PrefetchHost {
  readonly document: { readonly readyState: DocumentReadyState };
  readonly navigator: { readonly onLine: boolean };
  addEventListener(
    type: PrefetchHostEvent,
    listener: () => void,
    options: PrefetchListenerOptions
  ): void;
}
