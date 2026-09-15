import React from 'react';

import type { UIErrorBoundaryProps, UIErrorBoundaryState } from '@/components/types/error-boundary';
import pageReloadNavigator from '@/lib/reliability/page-reload-navigator';
import recoveryStrategyDetector from '@/lib/reliability/recovery-strategy-detector';

import ErrorFallback from './error-fallback';

function toError(thrown: unknown): Error {
  return thrown instanceof Error ? thrown : new Error(String(thrown));
}

export default class UIErrorBoundary extends React.Component<
  UIErrorBoundaryProps,
  UIErrorBoundaryState
> {
  public override state: UIErrorBoundaryState = { attempt: 0 };

  public static getDerivedStateFromError(thrown: unknown): Partial<UIErrorBoundaryState> {
    return { error: toError(thrown), recovery: recoveryStrategyDetector.classify(thrown) };
  }

  public override componentDidCatch(thrown: unknown, info: React.ErrorInfo): void {
    const error = toError(thrown);
    this.notify(error, info);
    this.report(error, { componentStack: info.componentStack });
  }

  public override componentDidUpdate(
    _prevProps: UIErrorBoundaryProps,
    prevState: UIErrorBoundaryState
  ): void {
    if (prevState.error && !this.state.error) {
      window.requestAnimationFrame(() => {
        if (document.activeElement !== document.body) return;
        document.querySelector<HTMLElement>('main[tabindex="-1"], h1[tabindex="-1"]')?.focus();
      });
    }
  }

  public handleReset = (): void => {
    this.setState((previous) => ({
      error: undefined,
      recovery: undefined,
      attempt: previous.attempt + 1,
    }));
  };

  public override render(): React.ReactNode {
    const { error, recovery, attempt } = this.state;
    if (recovery === undefined) return this.props.children;

    const { fallback } = this.props;
    const reload = this.reloadPage;
    if (fallback) {
      return (
        <React.Fragment key={attempt}>
          {fallback({ error, recovery, reset: this.handleReset, reload, landmark: 'main' })}
        </React.Fragment>
      );
    }
    return (
      <ErrorFallback
        key={attempt}
        error={error}
        recovery={recovery}
        reset={this.handleReset}
        reload={reload}
        landmark="main"
      />
    );
  }

  private readonly reloadPage = (): void => {
    pageReloadNavigator.reload();
  };

  private notify(error: Error, info: React.ErrorInfo): void {
    const { onError } = this.props;
    if (!onError) return;
    try {
      onError(error, info);
    } catch (failure) {
      this.report(toError(failure), { stage: 'onError' });
    }
  }

  private report(error: Error, context: Record<string, unknown>): void {
    try {
      this.props.reporter.report(error, { ...context, surface: this.props.surface });
    } catch {
      // Telemetry must never mask the error the fallback is already showing.
    }
  }
}
