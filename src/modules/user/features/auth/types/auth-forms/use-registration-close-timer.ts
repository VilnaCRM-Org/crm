export type CloseTimer = {
  scheduleClose: (fn: () => void, delayMs: number) => void;
};
