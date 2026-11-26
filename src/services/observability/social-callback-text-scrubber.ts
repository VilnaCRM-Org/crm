export default class SocialCallbackTextScrubber {
  private readonly encodedLetter = /%(?:25)?([46][1-9a-f]|[57][0-9a])/gi;

  private readonly patterns: readonly RegExp[] = [
    /(?<=(?:^|[?&\s])(?:code|state)=)[^&#\s]+/gi,
    /(?<=(?:%3f|%26)(?:code|state)%3d)(?:(?!%26|%23)[^&#\s])+/gi,
  ];

  public scrub(value: string): string {
    const decoded = this.decodeLetters(value);
    const redacted = this.redact(decoded);
    return redacted === decoded ? value : redacted;
  }

  private redact(value: string): string {
    return this.patterns.reduce((text, pattern) => text.replace(pattern, '[redacted]'), value);
  }

  private decodeLetters(value: string): string {
    return value.replace(this.encodedLetter, (_match, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16))
    );
  }
}
