// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import React, { type JSX, type ReactNode, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';

import UIErrorBoundary from '@/components/error-boundary/ui-error-boundary';
import type { ErrorFallbackProps } from '@/components/types/error-boundary';
import pageReloadNavigator from '@/lib/reliability/page-reload-navigator';
import type { ErrorReporter } from '@/services/types/error-reporting';

import createLocaleI18n from '../../utils/create-locale-i18n';
import renderWithProviders from '../../utils/render-with-providers';

const HEADING = 'Something went wrong';
const TRY_AGAIN = 'Try again';
const RELOAD = 'Reload the page';
const GO_HOME = 'Go to homepage';
const UNEXPECTED = 'An unexpected error occurred. You can try again or go to the homepage.';
const CHUNK_LOAD = 'Part of the page failed to load. Reload the page to get the latest version.';

function Bomb({ error }: { error: unknown }): JSX.Element {
  throw error;
}

function makeControlledChild(initiallyThrowing: boolean): {
  Child: () => JSX.Element;
  setThrowing: (value: boolean) => void;
  error: Error;
} {
  const error = new Error('controlled');
  let throwing = initiallyThrowing;

  return {
    error,
    setThrowing: (value: boolean): void => {
      throwing = value;
    },
    Child: (): JSX.Element => {
      if (throwing) throw error;
      return (
        <main tabIndex={-1}>
          <h1 tabIndex={-1}>Recovered</h1>
        </main>
      );
    },
  };
}

const englishI18n = createLocaleI18n('en');

function EnglishProvider({ children }: { children: ReactNode }): JSX.Element {
  return <I18nextProvider i18n={englishI18n}>{children}</I18nextProvider>;
}

function fakeAnimationFrame(): jest.SpyInstance {
  return jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(0);
    return 0;
  });
}

function renderCustomReload({ reload: reloadPage }: ErrorFallbackProps): JSX.Element {
  return (
    <button type="button" onClick={reloadPage}>
      custom reload
    </button>
  );
}

const focusNode = (node: HTMLButtonElement | null): void => {
  node?.focus();
};

