export default class TwoFactorTextScrubber {
  private readonly patterns: readonly RegExp[] = [
    /otpauth:[^\s"']+/gi,
    /(?<=recoveryCodes\\?["']?\s*[=:]\s*)\[[^\]]*\]/gi,
    /(?<=recoveryCodes\\?["']?\s*[=:][\w\s,\\"'-]*,[\s\\"']*)[\w-]+(?![\w-]|\\?["']?\s*[=:])/gi,
    /(?<=(?:pendingSessionId|twoFactorCode|recoveryCodes?)\\?["']?\s*[=:]\s*\\?["']?)[\w-]+/gi,
  ];

  public scrub(value: string): string {
    return this.patterns.reduce((text, pattern) => text.replace(pattern, '[redacted]'), value);
  }
}
