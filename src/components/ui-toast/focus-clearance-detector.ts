export default class FocusClearanceDetector {
  private clear: Element | null = null;

  private viewport = { width: window.innerWidth, height: window.innerHeight };

  constructor(private readonly stack: HTMLElement) {}

  public focused(): Element | null {
    const focused = document.activeElement ?? document.body;
    return focused === document.body || this.stack.contains(focused) ? null : focused;
  }

  public lastClear(): Element | null {
    return this.clear;
  }

  public settle(top: number): void {
    this.viewport = { width: window.innerWidth, height: window.innerHeight };
    this.remember(top);
  }

  public follow(): void {
    const { width, height } = this.viewport;
    if (width !== window.innerWidth || height !== window.innerHeight) return;
    this.remember(this.stack.getBoundingClientRect().top);
  }

  private remember(top: number): void {
    const focused = this.focused();
    const bottom = focused?.getBoundingClientRect().bottom ?? 0;
    this.clear = bottom > 0 && bottom <= top ? focused : null;
  }
}
