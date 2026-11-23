import type { TileFocus, TileControlBox } from '../types/components/social-networks';

export default class TileFocusHandler implements TileFocus {
  public readonly controlRef: TileControlBox = { current: null };

  private lost = false;

  public readonly attach = (node: HTMLButtonElement | null): (() => void) => {
    this.controlRef.current = node;
    return (): void => {
      this.lost = document.activeElement === node;
    };
  };

  public restore(): void {
    if (this.lost) this.controlRef.current?.focus();
    this.lost = false;
  }
}
