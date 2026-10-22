export interface BlurHold {
  readonly held: boolean;
  readonly onBlur: (() => void) | undefined;
}
