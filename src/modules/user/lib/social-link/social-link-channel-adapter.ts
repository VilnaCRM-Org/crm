import type {
  SocialLinkAnswer,
  SocialLinkAnswerSettler,
  SocialLinkAttempt,
  SocialLinkCallback,
} from '../../types/social-link/social-link-callback';

const CHANNEL_NAME = 'crm.socialLink';

const REFUSED: SocialLinkAnswer = { kind: 'refused' };

const MISSING: SocialLinkAnswer = { kind: 'missing' };

const MALFORMED: SocialLinkAnswer = { kind: 'malformed' };

class SocialLinkChannelAdapter {
  public post(callback: SocialLinkCallback): void {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(callback);
    channel.close();
  }

  public next(attempt: SocialLinkAttempt, signal: AbortSignal): Promise<SocialLinkAnswer | null> {
    if (signal.aborted) return Promise.resolve(null);
    return new Promise((resolve) => this.listen(attempt, signal, resolve));
  }

  private listen(
    attempt: SocialLinkAttempt,
    signal: AbortSignal,
    resolve: SocialLinkAnswerSettler
  ): void {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    const settle: SocialLinkAnswerSettler = (answer) => {
      channel.close();
      resolve(answer);
    };
    channel.onmessage = ({ data }: MessageEvent<unknown>): void => {
      const answer = this.answerOf(data, attempt);
      if (answer !== null) settle(answer);
    };
    signal.addEventListener('abort', () => settle(null));
  }

  private answerOf(data: unknown, { provider, state }: SocialLinkAttempt): SocialLinkAnswer | null {
    const callback = Object(data) as Partial<Record<keyof SocialLinkCallback, unknown>>;
    if (callback.provider !== provider || callback.state !== state) return null;
    return this.readingOf(callback.code, callback.error);
  }

  private readingOf(code: unknown, error: unknown): SocialLinkAnswer {
    if (!this.isNullableText(code) || !this.isNullableText(error)) return MALFORMED;
    if (error !== null) return REFUSED;
    return code === null || code.trim() === '' ? MISSING : { kind: 'code', code };
  }

  private isNullableText(value: unknown): value is string | null {
    return value === null || typeof value === 'string';
  }
}

const socialLinkChannelAdapter = new SocialLinkChannelAdapter();

export default socialLinkChannelAdapter;
