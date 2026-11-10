import TwoFactorTextScrubber from './two-factor-text-scrubber';

export default class PiiTextScrubber {
  private readonly twoFactor = new TwoFactorTextScrubber();

  private readonly patterns: readonly RegExp[] = [
    /[^\s@]+@[^\s@]+\.[^\s@]+/g,
    /bearer\s+[\w.\-~+/]+=*/gi,
    /eyJ[\w-]+\.[\w-]+\.[\w-]+/g,
    /(?<=token=)[^&#\s]+/gi,
    /(?<=token%3d)(?:(?!%26|%23)[^&#\s])+/gi,
    /(?<="[\w-]*(?:token|password|secret)"\s*:\s*")(?:\\.|[^"\\])+/gi,
  ];

  public scrub(value: string): string {
    return this.patterns.reduce(
      (text, pattern) => text.replace(pattern, '[redacted]'),
      this.twoFactor.scrub(value)
    );
  }
}
