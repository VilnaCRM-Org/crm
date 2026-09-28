import { render, screen } from '@testing-library/react';
import type { JSX } from 'react';
import { useFormContext } from 'react-hook-form';
import { Outlet, Route, Routes } from 'react-router';

import AppLayout from '@/components/layouts/app-layout';
import NotFound from '@/components/not-found/not-found';
import UIBackToMain from '@/components/ui-back-to-main';
import UIButton from '@/components/ui-button';
import UIForm from '@/components/ui-form';
import UIFormInputField from '@/components/ui-form-input-field';
import UILink from '@/components/ui-link';
import UILiveStatus from '@/components/ui-live-status';
import UIOfflineNotice from '@/components/ui-offline-notice';
import UITextField from '@/components/ui-text-field';
import UITypography from '@/components/ui-typography';
import Home from '@/features/home';
import renderWithProviders from '@tests/unit/utils/render-with-providers';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

jest.mock('@/assets/icons/arrows/back-arrow.svg', () => 'back-arrow-mock.svg');
jest.mock('@/assets/icons/logo/vilna-logo.svg', () => ({ ReactComponent: 'svg' }));

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
  { name: 'NotFound page', element: <NotFound />, withProviders: true },
  { name: 'Home page', element: <HomeRoutes />, withProviders: true },
];

describe('WCAG 2.1 AA axe gate over the UI components (issue #118)', () => {
  it.each(componentCases)('$name has no axe violations', async ({ element, withProviders }) => {
    const { container } = withProviders ? renderWithProviders(element) : render(element);

    await expectNoA11yViolations(container);
  });

  it('keeps one main, one h1 and the footer outside main on the home page', async () => {
    const { container } = renderWithProviders(<HomeRoutes withLayout />);

    const footer = await screen.findByRole('contentinfo');

    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('main')).not.toContainElement(footer);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    await expectNoA11yViolations(container);
  });
});
