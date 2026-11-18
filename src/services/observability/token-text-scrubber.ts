export default class TokenTextScrubber {
  private readonly patterns: readonly RegExp[] = [
    /(?<=token=)[^&#\s]+/gi,
    /(?<=token%3d)(?:(?!%26|%23)[^&#\s])+/gi,
    /(?<="[\w-]*(?:token|password|secret)"\s*:\s*")(?:\\.|[^"\\])+/gi,
  ];

  public scrub(value: string): string {
    return this.patterns.reduce((text, pattern) => text.replace(pattern, '[redacted]'), value);
  }
}
