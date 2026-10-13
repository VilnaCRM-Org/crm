export type PrefetchHostEvent = 'load' | 'online' | 'pointerdown' | 'keydown';

export interface PrefetchListenerOptions {
  once: true;
  passive?: true;
}

export interface PrefetchDocument {
  readonly readyState: DocumentReadyState;
}

export interface PrefetchNavigator {
  readonly onLine: boolean;
}

export interface PrefetchHost {
  readonly document: PrefetchDocument;
  readonly navigator: PrefetchNavigator;
  addEventListener(
    type: PrefetchHostEvent,
    listener: () => void,
    options: PrefetchListenerOptions
  ): void;
  setTimeout(handler: () => void, timeout: number): number;
}
