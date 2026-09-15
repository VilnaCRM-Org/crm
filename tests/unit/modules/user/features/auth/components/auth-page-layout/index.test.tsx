import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';

import localization from '@/i18n/localization.json';
import AuthPageLayout from '@/modules/user/features/auth/components/auth-page-layout';
import testI18n from '@tests/i18n/test-i18n';
import { styleRuleFor } from '@tests/unit/utils/emotion-style-rules';

jest.mock('@/styles/theme', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('@/components/ui-back-to-main', () => ({
  __esModule: true,
  default: (): ReactElement => <nav aria-label="back" />,
}));

jest.mock('@/components/ui-footer', () => ({
  __esModule: true,
  default: (): ReactElement => <footer />,
}));

jest.mock('@/components/skeletons/auth-skeleton', () => ({
  __esModule: true,
  default: (): ReactElement => <p>skeleton</p>,
}));

const LEGACY_CONSOLE_PREFIX = 'AuthErrorBoundary caught an error:';
const { error: authError } = localization.en.translation.auth;

function SuspendingChild(): ReactElement {
  throw new Promise<void>((): void => {
    // keep pending to force the suspense fallback
  });
}

function makeControlledChild(): { Child: () => ReactElement; recover: () => void; error: Error } {
  const error = new Error('test chunk-load error');
  let throwing = true;

  return {
    error,
    recover: (): void => {
      throwing = false;
    },
    Child: (): ReactElement => {
      if (throwing) throw error;
      return <p>recovered page</p>;
    },
  };
}

function renderLayout(child: ReactElement, onCaughtError?: jest.Mock): void {
  render(
    <I18nextProvider i18n={testI18n}>
      <AuthPageLayout>{child}</AuthPageLayout>
    </I18nextProvider>,
    { onCaughtError }
  );
}

describe('AuthPageLayout', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the back link, main landmark, child, and footer (AC1)', () => {
    renderLayout(<p>child</p>);

    expect(screen.getByRole('navigation', { name: 'back' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toContainElement(screen.getByText('child'));
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('makes the main landmark a programmatic focus target outside the tab order', () => {
    renderLayout(<p>child</p>);

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('tabindex', '-1');
    expect(main).not.toHaveFocus();
    expect(styleRuleFor(main, ':focus:not(:focus-visible)')?.getPropertyValue('outline')).toBe(
      'none'
    );
    expect(styleRuleFor(main)?.getPropertyValue('outline')).toBe('');
  });

  it('renders the AuthSkeleton fallback while the child suspends (AC2)', () => {
    renderLayout(<SuspendingChild />);

    expect(screen.getByRole('main')).toContainElement(screen.getByText('skeleton'));
    expect(screen.getByRole('navigation', { name: 'back' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('renders the AuthErrorBoundary fallback inside main when the child throws (AC3)', () => {
    const consoleError = jest.spyOn(console, 'error');
    const onCaughtError = jest.fn();
    const { Child, error } = makeControlledChild();

    renderLayout(<Child />, onCaughtError);

    expect(onCaughtError).toHaveBeenCalledTimes(1);
    expect(onCaughtError).toHaveBeenCalledWith(error, expect.anything());
    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByRole('heading', { level: 1, name: authError.title }));
    expect(main).toContainElement(screen.getByRole('alert'));
    expect(screen.getByRole('alert')).toHaveTextContent(authError.default);
    expect(screen.getByRole('button', { name: authError.tryAgain })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'back' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalledWith(
      LEGACY_CONSOLE_PREFIX,
      expect.anything(),
      expect.anything()
    );
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('moves focus to the main landmark once a retry recovers the page', () => {
    const animationFrame = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 0;
      });
    const onCaughtError = jest.fn();
    const { Child, recover } = makeControlledChild();

    renderLayout(<Child />, onCaughtError);

    recover();
    fireEvent.click(screen.getByRole('button', { name: authError.tryAgain }));

    expect(screen.getByText('recovered page')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(animationFrame).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('main')).toHaveFocus();
    expect(onCaughtError).toHaveBeenCalledTimes(1);
  });
});
