import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { SignInDto } from '@/modules/user/types/user/sign-in-dto';
import type GraphQLSignInProvider from '@auth/data-providers/graphql-sign-in-provider';
import type { AuthError } from '@auth/types/auth-error';
import type { AuthStatePatch } from '@auth/types/auth-store';
import type { SignInSubmitContext } from '@auth/types/sign-in/sign-in-submit-context';
import type {
  SignInChallengeOutcome,
  SignInOutcome,
  SignInResult,
  SignInSessionOutcome,
} from '@auth/types/two-factor/sign-in';
import type AuthSecuritySignals from '@auth/utils/auth-security-signals';

const SETTLED: AuthStatePatch = { loginLoading: false };

export class SignInSubmitProcessor {
  public async run(
    context: SignInSubmitContext,
    dto: SignInDto,
    signal: AbortSignal
  ): Promise<boolean> {
    const demo = this.signInDemo(context, dto, signal);
    if (demo !== null) {
      await this.recordSignal(context, demo, signal);
      return true;
    }
    const provider = await context.loader
      .resolve<GraphQLSignInProvider>(AUTH_TOKENS.GraphQLSignInProvider)
      .catch(() => null);
    if (provider === null) return false;
    const result = await provider.login(dto, signal);
    this.settle(context, result, signal);
    await this.recordSignal(context, result, signal);
    return true;
  }

  private signInDemo(
    context: SignInSubmitContext,
    dto: SignInDto,
    signal: AbortSignal
  ): SignInResult | null {
    const demo = signal.aborted ? null : context.demoSession.match(dto);
    if (demo === null) return null;
    const outcome: SignInSessionOutcome = { kind: 'session', ...demo };
    this.startSession(context, outcome);
    context.demoSession.signIn(dto);
    return { ok: true, value: outcome };
  }

  private async recordSignal(
    context: SignInSubmitContext,
    result: SignInResult,
    signal: AbortSignal
  ): Promise<void> {
    if (signal.aborted || (!result.ok && result.error.aborted)) return;
    await context.loader
      .resolve<AuthSecuritySignals>(AUTH_TOKENS.AuthSecuritySignals)
      .then((signals) => signals.loginSettled(result))
      .catch(() => undefined);
  }

  private settle(context: SignInSubmitContext, result: SignInResult, signal: AbortSignal): void {
    if (signal.aborted) context.store.setState(SETTLED);
    else if (result.ok) this.apply(context, result.value);
    else context.store.setState(this.failurePatch(result.error));
  }

  private failurePatch(error: AuthError): AuthStatePatch {
    return error.aborted ? SETTLED : { ...SETTLED, loginError: error };
  }

  private apply(context: SignInSubmitContext, outcome: SignInOutcome): void {
    if (outcome.kind === 'session') this.startSession(context, outcome);
    else this.challenge(context, outcome);
  }

  private endEarlierSession(context: SignInSubmitContext): void {
    if (context.session.token() !== null) context.session.signOut();
  }

  private startSession(context: SignInSubmitContext, outcome: SignInSessionOutcome): void {
    this.endEarlierSession(context);
    context.store.setState({
      ...context.signedOut,
      email: outcome.email,
      token: outcome.token,
      twoFactorStatus: 'disabled',
    });
  }

  private challenge(context: SignInSubmitContext, outcome: SignInChallengeOutcome): void {
    this.endEarlierSession(context);
    context.store.setState({
      ...context.signedOut,
      email: outcome.email,
      pendingSessionId: outcome.pendingSessionId,
    });
  }
}

const signInSubmitProcessor = new SignInSubmitProcessor();

export default signInSubmitProcessor;
