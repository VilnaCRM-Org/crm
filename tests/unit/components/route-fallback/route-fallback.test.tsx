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
    act(() => {
      jest.runOnlyPendingTimers();
    });
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

  it('keeps the spinner decorative and out of the eager MUI graph', () => {
    render(<RouteFallback />);

    act(() => {
      jest.advanceTimersByTime(ANNOUNCE_DELAY_MS);
    });

    // The grey-pill spinner is a dependency-free CSS ring marked aria-hidden, so the only
    // a11y-exposed node is the single status region.
    expect(screen.getAllByRole('status')).toHaveLength(1);

    // Regression guard (issue #117): a MUI CircularProgress here would re-add
    // CircularProgress + useMediaQuery to the eager bundle and breach the mobile budget.
    expect(screen.queryByRole('progressbar', { hidden: true })).not.toBeInTheDocument();
  });
});
