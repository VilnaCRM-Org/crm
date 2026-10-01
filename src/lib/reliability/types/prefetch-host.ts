export interface PrefetchHost {
  readonly document: { readonly readyState: DocumentReadyState };
  readonly navigator: { readonly onLine: boolean };
  addEventListener(type: 'load' | 'online', listener: () => void, options: { once: true }): void;
  setTimeout(handler: () => void, timeout: number): number;
}