describe('UIErrorBoundary', () => {
  let reporter: ErrorReporter;
  let onCaughtError: jest.Mock;

  beforeEach(() => {
    reporter = { report: jest.fn() };
    onCaughtError = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders its children while nothing throws', () => {
    renderWithProviders(
      <UIErrorBoundary surface="app" reporter={reporter}>
        <span>healthy</span>
      </UIErrorBoundary>
    );

    expect(screen.getByText('healthy')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(reporter.report).not.toHaveBeenCalled();
  });

  it('classifies a thrown Error and renders the accessible fallback in a main landmark', () => {
    const error = new Error('boom');

    renderWithProviders(
      <UIErrorBoundary surface="app" reporter={reporter}>
        <Bomb error={error} />
      </UIErrorBoundary>,
      { onCaughtError }
    );

    expect(onCaughtError).toHaveBeenCalledTimes(1);
    expect(onCaughtError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ componentStack: expect.any(String) })
    );
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: HEADING })).toHaveFocus();
    expect(screen.getByRole('alert')).toHaveTextContent(UNEXPECTED);
    expect(screen.getByRole('button', { name: TRY_AGAIN })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: GO_HOME })).toHaveAttribute('href', '/');
  });

  it('reports the error once with the component stack and the surface', () => {
    const error = new Error('boom');

    renderWithProviders(
      <UIErrorBoundary surface="checkout" reporter={reporter}>
        <Bomb error={error} />
      </UIErrorBoundary>,
      { onCaughtError }
    );

    expect(reporter.report).toHaveBeenCalledTimes(1);
    expect(reporter.report).toHaveBeenCalledWith(error, {
      componentStack: expect.any(String),
      surface: 'checkout',
    });
    expect(onCaughtError).toHaveBeenCalledTimes(1);
  });

  it('keeps the fallback up when the reporter itself throws', () => {
    const throwingReporter: ErrorReporter = {
      report: jest.fn(() => {
        throw new Error('reporter exploded');
      }),
    };

    renderWithProviders(
      <UIErrorBoundary surface="app" reporter={throwingReporter}>
        <Bomb error={new Error('boom')} />
      </UIErrorBoundary>,
      { onCaughtError }
    );

    expect(throwingReporter.report).toHaveBeenCalledTimes(1);
    expect(onCaughtError).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { level: 1, name: HEADING })).toBeInTheDocument();
  });

  it('calls onError with the error and the component stack before reporting', () => {
    const error = new Error('boom');
    const calls: string[] = [];
    const onError = jest.fn(() => calls.push('onError'));
    reporter = { report: jest.fn(() => calls.push('report')) };

    renderWithProviders(
      <UIErrorBoundary surface="app" reporter={reporter} onError={onError}>
        <Bomb error={error} />
      </UIErrorBoundary>,
      { onCaughtError }
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ componentStack: expect.any(String) })
    );
    expect(calls).toEqual(['onError', 'report']);
  });

  it('lets a throwing onError propagate to the enclosing boundary', () => {
    const onErrorFailure = new Error('onError exploded');
    const outerReporter: ErrorReporter = { report: jest.fn() };
    const onError = jest.fn(() => {
      throw onErrorFailure;
    });

    renderWithProviders(
      <UIErrorBoundary surface="outer" reporter={outerReporter}>
        <UIErrorBoundary surface="inner" reporter={reporter} onError={onError}>
          <Bomb error={new Error('boom')} />
        </UIErrorBoundary>
      </UIErrorBoundary>,
      { onCaughtError }
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(outerReporter.report).toHaveBeenCalledWith(onErrorFailure, {
      componentStack: expect.any(String),
      surface: 'outer',
    });
    expect(onCaughtError).toHaveBeenCalledWith(onErrorFailure, expect.anything());
  });

  it('resets, re-renders the children and moves focus to the recovered main landmark', () => {
    const animationFrame = fakeAnimationFrame();
    const { Child, setThrowing, error } = makeControlledChild(true);

    renderWithProviders(
      <UIErrorBoundary surface="app" reporter={reporter}>
        <Child />
      </UIErrorBoundary>,
      { onCaughtError }
    );

    expect(onCaughtError).toHaveBeenCalledTimes(1);
    expect(onCaughtError).toHaveBeenCalledWith(error, expect.anything());
    expect(animationFrame).not.toHaveBeenCalled();

    setThrowing(false);
    fireEvent.click(screen.getByRole('button', { name: TRY_AGAIN }));

    expect(screen.getByRole('heading', { level: 1, name: 'Recovered' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(animationFrame).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('falls back to a focusable h1 when the recovered tree has no main landmark', () => {
    fakeAnimationFrame();
    let throwing = true;

    function Child(): JSX.Element {
      if (throwing) throw new Error('boom');
      return <h1 tabIndex={-1}>Recovered heading</h1>;
    }

    renderWithProviders(
      <UIErrorBoundary surface="app" reporter={reporter}>
        <Child />
      </UIErrorBoundary>,
      { onCaughtError }
    );

    throwing = false;
    fireEvent.click(screen.getByRole('button', { name: TRY_AGAIN }));

    expect(screen.getByRole('heading', { level: 1, name: 'Recovered heading' })).toHaveFocus();
  });

  it('tolerates a recovered tree with no focus target at all', () => {
    const animationFrame = fakeAnimationFrame();
    let throwing = true;

    function Child(): JSX.Element {
      if (throwing) throw new Error('boom');
      return <span>plain recovered content</span>;
    }

    renderWithProviders(
      <UIErrorBoundary surface="app" reporter={reporter}>
        <Child />
      </UIErrorBoundary>,
      { onCaughtError }
    );

    throwing = false;
    fireEvent.click(screen.getByRole('button', { name: TRY_AGAIN }));

    expect(animationFrame).toHaveBeenCalledTimes(1);
    expect(screen.getByText('plain recovered content')).toBeInTheDocument();
    expect(document.body).toHaveFocus();
  });

  it('leaves focus with a recovered subtree that focused itself on mount', () => {
    fakeAnimationFrame();
    let throwing = true;

    function Child(): JSX.Element {
      if (throwing) throw new Error('boom');
      return (
        <main tabIndex={-1}>
          <button type="button" ref={focusNode}>
            recovered action
          </button>
        </main>
      );
    }

    renderWithProviders(
      <UIErrorBoundary surface="app" reporter={reporter}>
        <Child />
      </UIErrorBoundary>,
      { onCaughtError }
    );

    throwing = false;
    fireEvent.click(screen.getByRole('button', { name: TRY_AGAIN }));

    expect(screen.getByRole('button', { name: 'recovered action' })).toHaveFocus();
    expect(screen.getByRole('main')).not.toHaveFocus();
  });

  it('never schedules a focus move on a healthy re-render', () => {
    const animationFrame = fakeAnimationFrame();

    const view = render(
      <UIErrorBoundary surface="app" reporter={reporter}>
        <span>first</span>
      </UIErrorBoundary>,
      { wrapper: EnglishProvider }
    );
    view.rerender(
      <UIErrorBoundary surface="app" reporter={reporter}>
        <span>second</span>
      </UIErrorBoundary>
    );

    expect(screen.getByText('second')).toBeInTheDocument();
    expect(animationFrame).not.toHaveBeenCalled();
  });

  it('never schedules a focus move while the error state persists across a re-render', () => {
    const animationFrame = fakeAnimationFrame();
    const error = new Error('boom');

    const view = render(
      <UIErrorBoundary surface="app" reporter={reporter}>
        <Bomb error={error} />
      </UIErrorBoundary>,
      { wrapper: EnglishProvider, onCaughtError }
    );
    view.rerender(
      <UIErrorBoundary surface="app" reporter={reporter}>
        <Bomb error={error} />
      </UIErrorBoundary>
    );

    expect(screen.getByRole('heading', { level: 1, name: HEADING })).toBeInTheDocument();
    expect(onCaughtError).toHaveBeenCalledTimes(1);
    expect(animationFrame).not.toHaveBeenCalled();
  });

  it('remounts the fallback when the retry throws again, so focus and the alert repeat', () => {
    fakeAnimationFrame();
    const error = new Error('still broken');

    renderWithProviders(
      <UIErrorBoundary surface="app" reporter={reporter}>
        <Bomb error={error} />
      </UIErrorBoundary>,
      { onCaughtError }
    );

    const firstHeading = screen.getByRole('heading', { level: 1, name: HEADING });
    const firstAlert = screen.getByRole('alert');
    screen.getByRole('link', { name: GO_HOME }).focus();
    expect(firstHeading).not.toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: TRY_AGAIN }));

    const secondHeading = screen.getByRole('heading', { level: 1, name: HEADING });
    expect(secondHeading).not.toBe(firstHeading);
    expect(screen.getByRole('alert')).not.toBe(firstAlert);
    expect(secondHeading).toHaveFocus();
    expect(onCaughtError).toHaveBeenCalledTimes(2);
    expect(reporter.report).toHaveBeenCalledTimes(2);
  });

  it('counts every reset attempt in its state', () => {
    fakeAnimationFrame();
    const boundary = React.createRef<UIErrorBoundary>();

    renderWithProviders(
      <UIErrorBoundary ref={boundary} surface="app" reporter={reporter}>
        <Bomb error={new Error('boom')} />
      </UIErrorBoundary>,
      { onCaughtError }
    );

    expect(boundary.current?.state).toEqual({
      error: expect.any(Error),
      recovery: expect.objectContaining({ strategy: 'reset' }),
      attempt: 0,
    });

    fireEvent.click(screen.getByRole('button', { name: TRY_AGAIN }));
    expect(boundary.current?.state.attempt).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: TRY_AGAIN }));
    expect(boundary.current?.state.attempt).toBe(2);
  });

  it('offers a full reload through the page navigator for a chunk-load failure', () => {
    const reload = jest.spyOn(pageReloadNavigator, 'reload').mockImplementation(() => undefined);

    renderWithProviders(
      <UIErrorBoundary surface="app" reporter={reporter}>
        <Bomb error={new Error('Loading chunk 3 failed.')} />
      </UIErrorBoundary>,
      { onCaughtError }
    );

    expect(screen.getByRole('alert')).toHaveTextContent(CHUNK_LOAD);
    expect(screen.queryByRole('button', { name: TRY_AGAIN })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: RELOAD }));

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('hands a custom fallback renderer the classified recovery and the actions', () => {
    fakeAnimationFrame();
    const error = new Error('boom');
    const mounts = jest.fn();

    function CustomFallback({ label, reset }: { label: string; reset: () => void }): JSX.Element {
      useEffect(() => {
        mounts();
      }, []);
      return (
        <button type="button" onClick={reset}>
          custom {label}
        </button>
      );
    }

    const fallback = jest.fn(({ recovery, reset }: ErrorFallbackProps) => (
      <CustomFallback label={recovery.strategy} reset={reset} />
    ));

    renderWithProviders(
      <UIErrorBoundary surface="app" reporter={reporter} fallback={fallback}>
        <Bomb error={error} />
      </UIErrorBoundary>,
      { onCaughtError }
    );

    expect(fallback).toHaveBeenCalledWith({
      error,
      recovery: {
        recoverable: true,
        strategy: 'reset',
        messageKey: 'error_boundary.unexpected',
        severity: 'error',
        cause: error,
      },
      reset: expect.any(Function),
      reload: expect.any(Function),
      landmark: 'main',
    });
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(mounts).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'custom reset' }));

    expect(screen.getByRole('button', { name: 'custom reset' })).toBeInTheDocument();
    expect(mounts).toHaveBeenCalledTimes(2);
    expect(onCaughtError).toHaveBeenCalledTimes(2);
  });

  it('routes the custom renderer reload action through the page navigator', () => {
    const reload = jest.spyOn(pageReloadNavigator, 'reload').mockImplementation(() => undefined);

    renderWithProviders(
      <UIErrorBoundary surface="app" reporter={reporter} fallback={renderCustomReload}>
        <Bomb error={new Error('boom')} />
      </UIErrorBoundary>,
      { onCaughtError }
    );

    fireEvent.click(screen.getByRole('button', { name: 'custom reload' }));

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
