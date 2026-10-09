export interface CloseTimer {
  scheduleClose: (fn: () => void, delayMs: number) => void;
}
