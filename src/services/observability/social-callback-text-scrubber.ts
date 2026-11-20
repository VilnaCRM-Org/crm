export default class SocialCallbackTextScrubber {
  private readonly patterns: readonly RegExp[] = [
    /(?<=(?:^|[?&\s])(?:code|state)=)[^&#\s]+/gi,
    /(?<=(?:%3f|%26)(?:code|state)%3d)(?:(?!%26|%23)[^&#\s])+/gi,
  ];

  public scrub(value: string): string {
    return this.patterns.reduce((text, pattern) => text.replace(pattern, '[redacted]'), value);
  }
}
