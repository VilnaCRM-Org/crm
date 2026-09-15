import React from 'react';

import type { UIErrorBoundaryProps, UIErrorBoundaryState } from '@/components/types/error-boundary';
import pageReloadNavigator from '@/lib/reliability/page-reload-navigator';
import recoveryStrategyDetector from '@/lib/reliability/recovery-strategy-detector';

import ErrorFallback from './error-fallback';

export default class UIErrorBoundary extends React.Component<
  UIErrorBoundaryProps,
  UIErrorBoundaryState
> {
  public override state: UIErrorBoundaryState = { attempt: 0 };

  public static getDerivedStateFromError(error: Error): Partial<UIErrorBoundaryState> {
    return { error, recovery: recoveryStrategyDetector.classify(error) };
  }

  public override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const { onError, reporter, surface } = this.props;
    if (onError) onError(error, info);
    try {
      reporter.report(error, { componentStack: info.componentStack, surface });
    } catch {
      // Telemetry must never mask the error the fallback is already showing.
    }
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
}
