export default class PiiTextScrubber {
  private readonly patterns: readonly RegExp[] = [
    /otpauth:[^\s"']+/gi,
    /[^\s@]+@[^\s@]+\.[^\s@]+/g,
    /bearer\s+[\w.\-~+/]+=*/gi,
    /eyJ[\w-]+\.[\w-]+\.[\w-]+/g,
    /(?<=token=)[^&#\s]+/gi,
    /(?<=token%3d)(?:(?!%26|%23)[^&#\s])+/gi,
    /(?<="[\w-]*(?:token|password|secret)"\s*:\s*")(?:\\.|[^"\\])+/gi,
    /(?<=recoveryCodes\\?["']?\s*[=:]\s*)\[[^\]]*\]/gi,
    /(?<=recoveryCodes\\?["']?\s*[=:][\w\s,\\"'-]*,[\s\\"']*)[\w-]+(?![\w-]|\\?["']?\s*[=:])/gi,
    /(?<=(?:pendingSessionId|twoFactorCode|recoveryCodes?)\\?["']?\s*[=:]\s*\\?["']?)[\w-]+/gi,
  ];

  public scrub(value: string): string {
    return this.patterns.reduce((text, pattern) => text.replace(pattern, '[redacted]'), value);
  }
}
