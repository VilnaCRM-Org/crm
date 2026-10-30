import '@testing-library/jest-dom';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';

import navigationItems from '@/components/ui-app-shell/navigation-items';
import UISidebar from '@/components/ui-sidebar';
import featureFlagService from '@/config/runtime/feature-flag-service';
import { mediaStyleRuleFor, styleRuleFor } from '@tests/unit/utils/emotion-style-rules';
import renderShell from '@tests/unit/utils/render-shell';
import ShellLocation from '@tests/unit/utils/shell-location';

type SidebarProps = Parameters<typeof UISidebar>[0];

const renderSidebar = (
  props: Partial<SidebarProps> = {},
  path = '/',
  locale: 'en' | 'uk' = 'en'
): ReturnType<typeof renderShell> =>
  renderShell(
    <Routes>
      <Route
        path="*"
        element={
          <>
            <UISidebar
              layout={props.layout ?? 'desktop'}
              items={props.items ?? navigationItems}
              signOut={props.signOut ?? jest.fn()}
            />
            <ShellLocation />
          </>
        }
      />
    </Routes>,
    { path, locale }
  );

describe('UISidebar', () => {
  beforeEach(() => {
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('is one navigation landmark named Main navigation holding one ordered list', () => {
    renderSidebar();

    const nav = screen.getByRole('navigation', { name: 'Main navigation' });

    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    expect(within(nav).getAllByRole('list')).toHaveLength(1);
    expect(within(nav).getByRole('list').tagName).toBe('OL');
    expect(within(nav).getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('names the landmark in uk', () => {
    renderSidebar({}, '/', 'uk');

    expect(screen.getByRole('navigation', { name: 'Основна навігація' })).toBeInTheDocument();
  });

  it.each([
    ['desktop', '791px'],
    ['tablet', '1142px'],
  ] as const)('draws the %s panel %s tall with its border and radius', (layout, height) => {
    renderSidebar({ layout });

    expect(screen.getByRole('navigation')).toHaveStyle({
      height,
      border: '1px solid #E1E7EA',
      borderRadius: '12px',
      backgroundColor: '#FFFFFF',
    });
  });

  it('keeps the whole panel on short viewports by capping its height', () => {
    renderSidebar();

    expect(styleRuleFor(screen.getByRole('navigation'))?.getPropertyValue('max-height')).toBe(
      'calc(100vh - 86px)'
    );
  });

  it('shows the handle first in DOM order, expanded, before the navigation', () => {
    renderSidebar();

    const handle = screen.getByRole('button', { name: 'Collapse sidebar' });
    const nav = screen.getByRole('navigation');

    expect(handle).toHaveAttribute('aria-expanded', 'true');
    expect(handle.compareDocumentPosition(nav)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it.each(['desktop', 'tablet'] as const)(
    'collapses the %s sidebar to the rail and expands it again from the handle',
    async (layout) => {
      const user = userEvent.setup();
      renderSidebar({ layout });

      await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

      expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute(
        'aria-expanded',
        'false'
      );
      expect(screen.queryByRole('button', { name: /Settings/u })).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Boards' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));

      expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toHaveAttribute(
        'aria-expanded',
        'true'
      );
      expect(screen.getByRole('button', { name: 'Expand Settings' })).toBeInTheDocument();
    }
  );

  it.each([
    ['desktop', false, '238px'],
    ['desktop', true, '72px'],
    ['tablet', false, '238px'],
    ['tablet', true, '76px'],
  ] as const)('is %s wide when collapsed is %s: %s', async (layout, collapsed, width) => {
    const user = userEvent.setup();
    renderSidebar({ layout });
    if (collapsed) await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

    const nav = screen.getByRole('navigation');
    const handle = screen.getByRole('button', { name: /sidebar/u });

    expect(handle).toBeInTheDocument();
    expect(nav).toHaveStyle({ width: '100%' });
    expect(
      styleRuleFor(
        screen.getAllByRole('generic', { hidden: true })[1] as HTMLElement
      )?.getPropertyValue('width')
    ).toBe(width);
  });

  it('drops the width transition under prefers-reduced-motion', () => {
    renderSidebar();

    const wrapper = screen.getAllByRole('generic', { hidden: true })[1] as HTMLElement;

    expect(styleRuleFor(wrapper)?.getPropertyValue('transition')).toBe('width 200ms ease-out');
    expect(
      mediaStyleRuleFor(wrapper, 'prefers-reduced-motion: reduce')?.getPropertyValue(
        'transition-duration'
      )
    ).toBe('0s');
  });

  it.each([
    ['Boards', '/boards'],
    ['Products', '/products'],
    ['Orders', '/orders'],
    ['Contacts', '/contacts'],
    ['Analytics', '/analytics'],
    ['Settings', '/settings'],
    ['Integrations', '/settings/integrations'],
    ['Webhooks', '/settings/webhooks'],
    ['Billing', '/settings/billing'],
  ])('keeps the %s row working on the rail: it navigates to %s', async (name, path) => {
    const user = userEvent.setup();
    renderSidebar();
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

    await user.click(screen.getByRole('link', { name }));

    expect(screen.getByLabelText('location')).toHaveTextContent(`${path}|{"focusMain":true}`);
  });

  it('keeps Sign out working on the rail: it signs out', async () => {
    const user = userEvent.setup();
    const signOut = jest.fn();
    renderSidebar({ signOut });
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('starts expanded on every mount: nothing is persisted', async () => {
    const user = userEvent.setup();
    const { unmount } = renderSidebar();
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    unmount();

    renderSidebar();

    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeInTheDocument();
  });

  it('renders no MUI ripple in the handle, Settings, Sign out or rows', () => {
    const { container } = renderSidebar();

    expect(container).not.toContainHTML('MuiTouchRipple');
  });

  it('keeps the page 41 px clear of the desktop rail, so it starts at x 125 (P-51)', async () => {
    const user = userEvent.setup();
    renderSidebar({ layout: 'desktop' });
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

    const wrapper = screen.getAllByRole('generic', { hidden: true })[1] as HTMLElement;

    expect(styleRuleFor(wrapper)?.getPropertyValue('margin-right')).toBe('41px');
  });

  it.each([
    ['desktop', false],
    ['tablet', false],
    ['tablet', true],
  ] as const)(
    'adds no right margin to the %s sidebar when collapsed is %s',
    async (layout, collapsed) => {
      const user = userEvent.setup();
      renderSidebar({ layout });
      if (collapsed) await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

      const wrapper = screen.getAllByRole('generic', { hidden: true })[1] as HTMLElement;

      expect(styleRuleFor(wrapper)?.getPropertyValue('margin-right')).toBe('');
    }
  );
});
