export const noop = (): undefined => undefined;

export const noopAsync = (): Promise<void> => Promise.resolve();
