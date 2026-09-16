import { render } from '@testing-library/react';
import type { JSX } from 'react';
import { useFormContext } from 'react-hook-form';

import NotFound from '@/components/not-found/not-found';
import UIBackToMain from '@/components/ui-back-to-main';
import UIButton from '@/components/ui-button';
import UIForm from '@/components/ui-form';
import UIFormInputField from '@/components/ui-form-input-field';
import UILink from '@/components/ui-link';
import UILiveStatus from '@/components/ui-live-status';
import UITextField from '@/components/ui-text-field';
import UITypography from '@/components/ui-typography';
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
  { name: 'UIBackToMain', element: <UIBackToMain />, withProviders: true },
  { name: 'UIForm with a labelled field', element: <DemoForm />, withProviders: true },
  { name: 'NotFound page', element: <NotFound />, withProviders: true },
];

describe('WCAG 2.1 AA axe gate over the UI components (issue #118)', () => {
  it.each(componentCases)('$name has no axe violations', async ({ element, withProviders }) => {
    const { container } = withProviders ? renderWithProviders(element) : render(element);

    await expectNoA11yViolations(container);
  });
});
