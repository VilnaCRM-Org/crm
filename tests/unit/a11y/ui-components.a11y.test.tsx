import { render, screen } from '@testing-library/react';
import type { JSX } from 'react';
import { useFormContext } from 'react-hook-form';
import { Outlet, Route, Routes } from 'react-router';

import ErrorPage from '@/components/error-page';
import AppLayout from '@/components/layouts/app-layout';
import UIAppHeader from '@/components/ui-app-header';
import UIAppShell from '@/components/ui-app-shell';
import navigationItems from '@/components/ui-app-shell/navigation-items';
import UIBackToMain from '@/components/ui-back-to-main';
import UIButton from '@/components/ui-button';
import UIForm from '@/components/ui-form';
import UIFormInputField from '@/components/ui-form-input-field';
import UILink from '@/components/ui-link';
import UILiveStatus from '@/components/ui-live-status';
import UINavigationDrawer from '@/components/ui-navigation-drawer';
import UINavigationList from '@/components/ui-navigation-list';
import UIOfflineNotice from '@/components/ui-offline-notice';
import UISidebar from '@/components/ui-sidebar';
import UITextField from '@/components/ui-text-field';
import UITypography from '@/components/ui-typography';
import Home from '@/features/home';
import createAppShellLocaleI18n from '@tests/unit/utils/create-app-shell-locale-i18n';
import renderWithProviders from '@tests/unit/utils/render-with-providers';
import stubViewportWidth from '@tests/unit/utils/stub-viewport-width';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

jest.mock('@/assets/icons/arrows/back-arrow.svg', () => 'back-arrow-mock.svg');
jest.mock('@/assets/icons/logo/vilna-logo.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/illustrations/error-page/curve.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/illustrations/error-page/diamond.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/illustrations/error-page/dot-columns.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/illustrations/error-page/dot-rows.svg', () => ({ ReactComponent: 'svg' }));

interface DemoFields {
  email: string;
}

function DemoEmailField(): JSX.Element {
  const { control } = useFormContext<DemoFields>();
  return (
    <>
      <label htmlFor="email">Email</label>
      <UIFormInputField<DemoFields>
        control={control}
        rules={{ required: 'Email is required' }}
        defaultValue=""
        name="email"
        id="email"
        type="email"
      />
    </>
  );
}

function DemoForm(): JSX.Element {
  return (
    <UIForm<DemoFields>
      onSubmit={jest.fn()}
      defaultValues={{ email: '' }}
      title="Sign in"
      subtitle="Use your work email"
      submitLabel="Continue"
      submittingLabel="Signing in"
    >
      <DemoEmailField />
    </UIForm>
  );
}

function HomeRoutes({ withLayout = false }: { withLayout?: boolean }): JSX.Element {
  const home = <Route index element={<Home />} />;

  return (
    <Routes>
      <Route element={<Outlet context={{ signOut: jest.fn() }} />}>
        {withLayout ? <Route element={<AppLayout />}>{home}</Route> : home}
      </Route>
    </Routes>
  );
}

interface ComponentCase {
  name: string;
  element: JSX.Element;
  withProviders?: boolean;
  shell?: boolean;
}

const componentCases: ComponentCase[] = [
  { name: 'UIButton as a button', element: <UIButton>Save changes</UIButton> },
  {
    name: 'UIButton as a link',
    element: <UIButton to="/">Back home</UIButton>,
    withProviders: true,
  },
  { name: 'UIButton while loading', element: <UIButton loading>Saving</UIButton> },
  { name: 'UITextField', element: <UITextField id="email" label="Email" name="email" /> },
  {
    name: 'UITextField in its error state',
    element: <UITextField id="pw" label="Password" error helperText="Password is required" />,
  },
  { name: 'UILink', element: <UILink href="/docs">Documentation</UILink> },
  { name: 'UITypography heading', element: <UITypography component="h1">Title</UITypography> },
  { name: 'UILiveStatus', element: <UILiveStatus message="Saved" /> },
  {
    name: 'UIOfflineNotice while offline',
    element: <UIOfflineNotice online={false} />,
    withProviders: true,
  },
  {
    name: 'UIOfflineNotice while online',
    element: <UIOfflineNotice online />,
    withProviders: true,
  },
  { name: 'UIBackToMain', element: <UIBackToMain />, withProviders: true },
  { name: 'UIForm with a labelled field', element: <DemoForm />, withProviders: true },
  {
    name: 'ErrorPage 404 as the main landmark',
    element: <ErrorPage variant="notFound" landmark="main" />,
    withProviders: true,
  },
  {
    name: 'ErrorPage 403 as the main landmark',
    element: <ErrorPage variant="forbidden" landmark="main" />,
    withProviders: true,
  },
  {
    name: 'ErrorPage 5xx as the main landmark',
    element: <ErrorPage variant="serverError" landmark="main" />,
    withProviders: true,
  },
  {
    name: 'ErrorPage 403 as a region',
    element: <ErrorPage variant="forbidden" landmark="region" />,
    withProviders: true,
  },
  { name: 'Home page', element: <HomeRoutes />, withProviders: true },
  {
    name: 'UIAppHeader on desktop',
    element: <UIAppHeader layout="desktop" />,
    withProviders: true,
    shell: true,
  },
  {
    name: 'UIAppHeader on mobile with its navigation',
    element: (
      <UIAppHeader layout="mobile" navigation={{ items: navigationItems, signOut: jest.fn() }} />
    ),
    withProviders: true,
    shell: true,
  },
  {
    name: 'UISidebar expanded',
    element: <UISidebar layout="desktop" items={navigationItems} signOut={jest.fn()} />,
    withProviders: true,
    shell: true,
  },
  {
    name: 'UINavigationList in its expanded and rail variants',
    element: (
      <>
        <UINavigationList
          layout="desktop"
          variant="expanded"
          items={navigationItems}
          signOut={jest.fn()}
        />
        <UINavigationList
          layout="tablet"
          variant="rail"
          items={navigationItems}
          signOut={jest.fn()}
        />
      </>
    ),
    withProviders: true,
    shell: true,
  },
  {
    name: 'UINavigationDrawer while closed',
    element: (
      <UINavigationDrawer
        open={false}
        id="drawer"
        items={navigationItems}
        signOut={jest.fn()}
        onClose={jest.fn()}
        onNavigate={jest.fn()}
      />
    ),
    withProviders: true,
    shell: true,
  },
  {
    name: 'UIAppShell on desktop',
    element: <UIAppShell signOut={jest.fn()} />,
    withProviders: true,
    shell: true,
  },
];

describe('WCAG 2.1 AA axe gate over the UI components (issue #118)', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it.each(componentCases)(
    '$name has no axe violations',
    async ({ element, withProviders, shell }) => {
      stubViewportWidth(shell ? 1440 : 0);
      const { container } = withProviders
        ? renderWithProviders(element, shell ? { i18nMock: createAppShellLocaleI18n('uk') } : {})
        : render(element);

      await expectNoA11yViolations(container);
    }
  );

  it.each(['UIAppHeader', 'UISidebar', 'UINavigationList', 'UINavigationDrawer', 'UIAppShell'])(
    'carries a componentCases row for the shell component %s (NFR-16)',
    (component) => {
      expect(componentCases.some(({ name }) => name.startsWith(component))).toBe(true);
    }
  );

  it('keeps one main, one h1 and the footer outside main on the home page', async () => {
    const { container } = renderWithProviders(<HomeRoutes withLayout />);

    const footer = await screen.findByRole('contentinfo');

    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('main')).not.toContainElement(footer);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    await expectNoA11yViolations(container);
  });
});
