// @jest-environment jsdom

import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';

import RouteFallback from '@/components/route-fallback';

const ANNOUNCE_DELAY_MS = 150;

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

describe('RouteFallback', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('keeps the status region empty until the announce delay elapses', () => {
    render(<RouteFallback />);
    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();

    act(() => {
      jest.advanceTimersByTime(ANNOUNCE_DELAY_MS);
    });

    expect(status).toHaveTextContent('route_fallback.loading');
  });

  it('renders the aria-hidden spinner from the grey-pill loader design', () => {
    render(<RouteFallback />);
    const spinner = screen.getByRole('progressbar', { hidden: true });
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
  });
});
