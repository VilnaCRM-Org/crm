import TokenTextScrubber from './token-text-scrubber';
import TwoFactorTextScrubber from './two-factor-text-scrubber';

export default class PiiTextScrubber {
  private readonly twoFactor = new TwoFactorTextScrubber();

  private readonly tokens = new TokenTextScrubber();

  private readonly patterns: readonly RegExp[] = [
    /[^\s@]+@[^\s@]+\.[^\s@]+/g,
    /bearer\s+[\w.\-~+/]+=*/gi,
    /eyJ[\w-]+\.[\w-]+\.[\w-]+/g,
  ];

  public scrub(value: string): string {
    return this.tokens.scrub(
      this.patterns.reduce(
        (text, pattern) => text.replace(pattern, '[redacted]'),
        this.twoFactor.scrub(value)
      )
    );
  }
}
