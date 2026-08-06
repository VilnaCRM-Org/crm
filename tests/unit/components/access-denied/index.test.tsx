// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

import AccessDenied from '@/components/access-denied';
import localization from '@/i18n/localization.json';
import ROUTE_PATHS from '@/routes/route-paths';
import { paletteColors } from '@/styles/colors';
import renderWithProviders from '@tests/unit/utils/render-with-providers';

const COPY = localization.en.translation.access_denied;
const TITLE_SUFFIX = ' - VilnaCRM';

function focusedElement(): HTMLElement {
  return document.activeElement as HTMLElement;
}

describe('AccessDenied', () => {
  it('renders the localized title as the only level-one heading', () => {
    renderWithProviders(<AccessDenied />);

    const heading = screen.getByRole('heading', { level: 1, name: COPY.title });
    expect(heading).toHaveTextContent(COPY.title);
    expect(heading).toHaveClass('MuiTypography-h4');
  });

  it('renders the localized description', () => {
    renderWithProviders(<AccessDenied />);

    expect(screen.getByText(COPY.description)).toBeInTheDocument();
  });

  it('renders a link to the home route whose accessible name is the localized cta', () => {
    renderWithProviders(<AccessDenied />);

    const link = screen.getByRole('link', { name: COPY.cta });
    expect(link).toHaveAttribute('href', ROUTE_PATHS.home);
    expect(link).toHaveTextContent(COPY.cta);
  });

  it('moves focus to the wrapper around the heading on mount (WCAG 2.4.3)', () => {
    renderWithProviders(<AccessDenied />);

    const heading = screen.getByRole('heading', { level: 1 });
    const focused = focusedElement();
    expect(document.body).not.toHaveFocus();
    expect(focused).toHaveAttribute('tabindex', '-1');
    expect(focused).toContainElement(heading);
  });

  it('paints a visible focus indicator on the focused wrapper (WCAG 2.4.7)', () => {
    renderWithProviders(<AccessDenied />);

    const styles = window.getComputedStyle(focusedElement());
    expect(styles.outline).toBe(`2px solid ${paletteColors.primary.main}`);
    expect(styles.outlineOffset).toBe('2px');
  });

  it('sets the document title from the localized page title', () => {
    document.title = 'stale';

    renderWithProviders(<AccessDenied />);

    expect(document.title).toBe(`${COPY.title}${TITLE_SUFFIX}`);
  });

  it('does not announce itself as an alert', () => {
    renderWithProviders(<AccessDenied />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
