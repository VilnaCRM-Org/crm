import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { SignInDto } from '@/modules/user/types/user/sign-in-dto';
import type GraphQLSignInProvider from '@auth/data-providers/graphql-sign-in-provider';
import type { AuthStatePatch } from '@auth/types/auth-store';
import type { SignInSubmitContext } from '@auth/types/sign-in/sign-in-submit-context';
import type { SignInOutcome, SignInResult } from '@auth/types/two-factor/sign-in';
import type AuthSecuritySignals from '@auth/utils/auth-security-signals';

const SETTLED: AuthStatePatch = { loginLoading: false };

export class SignInSubmitHandler {
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
    context.store.setState(this.patchOfResult(result));
    await this.recordSignal(context, result, signal);
    return true;
  }

  private signInDemo(
    context: SignInSubmitContext,
    dto: SignInDto,
    signal: AbortSignal
  ): SignInResult | null {
    const demo = signal.aborted ? null : context.demoSession.signIn(dto);
    if (demo === null) return null;
    const outcome: SignInOutcome = { kind: 'session', ...demo };
    context.store.setState(this.patchOf(outcome));
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

  private patchOfResult(result: SignInResult): AuthStatePatch {
    if (result.ok) return this.patchOf(result.value);
    return result.error.aborted ? SETTLED : { ...SETTLED, loginError: result.error };
  }

  private patchOf(outcome: SignInOutcome): AuthStatePatch {
    if (outcome.kind === 'session') {
      return {
        ...SETTLED,
        loginError: null,
        email: outcome.email,
        token: outcome.token,
        twoFactorStatus: 'disabled',
      };
    }
    return {
      ...SETTLED,
      loginError: null,
      email: outcome.email,
      pendingSessionId: outcome.pendingSessionId,
    };
  }
}

const signInSubmitHandler = new SignInSubmitHandler();

export default signInSubmitHandler;
